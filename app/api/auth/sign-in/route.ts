// app/api/auth/sign-in/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function badRequest(message: string) {
  return NextResponse.json({ error: "bad_request", message }, { status: 400 });
}

function internalError(message = "Erro interno") {
  return NextResponse.json({ error: "internal_error", message }, { status: 500 });
}

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
}
