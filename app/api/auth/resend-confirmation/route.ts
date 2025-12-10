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

type ResendBody = {
  email?: string;
};

const GENERIC_MESSAGE =
  "Se existir uma conta com este e-mail, enviaremos um novo link de confirmação.";

export async function POST(request: NextRequest) {
  let body: ResendBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  }

  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${APP_URL}/sign-in?confirmed=1`,
      },
    });

    if (error) {
      console.error(
        "[auth/resend-confirmation] Erro ao reenviar confirmação:",
        error
      );
    }

    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  } catch (error) {
    console.error(
      "[auth/resend-confirmation] Erro inesperado ao processar reenvio:",
      error
    );
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  }
}
