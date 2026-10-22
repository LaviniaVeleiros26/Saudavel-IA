export class IaError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function validateFields(config, values) {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    throw new IaError("Envie os campos preenchidos para analisar.", 400);
  }
  const fields = Object.create(null);
  let total = 0;
  for (const field of config.campos) {
    const value = values[field.id];
    if (typeof value !== "string" || !value.trim()) {
      throw new IaError(`Preencha o campo: ${field.rotulo}.`, 400);
    }
    total += value.length;
    if (total > 20000) throw new IaError("O texto deve ter no máximo 20.000 caracteres.", 400);
    fields[field.id] = value;
  }
  return fields;
}

export function fillPrompt(prompt, fields) {
  return prompt.replace(/\{([^{}]+)\}/g, (placeholder, id) =>
    Object.hasOwn(fields, id) ? fields[id] : placeholder);
}

const example = `VEREDITO: SUSPEITO

POR QUE:
- Esta é uma resposta de exemplo do modo de teste. A mensagem não foi analisada por uma IA.
- É preciso verificar a origem e o contexto antes de agir.

O QUE FAZER AGORA:
1. Não clique nos links nem envie senhas, códigos ou dinheiro.
2. Confirme o pedido por um canal oficial que você já conhece.
3. Peça ajuda a alguém de confiança antes de responder.`;

export async function generateResponse(config, fields, { apiKey, fetchImpl = fetch } = {}) {
  if (config.modoTeste) return example;
  if (!apiKey?.trim()) throw new IaError("A chave da IA não foi configurada no servidor.", 503);

  let response;
  try {
    response = await fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: config.modelo,
        messages: [{ role: "user", content: fillPrompt(config.prompt, fields) }],
        max_tokens: 900,
      }),
      signal: AbortSignal.timeout(45000),
      cache: "no-store",
    });
  } catch {
    throw new IaError("Não foi possível conectar à IA. Tente novamente em instantes.", 502);
  }
  if (response.status === 429) throw new IaError("Você atingiu o limite de uso de hoje.", 429);
  if (response.status === 401) throw new IaError("Chave da IA inválida.", 401);
  if (!response.ok) throw new IaError("O serviço de IA não conseguiu analisar a mensagem. Tente novamente em instantes.", 502);

  try {
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) throw new Error("empty response");
    return text;
  } catch {
    throw new IaError("A IA não retornou uma resposta válida. Tente novamente.", 502);
  }
}
