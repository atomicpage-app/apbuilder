import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth/require-auth";

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
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

function badRequest(message: string) {
  return json(400, { error: "bad_request", message });
}

function forbidden(message = "Acesso negado.") {
  return json(403, { error: "forbidden", message });
}

function conflict(message: string) {
  return json(409, { error: "conflict", message });
}

function isValidPayload(p: CreateBusinessPayload) {
  if (!p?.name || !p?.description || !p?.phoneCommercial || !p?.emailCommercial) {
    return false;
  }

  const a = p.address;
  if (
    !a?.street ||
    !a?.number ||
    !a?.neighborhood ||
    !a?.city ||
    !a?.state ||
    !a?.zip
  ) {
    return false;
  }

  return true;
}

export async function POST(req: NextRequest) {
  /**
   * 1) Auth
   */
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  /**
   * 2) Payload
   */
  let payload: CreateBusinessPayload;
  try {
    payload = await req.json();
  } catch {
    return badRequest("JSON inválido.");
  }

  if (!isValidPayload(payload)) {
    return badRequest("Payload inválido.");
  }

  /**
   * 3) Resolver tenant via accounts
   */
  const { data: account, error: accError } = await auth.supabase
    .from("accounts")
    .select("tenant_id")
    .eq("user_id", auth.user.id)
    .single();

  if (accError || !account?.tenant_id) {
    return forbidden("Conta não associada a um tenant.");
  }

  /**
   * 4) Criar business (UNIQUE por tenant garantido no banco)
   */
  const { error: insertError } = await auth.supabase.from("business").insert({
    tenant_id: account.tenant_id,
    status: "active",
    name: payload.name,
    description: payload.description,
    phone_commercial: payload.phoneCommercial,
    mobile_commercial: payload.mobileCommercial ?? null,
    email_commercial: payload.emailCommercial,
    address_street: payload.address.street,
    address_number: payload.address.number,
    address_neighborhood: payload.address.neighborhood,
    address_city: payload.address.city,
    address_state: payload.address.state,
    address_zip: payload.address.zip,
    address_complement: payload.address.complement ?? null,
  });

  if (insertError) {
    if (
      insertError.code === "23505" ||
      /duplicate|unique/i.test(insertError.message)
    ) {
      return conflict("Já existe um negócio para este tenant.");
    }

    return json(500, {
      error: "internal_error",
      message: "Falha ao criar negócio.",
    });
  }

  return json(201, { ok: true });
}
