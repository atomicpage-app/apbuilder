import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // 1. Verifica se account já existe
  const { data: existingAccount, error: accountCheckError } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (accountCheckError) {
    console.error("Erro ao verificar account:", accountCheckError);
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (!existingAccount) {
    const tenantId = randomUUID();

    // 2. Cria account (gera tenant_id aqui)
    const { error: insertAccountError } = await supabase
      .from("accounts")
      .insert({
        user_id: user.id,
        tenant_id: tenantId,
        email: user.email ?? "",
        name: user.user_metadata?.name ?? "",
        status: "active",
      });

    if (insertAccountError) {
      console.error("Erro ao criar account:", insertAccountError);
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  // 3. Continua fluxo normal
  return NextResponse.redirect(new URL("/app", req.url));
}
