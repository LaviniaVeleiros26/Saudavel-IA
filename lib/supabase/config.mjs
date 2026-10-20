export function getSupabaseConfiguration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const missing = [];
  if (!url?.trim()) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!key?.trim()) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url, key, missing };
}

export function getConfigurationError() {
  const { missing } = getSupabaseConfiguration();
  if (!missing.length) return null;
  return `Configuração incompleta nesta implantação: ${missing.join(" e ")}. Configure ${missing.length === 1 ? "essa variável" : "essas variáveis"} na Vercel e faça um novo deploy.`;
}
