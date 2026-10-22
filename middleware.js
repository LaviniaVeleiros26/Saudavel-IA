import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getSupabaseConfiguration } from "./lib/supabase/config.mjs";

export async function middleware(request) {
  let response = NextResponse.next({ request });
  const { url, key, missing, invalid } = getSupabaseConfiguration();
  if (missing.length || invalid.length) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Validate and refresh cookies before Server Components read the session.
  await supabase.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

// The installed Supabase client requires native WebSocket support during initialization.
export const config = { matcher: ["/", "/login"], runtime: "nodejs" };
