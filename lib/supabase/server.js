import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfiguration } from "./config.mjs";

export async function createClient() {
  const { url, key, missing } = getSupabaseConfiguration();
  if (missing.length) return null;

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; middleware refreshes them.
        }
      },
    },
  });
}
