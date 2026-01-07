<<<<<<< HEAD
// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
=======
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
>>>>>>> origin/chore/auth-sanitize-next

const SUPABASE_URL_ENV = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY_ENV = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

<<<<<<< HEAD
if (!SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!SUPABASE_ANON_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
}
=======
if (!SUPABASE_URL_ENV || !SUPABASE_ANON_KEY_ENV) {
  throw new Error(
    "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

const SUPABASE_URL: string = SUPABASE_URL_ENV;
const SUPABASE_ANON_KEY: string = SUPABASE_ANON_KEY_ENV;
>>>>>>> origin/chore/auth-sanitize-next

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
<<<<<<< HEAD
      // Server Components não podem alterar cookies
      set() {},
      remove() {},
    },
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) return null;
  return data.user ?? null;
}
=======
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          cookieStore.set(cookie);
        }
      },
    },
  });
}
>>>>>>> origin/chore/auth-sanitize-next
