import { test } from "node:test";
import assert from "node:assert/strict";
import { desafio } from "../../desafio.js";
import { IaError, validateFields, fillPrompt, generateResponse } from "../../lib/ia.mjs";

const realConfig = { ...desafio, modoTeste: false };

test("modo de teste retorna exemplo sem chave e sem chamar IA", async () => {
  const response = await generateResponse(desafio, { mensagem: "teste" }, {
    fetchImpl() { throw new Error("A rede não deve ser chamada no modo de teste"); },
  });
  assert.ok(response.includes("VEREDITO: SUSPEITO"));
  assert.ok(response.includes("modo de teste"));
});

test("campos são validados e placeholders são substituídos literalmente uma vez", () => {
  const config = { campos: [{ id: "a", rotulo: "Primeiro" }, { id: "b", rotulo: "Segundo" }] };
  const fields = validateFields(config, { a: "$& {b}", b: "Texto\ncom linhas", ignored: "não entra" });
  assert.equal(fillPrompt("{a} | {b} | {a} | {desconhecido}", fields), "$& {b} | Texto\ncom linhas | $& {b} | {desconhecido}");
  assert.equal(Object.keys(fields).length, 2);
  for (const value of [null, [], {}, { a: 4 }, { a: "", b: "teste" }, { a: "teste", b: "x".repeat(20001) }]) {
    assert.throws(() => validateFields(config, value), error => error instanceof IaError && error.status === 400);
  }
});

test("OpenRouter recebe modelo, prompt preenchido, chave no cabeçalho e max_tokens 900", async () => {
  let calls = 0;
  const text = await generateResponse(realConfig, { mensagem: "Mensagem real\ncom linhas" }, {
    apiKey: "test-server-key",
    async fetchImpl(url, options) {
      calls++;
      assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, "Bearer test-server-key");
      const payload = JSON.parse(options.body);
      assert.equal(payload.model, "openrouter/free");
      assert.equal(payload.max_tokens, 900);
      assert.ok(payload.messages[0].content.endsWith("MENSAGEM: Mensagem real\ncom linhas"));
      assert.ok(!options.body.includes("test-server-key"));
      return Response.json({ choices: [{ message: { content: "VEREDITO: SUSPEITO\nPOR QUE: exemplo" } }] });
    },
  });
  assert.equal(calls, 1);
  assert.equal(text, "VEREDITO: SUSPEITO\nPOR QUE: exemplo");
});

for (const [status, message] of [[429, "Você atingiu o limite de uso de hoje."], [401, "Chave da IA inválida."]]) {
  test(`erro ${status} da OpenRouter é preservado e traduzido`, async () => {
    await assert.rejects(generateResponse(realConfig, { mensagem: "teste" }, {
      apiKey: "test-key", fetchImpl: async () => new Response("provider detail", { status }),
    }), error => error.status === status && error.message === message);
  });
}

test("falhas de chave ausente, serviço, rede e resposta inválida são claras em português", async () => {
  await assert.rejects(generateResponse(realConfig, { mensagem: "teste" }), error => error.status === 503);
  for (const fetchImpl of [
    async () => new Response("provider detail", { status: 500 }),
    async () => { throw new Error("network internal detail"); },
    async () => Response.json({ choices: [] }),
    async () => new Response("not-json", { status: 200 }),
  ]) {
    await assert.rejects(generateResponse(realConfig, { mensagem: "teste" }, { apiKey: "test-key", fetchImpl }), error => {
      assert.equal(error.status, 502);
      assert.ok(!error.message.includes("detail"));
      assert.ok(!error.message.includes("test-key"));
      return true;
    });
  }
});
