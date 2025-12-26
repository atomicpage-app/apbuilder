import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type SignInBody = {
  email?: string;
  password?: string;
};

function isNeedsEmailConfirmation(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("confirm") ||
    m.includes("verify") ||
    m.includes("not confirmed") ||
    m.includes("email not confirmed")
  );
}

export async function POST(request: NextRequest) {
  let body: SignInBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Payload inválido. Envie um JSON com email e password." },
      { status: 400 }
    );
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
  }

  // IMPORTANTE: o response que será retornado é o mesmo usado no adapter de cookies
  const response = NextResponse.json({ ok: true }, { status: 200 });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        response.cookies.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (!error && data.session && data.user) {
    // Recria o JSON final no mesmo response, preservando Set-Cookie já anexado
    response.headers.set("content-type", "application/json; charset=utf-8");
    return NextResponse.json(
      {
        message: "Login realizado com sucesso.",
        userId: data.user.id,
        needsEmailConfirmation: false,
      },
      { status: 200, headers: response.headers }
    );
  }

  const message =
    error?.message ||
    "Não foi possível entrar. Verifique seus dados e tente novamente.";

  if (isNeedsEmailConfirmation(message)) {
    return NextResponse.json(
      {
        error:
          "Sua conta ainda não foi confirmada. Verifique seu e-mail ou solicite o reenvio.",
        needsEmailConfirmation: true,
      },
      { status: 401, headers: response.headers }
    );
  }

  return NextResponse.json(
    { error: message, needsEmailConfirmation: false },
    { status: 401, headers: response.headers }
  );
}
