import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL_ENV = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY_ENV = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL_ENV || !SUPABASE_ANON_KEY_ENV) {
  throw new Error(
    "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

const SUPABASE_URL: string = SUPABASE_URL_ENV;
const SUPABASE_ANON_KEY: string = SUPABASE_ANON_KEY_ENV;

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          cookieStore.set(cookie);
        }
      },
    },
  });
}
