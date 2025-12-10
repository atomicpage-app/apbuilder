import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Supabase não configurado corretamente. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

type SignInBody = {
  email?: string;
  password?: string;
};

function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
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
    return NextResponse.json(
      { error: "Informe e-mail e senha." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!error && data.session && data.user) {
    // Neste ponto, o @supabase/ssr já configurou os cookies de sessão.
    return NextResponse.json(
      {
        message: "Login realizado com sucesso.",
        userId: data.user.id,
        needsEmailConfirmation: false,
      },
      { status: 200 }
    );
  }

  const message =
    error?.message ||
    "Não foi possível entrar. Verifique seus dados e tente novamente.";

  const lowerMessage = message.toLowerCase();
  const needsEmailConfirmation =
    lowerMessage.includes("confirm") || lowerMessage.includes("verify");

  if (needsEmailConfirmation) {
    return NextResponse.json(
      {
        error:
          "Sua conta ainda não foi confirmada. Verifique seu e-mail ou solicite o reenvio.",
        needsEmailConfirmation: true,
      },
      { status: 401 }
    );
  }

  return NextResponse.json(
    {
      error: message,
      needsEmailConfirmation: false,
    },
    { status: 401 }
  );
}
