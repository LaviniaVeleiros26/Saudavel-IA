import { test } from "node:test";
import assert from "node:assert/strict";
import { authError } from "../../lib/supabase/errors.js";

test("identifica chave rejeitada pelo gateway sem código de autenticação", () => {
  for (const error of [
    { message: "Invalid API key", status: 401 },
    { message: "Invalid API key", status: 400 },
    { code: "invalid_api_key" },
    { status: 401 },
  ]) {
    const result = authError(error);
    assert.ok(result.includes("A chave pública do Supabase não foi aceita"));
    assert.ok(result.includes("mesmo projeto"));
    assert.ok(result.includes("somente a chave"));
  }
});

test("preserva erros conhecidos e traduz respostas antigas sem código", () => {
  assert.equal(authError({ code: "invalid_credentials", status: 401 }), "E-mail ou senha incorretos.");
  assert.equal(authError({ message: "Invalid login credentials" }), "E-mail ou senha incorretos.");
  assert.equal(authError({ message: "Email not confirmed" }), "Confirme seu e-mail antes de entrar.");
  assert.equal(authError({ message: "User already registered" }), "Já existe uma conta com este e-mail.");
});

test("distingue limites de tentativas, falha de conexão e indisponibilidade", () => {
  assert.match(authError({ status: 429 }), /Muitas tentativas/);
  assert.match(authError({ name: "AuthRetryableFetchError", status: 0 }), /Não foi possível conectar ao Supabase/);
  assert.match(authError({ status: 503 }), /indisponível.*HTTP 503/);
});

test("referência de suporte não expõe mensagens nem valores desconhecidos", () => {
  const result = authError({ status: 422, code: "unknown_auth_error", message: "sensitive-provider-response" });
  assert.ok(result.includes("HTTP 422"));
  assert.ok(result.includes("unknown_auth_error"));
  assert.ok(!result.includes("sensitive-provider-response"));
  assert.ok(!authError({ code: "sb_publishable_PRIVATE123" }).includes("sb_publishable_PRIVATE123"));
  assert.equal(authError(null), "Não foi possível concluir a solicitação. Tente novamente em instantes.");
});


test("identifica falha e limite no envio de confirmação durante o cadastro", () => {
  assert.match(authError({ message: "Error sending confirmation email", code: "unexpected_failure", status: 500 }), /Não foi possível enviar o e-mail de confirmação/);
  assert.match(authError({ message: "Email rate limit exceeded", status: 429 }), /Muitos e-mails foram solicitados/);
});
