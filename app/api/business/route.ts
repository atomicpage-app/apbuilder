import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

type PatchBusinessPayload = Partial<{
  name: string;
  description: string;
  phoneCommercial: string;
  mobileCommercial: string | null;
  emailCommercial: string;
  publicSlug: string | null;
  logoPath: string | null;
  mapUrl: string | null;
  address: Partial<CreateBusinessAddressPayload>;
  socialLinks: Record<string, unknown> | null;
}>;

const RESERVED_SLUGS = new Set([
  "app",
  "api",
  "b",
  "onboarding",
  "sign-in",
  "sign-up",
  "logout",
  "auth",
  "callback",
  "pricing",
  "docs",
  "blog",
  "help",
  "support",
  "terms",
  "privacy",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.webmanifest",
]);

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

function badRequest(message: string) {
  return json(400, { error: "bad_request", message });
}

function conflict(message: string) {
  return json(409, { error: "conflict", message });
}

function unauthorized() {
  return json(401, { error: "unauthorized", message: "Usuário não autenticado." });
}

function internalError(message = "Erro interno.") {
  return json(500, { error: "internal_error", message });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeSlug(raw: string) {
  return raw.trim().toLowerCase();
}

function isValidSlug(slug: string) {
  if (slug.length < 3 || slug.length > 32) return false;
  if (slug !== slug.toLowerCase()) return false;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return false;
  if (RESERVED_SLUGS.has(slug)) return false;
  return true;
}

function validateCreatePayload(body: unknown): CreateBusinessPayload | null {
  if (typeof body !== "object" || body === null) return null;

  const { name, description, phoneCommercial, mobileCommercial, emailCommercial, address } =
    body as Record<string, unknown>;

  if (!isNonEmptyString(name)) return null;
  if (!isNonEmptyString(description)) return null;
  if (!isNonEmptyString(phoneCommercial)) return null;
  if (!isNonEmptyString(emailCommercial)) return null;

  if (typeof address !== "object" || address === null) return null;

  const { street, number, neighborhood, city, state, zip, complement } =
    address as Record<string, unknown>;

  if (!isNonEmptyString(street)) return null;
  if (!isNonEmptyString(number)) return null;
  if (!isNonEmptyString(neighborhood)) return null;
  if (!isNonEmptyString(city)) return null;
  if (!isNonEmptyString(state)) return null;
  if (!isNonEmptyString(zip)) return null;

  return {
    name,
    description,
    phoneCommercial,
    mobileCommercial:
      typeof mobileCommercial === "string" && mobileCommercial.trim().length > 0
        ? mobileCommercial
        : null,
    emailCommercial,
    address: {
      street,
      number,
      neighborhood,
      city,
      state,
      zip,
      complement:
        typeof complement === "string" && complement.trim().length > 0 ? complement : null,
    },
  };
}

function pickPatchPayload(body: unknown): PatchBusinessPayload | null {
  if (typeof body !== "object" || body === null) return null;
  return body as PatchBusinessPayload;
}

function mapPatchToDbUpdate(patch: PatchBusinessPayload) {
  const update: Record<string, unknown> = {};

  if (patch.name !== undefined) {
    if (!isNonEmptyString(patch.name)) throw new Error("name_invalid");
    update.name = patch.name.trim();
  }

  if (patch.description !== undefined) {
    if (!isNonEmptyString(patch.description)) throw new Error("description_invalid");
    update.description = patch.description.trim();
  }

  if (patch.phoneCommercial !== undefined) {
    if (!isNonEmptyString(patch.phoneCommercial)) throw new Error("phoneCommercial_invalid");
    update.phone_commercial = patch.phoneCommercial.trim();
  }

  if (patch.mobileCommercial !== undefined) {
    if (patch.mobileCommercial === null) {
      update.mobile_commercial = null;
    } else if (isNonEmptyString(patch.mobileCommercial)) {
      update.mobile_commercial = patch.mobileCommercial.trim();
    } else {
      throw new Error("mobileCommercial_invalid");
    }
  }

  if (patch.emailCommercial !== undefined) {
    if (!isNonEmptyString(patch.emailCommercial)) throw new Error("emailCommercial_invalid");
    update.email_commercial = patch.emailCommercial.trim();
  }

  if (patch.logoPath !== undefined) {
    if (patch.logoPath === null) {
      update.logo_path = null;
    } else if (isNonEmptyString(patch.logoPath)) {
      update.logo_path = patch.logoPath.trim();
    } else {
      throw new Error("logoPath_invalid");
    }
  }

  if (patch.mapUrl !== undefined) {
    if (patch.mapUrl === null) {
      update.map_url = null;
    } else if (isNonEmptyString(patch.mapUrl)) {
      update.map_url = patch.mapUrl.trim();
    } else {
      throw new Error("mapUrl_invalid");
    }
  }

  if (patch.publicSlug !== undefined) {
    if (patch.publicSlug === null) {
      update.public_slug = null;
    } else if (isNonEmptyString(patch.publicSlug)) {
      const slug = normalizeSlug(patch.publicSlug);
      if (!isValidSlug(slug)) throw new Error("publicSlug_invalid");
      update.public_slug = slug;
    } else {
      throw new Error("publicSlug_invalid");
    }
  }

  if (patch.address !== undefined) {
    const a = patch.address ?? {};
    if (a.street !== undefined) {
      if (!isNonEmptyString(a.street)) throw new Error("address_street_invalid");
      update.address_street = a.street.trim();
    }
    if (a.number !== undefined) {
      if (!isNonEmptyString(a.number)) throw new Error("address_number_invalid");
      update.address_number = a.number.trim();
    }
    if (a.neighborhood !== undefined) {
      if (!isNonEmptyString(a.neighborhood)) throw new Error("address_neighborhood_invalid");
      update.address_neighborhood = a.neighborhood.trim();
    }
    if (a.city !== undefined) {
      if (!isNonEmptyString(a.city)) throw new Error("address_city_invalid");
      update.address_city = a.city.trim();
    }
    if (a.state !== undefined) {
      if (!isNonEmptyString(a.state)) throw new Error("address_state_invalid");
      update.address_state = a.state.trim();
    }
    if (a.zip !== undefined) {
      if (!isNonEmptyString(a.zip)) throw new Error("address_zip_invalid");
      update.address_zip = a.zip.trim();
    }
    if (a.complement !== undefined) {
      if (a.complement === null) {
        update.address_complement = null;
      } else if (isNonEmptyString(a.complement)) {
        update.address_complement = a.complement.trim();
      } else {
        throw new Error("address_complement_invalid");
      }
    }
  }

  if (patch.socialLinks !== undefined) {
    if (patch.socialLinks === null) {
      update.social_links = null;
    } else if (typeof patch.socialLinks === "object" && patch.socialLinks !== null) {
      update.social_links = patch.socialLinks;
    } else {
      throw new Error("socialLinks_invalid");
    }
  }

  return update;
}

async function getTenantIdForUser(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) {
  const { data: account, error } = await supabase
    .from("accounts")
    .select("tenant_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (account?.tenant_id as string | null) ?? null;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return unauthorized();

    const tenantId = await getTenantIdForUser(supabase, user.id);
    if (!tenantId) return badRequest("Conta do usuário não possui tenant_id definido.");

    const { data: business, error } = await supabase
      .from("business")
      .select(
        [
          "id",
          "tenant_id",
          "status",
          "name",
          "description",
          "phone_commercial",
          "mobile_commercial",
          "email_commercial",
          "public_slug",
          "logo_path",
          "map_url",
          "address_street",
          "address_number",
          "address_neighborhood",
          "address_city",
          "address_state",
          "address_zip",
          "address_complement",
          "social_links",
          "created_at",
          "updated_at",
        ].join(",")
      )
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar business:", error);
      return internalError("Falha ao buscar o negócio.");
    }

    return json(200, { business: business ?? null });
  } catch (error) {
    console.error("Erro inesperado no GET /api/business:", error);
    return internalError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return unauthorized();

    const tenantId = await getTenantIdForUser(supabase, user.id);
    if (!tenantId) {
      return badRequest(
        "Conta do usuário não encontrada ou não possui tenant_id definido. Não é possível criar um negócio."
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch (err) {
      console.error("Erro ao fazer parse do JSON:", err);
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const payload = validateCreatePayload(body);
    if (!payload) {
      return badRequest("Payload inválido. Verifique campos obrigatórios do negócio e do endereço.");
    }

    const { data: existingBusiness, error: existingError } = await supabase
      .from("business")
      .select("id")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (existingError) {
      console.error("Erro ao verificar existência de business:", existingError);
      return internalError("Falha ao verificar se o negócio já existe.");
    }

    if (existingBusiness) return conflict("Já existe um negócio cadastrado para este tenant.");

    const { data: createdBusiness, error: insertError } = await supabase
      .from("business")
      .insert({
        tenant_id: tenantId,
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
      })
      .select("id, tenant_id, status, name, email_commercial, created_at, updated_at")
      .single();

    if (insertError || !createdBusiness) {
      console.error("Erro ao inserir business:", insertError);
      return internalError("Falha ao criar o negócio.");
    }

    return json(201, {
      id: createdBusiness.id,
      tenantId: createdBusiness.tenant_id,
      status: createdBusiness.status,
      name: createdBusiness.name,
      emailCommercial: createdBusiness.email_commercial,
      createdAt: createdBusiness.created_at,
      updatedAt: createdBusiness.updated_at,
    });
  } catch (error) {
    console.error("Erro inesperado no POST /api/business:", error);
    return internalError("Erro interno ao criar o negócio.");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return unauthorized();

    const tenantId = await getTenantIdForUser(supabase, user.id);
    if (!tenantId) return badRequest("Conta do usuário não possui tenant_id definido.");

    const { data: current, error: currentError } = await supabase
      .from("business")
      .select("id, status, public_slug")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (currentError) {
      console.error("Erro ao buscar business atual:", currentError);
      return internalError("Falha ao buscar o negócio atual.");
    }
    if (!current) return badRequest("Negócio não encontrado para este tenant.");

    let body: unknown;
    try {
      body = await req.json();
    } catch (err) {
      console.error("Erro ao fazer parse do JSON:", err);
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const patch = pickPatchPayload(body);
    if (!patch) return badRequest("Payload inválido.");

    if (patch.publicSlug !== undefined && current.status !== "draft") {
      return badRequest("publicSlug só pode ser alterado enquanto status=draft.");
    }

    let update: Record<string, unknown>;
    try {
      update = mapPatchToDbUpdate(patch);
    } catch (e) {
      const code = e instanceof Error ? e.message : "invalid";
      return badRequest(`Campo inválido: ${code}`);
    }

    if (Object.keys(update).length === 0) {
      return badRequest("Nenhum campo para atualizar.");
    }

    const { data: updated, error: updateError } = await supabase
      .from("business")
      .update(update)
      .eq("tenant_id", tenantId)
      .select(
        [
          "id",
          "tenant_id",
          "status",
          "name",
          "description",
          "phone_commercial",
          "mobile_commercial",
          "email_commercial",
          "public_slug",
          "logo_path",
          "map_url",
          "address_street",
          "address_number",
          "address_neighborhood",
          "address_city",
          "address_state",
          "address_zip",
          "address_complement",
          "social_links",
          "updated_at",
        ].join(",")
      )
      .single();

    if (updateError || !updated) {
      console.error("Erro ao atualizar business:", updateError);
      const msg =
        updateError?.code === "23505"
          ? "Conflito: publicSlug já está em uso."
          : "Falha ao atualizar o negócio.";
      return updateError?.code === "23505" ? conflict(msg) : internalError(msg);
    }

    return json(200, { business: updated });
  } catch (error) {
    console.error("Erro inesperado no PATCH /api/business:", error);
    return internalError();
  }
}
