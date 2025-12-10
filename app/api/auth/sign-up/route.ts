import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Supabase não configurado corretamente. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

if (!APP_URL) {
  throw new Error(
    "APP_URL não configurado. Defina NEXT_PUBLIC_APP_URL com a URL pública da aplicação (ex.: http://localhost:3000)."
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type SignUpBody = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  let body: SignUpBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Payload inválido. Envie um JSON com name, email e password." },
      { status: 400 }
    );
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Preencha nome, e-mail e senha." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "A senha deve ter ao menos 6 caracteres." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${APP_URL}/sign-in?confirmed=1`,
    },
  });

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Não foi possível criar sua conta. Verifique os dados e tente novamente.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      message:
        "Conta criada com sucesso. Verifique seu e-mail para confirmar o cadastro.",
      userId: data.user?.id ?? null,
    },
    { status: 201 }
  );
}
