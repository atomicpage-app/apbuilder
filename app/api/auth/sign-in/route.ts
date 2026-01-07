// app/api/auth/sign-in/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

<<<<<<< HEAD
function badRequest(message: string) {
  return NextResponse.json({ error: "bad_request", message }, { status: 400 });
}

function internalError(message = "Erro interno") {
  return NextResponse.json({ error: "internal_error", message }, { status: 500 });
}
=======
type SignInBody = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  let body: SignInBody;
>>>>>>> origin/chore/auth-sanitize-next

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Payload inválido.");
    }

    const { email, password } = body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return badRequest("Email e senha são obrigatórios.");
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return badRequest("Credenciais inválidas.");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro no sign-in:", err);
    return internalError();
  }
<<<<<<< HEAD
=======

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json(
      { error: "Informe e-mail e senha." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!error && data.session && data.user) {
    // IMPORTANTE: aqui o @supabase/ssr deve setar cookies automaticamente via cookieStore.setAll()
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
>>>>>>> origin/chore/auth-sanitize-next
}
