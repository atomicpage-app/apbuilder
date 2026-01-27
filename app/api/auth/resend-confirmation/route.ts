// app/api/auth/resend-confirmation/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { sha256 } from "@/lib/security/hash";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

async function verifyTurnstile(
  token: string,
  ip?: string
): Promise<boolean> {
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY!,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    }
  );

  if (!res.ok) return false;
  const data = await res.json();
  return data.success === true;
}

export async function POST(request: NextRequest) {
  const ts = Date.now();

  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    const body = await request.json().catch(() => null);
    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : null;

    const turnstileToken =
      typeof body?.turnstileToken === "string"
        ? body.turnstileToken
        : null;

    if (!email || !email.includes("@") || !turnstileToken) {
      return json({ ok: false, error: "invalid_request" }, 400);
    }

    const turnstileOk = await verifyTurnstile(turnstileToken, ip);

    if (!turnstileOk) {
      console.warn({
        level: "warn",
        event: "auth.resend_confirmation",
        result: "bot_blocked",
        ts,
      });

      return json({ ok: false, error: "invalid_request" }, 400);
    }

    // Hashes mantidos para logging/observabilidade
    const ipHash = sha256(ip);
    const emailHash = sha256(email);

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.auth.resend({
      type: "signup",
      email,
    });

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "no-reply@seusite.com",
      to: email,
      subject: "Confirme seu e-mail",
      html: `
        <p>Você solicitou um novo link de confirmação.</p>
        <p>Se não foi você, ignore este e-mail.</p>
      `,
    });

    console.info({
      level: "info",
      event: "auth.resend_confirmation",
      result: "ok",
      ip_hash: ipHash,
      email_hash: emailHash,
      ts,
    });

    return json({
      ok: true,
      message:
        "Se existir uma conta com esse e-mail, um novo link de confirmação foi enviado.",
    });
  } catch (err) {
    console.error({
      level: "error",
      event: "auth.resend_confirmation",
      result: "provider_error",
      message: err instanceof Error ? err.message : "unknown",
      ts,
    });

    return json({ ok: false, error: "internal_error" }, 500);
  }
}
