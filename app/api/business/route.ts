import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

type CreateBusinessAddressPayload = {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  complement?: string | null;
};

type CreateBusinessPayload = {
  name: string;
  description: string;
  phoneCommercial: string;
  mobileCommercial?: string | null;
  emailCommercial: string;
  address: CreateBusinessAddressPayload;
};

function json(status: number, body: unknown) {
  const res = NextResponse.json(body, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function badRequest(message: string) {
  return json(400, { error: "bad_request", message });
}

function unauthorized(message = "Usuário não autenticado.") {
  return json(401, { error: "unauthorized", message });
}

function forbidden(message: string) {
  return json(403, { error: "forbidden", message });
}

function conflict(message: string) {
  return json(409, { error: "conflict", message });
}

function internalError(message = "Erro interno.") {
  return json(500, { error: "internal_error", message });
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function validatePayload(body: unknown): CreateBusinessPayload | null {
  if (typeof body !== "object" || body === null) return null;

  const {
    name,
    description,
    phoneCommercial,
    mobileCommercial,
    emailCommercial,
    address,
  } = body as Record<string, unknown>;

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(description) ||
    !isNonEmptyString(phoneCommercial) ||
    !isNonEmptyString(emailCommercial)
  ) {
    return null;
  }

  if (typeof address !== "object" || address === null) return null;

  const { street, number, neighborhood, city, state, zip, complement } =
    address as Record<string, unknown>;

  if (
    !isNonEmptyString(street) ||
    !isNonEmptyString(number) ||
    !isNonEmptyString(neighborhood) ||
    !isNonEmptyString(city) ||
    !isNonEmptyString(state) ||
    !isNonEmptyString(zip)
  ) {
    return null;
  }

  return {
    name,
    description,
    phoneCommercial,
    mobileCommercial:
      isNonEmptyString(mobileCommercial) ? mobileCommercial : null,
    emailCommercial,
    address: {
      street,
      number,
      neighborhood,
      city,
      state,
      zip,
      complement: isNonEmptyString(complement) ? complement : null,
    },
  };
}

async function getOrCreateAccount(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, unknown>;
  }
) {
  const { data: existing, error } = await supabase
    .from("accounts")
    .select("id, tenant_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (existing) return existing;

  const name =
    typeof user.user_metadata?.name === "string" &&
    user.user_metadata.name.trim().length > 0
      ? user.user_metadata.name.trim()
      : user.email.split("@")[0];

  const { data: created, error: insertError } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      email: user.email,
      name,
      status: "active",
    })
    .select("id, tenant_id, status")
    .single();

  if (insertError || !created) {
    throw insertError ?? new Error("Falha ao criar account.");
  }

  return created;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return unauthorized();
    }

    // 🔒 Garantia explícita para TS e regra de negócio
    if (!user.email) {
      return badRequest("Usuário sem e-mail válido.");
    }

    const account = await getOrCreateAccount(supabase, {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    });

    if (account.status !== "active") {
      return forbidden(
        "Conta ainda não está ativa. Confirme seu e-mail para continuar."
      );
    }

    const tenantId = account.tenant_id;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("JSON inválido.");
    }

    const payload = validatePayload(body);
    if (!payload) {
      return badRequest("Payload inválido.");
    }

    const { data: existing } = await supabase
      .from("business")
      .select("id")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (existing) {
      return conflict("Já existe um negócio para este tenant.");
    }

    const { error: insertError } = await supabase.from("business").insert({
      tenant_id: tenantId,
      status: "draft",
      name: payload.name,
      description: payload.description,
      phone_commercial: payload.phoneCommercial,
      mobile_commercial: payload.mobileCommercial,
      email_commercial: payload.emailCommercial,
      address_street: payload.address.street,
      address_number: payload.address.number,
      address_neighborhood: payload.address.neighborhood,
      address_city: payload.address.city,
      address_state: payload.address.state,
      address_zip: payload.address.zip,
      address_complement: payload.address.complement,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return conflict("Já existe um negócio para este tenant.");
      }
      console.error(insertError);
      return internalError("Falha ao criar o negócio.");
    }

    return json(201, { ok: true });
  } catch (err) {
    console.error("POST /api/business erro:", err);
    return internalError();
  }
}
