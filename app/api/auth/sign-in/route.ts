import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function POST(req: NextRequest) {
  // ✅ Response válida para Route Handler
  const res = NextResponse.json({ ok: false }, { status: 200 });

  const supabase = createSupabaseRouteClient(req, res);

  let body: { email?: string; password?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Payload inválido." },
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

  // 🔐 Login
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Falha no login." },
      { status: 401 }
    );
  }

  const user = data.user;

  // 🔁 P3.3 — ativação automática pós-confirmação
  if (user.email_confirmed_at) {
    const { data: account } = await supabase
      .from("accounts")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (account && account.status !== "active") {
      await supabase
        .from("accounts")
        .update({ status: "active" })
        .eq("user_id", user.id);
    }
  }

  // ✅ Retornar a MESMA response (cookies já setados)
  res.headers.set("Cache-Control", "no-store");
  return NextResponse.json({ ok: true }, { headers: res.headers });
}
