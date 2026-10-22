"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";

export async function saveAnalysis(previousState, formData) {
  const texto = String(formData.get("texto") || "");
  if (!texto.trim()) return { error: "Digite um texto antes de analisar." };
  if (texto.length > 20000) return { error: "O texto deve ter no máximo 20.000 caracteres." };

  const supabase = await createClient();
  if (!supabase) return { error: "O armazenamento ainda não está configurado. Entre em contato com a responsável pelo site." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Preserve the current analyzer behavior. No external AI service is configured.
  const resultado = texto;
  try {
    const { data, error } = await supabase
      .from("planodesite")
      .insert({ user_id: user.id, Texto: texto, resultado })
      .select("id,texto:Texto,resultado,created_at")
      .single();

    if (error) {
      if (error.code === "42501") {
        return { error: "Não foi possível salvar: sua conta não tem permissão para essa operação. Entre em contato com a responsável pelo site." };
      }
      return { error: "Não foi possível salvar sua análise. Tente novamente em instantes." };
    }
    revalidatePath("/");
    return { analysis: data, message: "Análise salva com sucesso." };
  } catch {
    return { error: "Não foi possível conectar ao serviço para salvar. Tente novamente em instantes." };
  }
}
