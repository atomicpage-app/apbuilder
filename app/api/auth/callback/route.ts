import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // 1. Verifica se account já existe
  const { data: existingAccount } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingAccount) {
    // 2. Cria tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({})
      .select("id")
      .single();

    if (tenantError || !tenant) {
      throw new Error("Falha ao criar tenant");
    }

    // 3. Cria account
    const { error: accountError } = await supabase.from("accounts").insert({
      user_id: user.id,
      tenant_id: tenant.id,
      status: "active",
    });

    if (accountError) {
      throw new Error("Falha ao criar account");
    }
  }

  // 4. Fluxo normal pós-confirmação
  return NextResponse.redirect(new URL("/app", req.url));
}
