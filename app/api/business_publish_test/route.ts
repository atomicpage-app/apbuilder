import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SOCIAL_KEYS = ["instagram", "linkedin", "x", "tiktok", "pinterest"] as const;

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

function badRequest(message: string) {
  return json(400, { error: "bad_request", message });
}

function unauthorized() {
  return json(401, { error: "unauthorized", message: "Usuário não autenticado." });
}

function internalError(message = "Erro interno.") {
  return json(500, { error: "internal_error", message });
}

function hasValue(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function socialHasAtLeastOneLink(socialLinks: unknown) {
  if (typeof socialLinks !== "object" || socialLinks === null) return false;
  const obj = socialLinks as Record<string, unknown>;
  return SOCIAL_KEYS.some((k) => hasValue(obj[k]));
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

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return unauthorized();

    const tenantId = await getTenantIdForUser(supabase, user.id);
    if (!tenantId) return badRequest("Conta do usuário não possui tenant_id definido.");

    const { data: business, error: businessError } = await supabase
      .from("business")
      .select(
        [
          "id",
          "status",
          "public_slug",
          "logo_path",
          "phone_commercial",
          "mobile_commercial",
          "email_commercial",
          "map_url",
          "address_street",
          "address_number",
          "address_neighborhood",
          "address_city",
          "address_state",
          "address_zip",
          "social_links",
        ].join(",")
      )
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (businessError) {
      console.error("Erro ao buscar business:", businessError);
      return internalError("Falha ao buscar o negócio.");
    }

    if (!business) return badRequest("Negócio não encontrado para este tenant.");
    if (business.status === "published") return json(200, { status: "already_published" });

    const missing: string[] = [];

    if (!hasValue(business.public_slug)) missing.push("public_slug");
    if (!hasValue(business.logo_path)) missing.push("logo_path");

    if (!hasValue(business.phone_commercial)) missing.push("phone_commercial");
    if (!hasValue(business.mobile_commercial)) missing.push("mobile_commercial");
    if (!hasValue(business.email_commercial)) missing.push("email_commercial");

    if (!hasValue(business.map_url)) missing.push("map_url");

    if (!hasValue(business.address_street)) missing.push("address_street");
    if (!hasValue(business.address_number)) missing.push("address_number");
    if (!hasValue(business.address_neighborhood)) missing.push("address_neighborhood");
    if (!hasValue(business.address_city)) missing.push("address_city");
    if (!hasValue(business.address_state)) missing.push("address_state");
    if (!hasValue(business.address_zip)) missing.push("address_zip");

    if (!socialHasAtLeastOneLink(business.social_links)) missing.push("social_links (at least one)");

    if (missing.length > 0) {
      return badRequest(`Pré-requisitos de publicação ausentes: ${missing.join(", ")}`);
    }

    const { data: updated, error: updateError } = await supabase
      .from("business")
      .update({ status: "published" })
      .eq("tenant_id", tenantId)
      .select("id, status, public_slug, updated_at")
      .single();

    if (updateError || !updated) {
      console.error("Erro ao publicar business:", updateError);
      return internalError("Falha ao publicar o negócio.");
    }

    return json(200, { status: "published", business: updated });
  } catch (error) {
    console.error("Erro inesperado no POST /api/business_publish_test:", error);
    return internalError();
  }
}
