import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RequireAuthOk = {
  ok: true;
  user: User;
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
};

type RequireAuthFail = {
  ok: false;
  response: NextResponse;
};

function jsonNoStore(status: number, body: unknown) {
  const res = NextResponse.json(body, { status });
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

export async function requireAuth(): Promise<RequireAuthOk | RequireAuthFail> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return {
      ok: false,
      response: jsonNoStore(401, {
        error: "unauthorized",
        message: "Usuário não autenticado.",
      }),
    };
  }

  return { ok: true, user: data.user, supabase };
}
