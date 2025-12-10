import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Falha de configuração em tempo de build/boot
  // Preferível falhar cedo do que mascarar erro de infra
  throw new Error(
    "Supabase não configurado corretamente. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
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
      // Se quiser redirecionar para uma rota específica ao confirmar:
      // emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    // Mensagens comuns do Supabase: "User already registered", etc.
    return NextResponse.json(
      {
        error:
          error.message ||
          "Não foi possível criar sua conta. Verifique os dados e tente novamente.",
      },
      { status: 400 }
    );
  }

  // Não retornamos tokens/sessões aqui. Foco no fluxo de confirmação.
  return NextResponse.json(
    {
      message:
        "Conta criada com sucesso. Verifique seu e-mail para confirmar o cadastro.",
      userId: data.user?.id ?? null,
    },
    { status: 201 }
  );
}
