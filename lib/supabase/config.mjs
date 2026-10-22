export function getSupabaseConfiguration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const missing = [];
  if (!url?.trim()) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!key?.trim()) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const invalid = [];
  if (url) {
    try {
      if (!/^https?:\/\//i.test(url)) throw new Error("invalid protocol");
      new URL(url);
    } catch {
      invalid.push("NEXT_PUBLIC_SUPABASE_URL");
    }
  }
  return { url, key, missing, invalid };
}

export function getConfigurationError() {
  const { missing, invalid } = getSupabaseConfiguration();
  const messages = [];
  if (missing.length) {
    messages.push(`Configuração incompleta nesta implantação: ${missing.join(" e ")}. Configure ${missing.length === 1 ? "essa variável" : "essas variáveis"} na Vercel e faça um novo deploy.`);
  }
  if (invalid.length) {
    messages.push("NEXT_PUBLIC_SUPABASE_URL está inválida. Na Vercel, preencha o campo Valor somente com a URL HTTP ou HTTPS do projeto Supabase, sem o nome da variável, sem sinal de igual e sem aspas. Depois faça um novo deploy.");
  }
  return messages.length ? messages.join(" ") : null;
}
