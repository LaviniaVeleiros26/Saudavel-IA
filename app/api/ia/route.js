import { revalidatePath } from "next/cache";
import { desafio } from "../../../desafio";
import { createClient } from "../../../lib/supabase/server";
import { IaError, validateFields, generateResponse, formatEntry } from "../../../lib/ia.mjs";

export const runtime = "nodejs";
export const maxDuration = 60;

function textResponse(text, status = 200) {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" },
  });
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    if (!supabase) return textResponse("O acesso ainda não está configurado. Entre em contato com a responsável pelo site.", 503);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return textResponse("Sua sessão expirou. Entre novamente para analisar a mensagem.", 403);

    let values;
    try { values = await request.json(); }
    catch { return textResponse("Não foi possível ler os campos enviados. Tente novamente.", 400); }
    const fields = validateFields(desafio, values);
    const resultado = await generateResponse(desafio, fields, { apiKey: process.env.OPENROUTER_API_KEY });
    const entrada = formatEntry(desafio, fields);
    const { error } = await supabase.from("respostas").insert({ user_id: user.id, entrada, resposta: resultado });
    if (error) {
      if (error.code === "42501") {
        return textResponse("Não foi possível salvar: sua conta não tem permissão para essa operação. Entre em contato com a responsável pelo site.", 403);
      }
      return textResponse("Não foi possível salvar sua análise. Tente novamente em instantes.", 502);
    }
    revalidatePath("/historico");
    return textResponse(resultado);
  } catch (error) {
    if (error instanceof IaError) return textResponse(error.message, error.status);
    return textResponse("Não foi possível concluir a análise. Tente novamente em instantes.", 500);
  }
}
