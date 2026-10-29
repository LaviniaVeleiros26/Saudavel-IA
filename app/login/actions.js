"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { authError } from "../../lib/supabase/errors";
import { getConfigurationError } from "../../lib/supabase/config.mjs";

export async function authenticate(previousState, formData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const intent = formData.get("intent");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Informe um endereço de e-mail válido." };
  }
  if (!password) return { error: "Informe sua senha." };
  if (intent !== "login" && intent !== "signup") {
    return { error: "Escolha Entrar ou Criar conta." };
  }
  if (intent === "signup" && password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }

  try {
    const supabase = await createClient();
    if (!supabase) return { error: getConfigurationError() };

    if (intent === "signup") {
      const origin = (await headers()).get("origin");
      const options = origin && /^https?:\/\//.test(origin)
        ? { emailRedirectTo: new URL("/auth/callback", origin).toString() }
        : undefined;
      const { data, error } = await supabase.auth.signUp({ email, password, options });
      if (error) return { error: authError(error) };
      if (!data.session) {
        return { message: "Se o cadastro puder ser realizado, você receberá um e-mail de confirmação. Confira também a caixa de spam." };
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: authError(error) };
    }
  } catch {
    return { error: "Não foi possível conectar ao serviço de acesso. Tente novamente em instantes." };
  }
  redirect("/");
}

export async function signOut() {
  try {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) return { error: authError(error) };
    }
  } catch {
    return { error: "Não foi possível sair. Verifique sua conexão e tente novamente." };
  }
  redirect("/login");
}
