import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabasePublicClient } from "@/lib/supabase/public";

type BusinessPublicRow = {
  name: string;
  description: string;
  phone_commercial: string;
  mobile_commercial: string | null;
  email_commercial: string;
  logo_path: string | null;
  map_url: string | null;
  address_street: string;
  address_number: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_complement: string | null;
  social_links: Json | null;
  public_slug: string | null;
};

function getSiteOrigin() {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  return "https://atomicpage.com.br";
}

function resolvePublicLogoUrl(logoPath: string | null) {
  if (!logoPath) return null;

  const trimmed = logoPath.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) return null;

  const idx = trimmed.indexOf("/");
  if (idx <= 0) return null;

  const bucket = trimmed.slice(0, idx);
  const path = trimmed.slice(idx + 1);

  if (!bucket || !path) return null;

  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${path}`;
}

function safeSocialObject(socialLinks: Json | null) {
  if (!socialLinks || typeof socialLinks !== "object" || Array.isArray(socialLinks)) {
    return null;
  }
  return socialLinks as Record<string, unknown>;
}

function pickString(obj: Record<string, unknown> | null, key: string) {
  const v = obj?.[key];
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function buildDescription(raw: string) {
  const oneLine = raw.replace(/\s+/g, " ").trim();
  if (oneLine.length <= 160) return oneLine;
  return `${oneLine.slice(0, 157)}...`;
}

async function fetchPublishedBusinessBySlug(slug: string) {
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from("business")
    .select(
      [
        "name",
        "description",
        "phone_commercial",
        "mobile_commercial",
        "email_commercial",
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
        "public_slug",
      ].join(",")
    )
    .eq("public_slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) return null;
  return (data as BusinessPublicRow | null) ?? null;
}

/* =======================
   METADATA
======================= */
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = slug.trim().toLowerCase();

  if (!normalizedSlug) {
    return { robots: { index: false, follow: false } };
  }

  const business = await fetchPublishedBusinessBySlug(normalizedSlug);
  if (!business) {
    return { robots: { index: false, follow: false } };
  }

  const title = `${business.name} — ${business.address_city}/${business.address_state}`;
  const description = buildDescription(business.description);
  const canonical = `${getSiteOrigin()}/b/${normalizedSlug}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
  };
}

/* =======================
   PAGE
======================= */
export default async function PublicBusinessPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const normalizedSlug = slug.trim().toLowerCase();

  if (!normalizedSlug) notFound();

  const business = await fetchPublishedBusinessBySlug(normalizedSlug);
  if (!business) notFound();

  const logoUrl = resolvePublicLogoUrl(business.logo_path);
  const socials = safeSocialObject(business.social_links);

  const instagram = pickString(socials, "instagram");
  const linkedin = pickString(socials, "linkedin");
  const x = pickString(socials, "x");
  const tiktok = pickString(socials, "tiktok");
  const pinterest = pickString(socials, "pinterest");

  const hasAnySocial = Boolean(instagram || linkedin || x || tiktok || pinterest);

  const addressLine1 = `${business.address_street}, ${business.address_number}`;
  const addressLine2 = `${business.address_neighborhood} - ${business.address_city}/${business.address_state}`;
  const addressLine3 = `CEP ${business.address_zip}`;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="flex items-start gap-4">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`Logo de ${business.name}`}
              className="h-16 w-16 rounded-lg border object-contain"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg border bg-gray-50" />
          )}

          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">
              {business.name}
            </h1>
            <p className="mt-2 text-gray-700">{business.description}</p>
          </div>
        </header>

        <section className="mt-8 rounded-xl border p-5">
          <h2 className="text-lg font-semibold text-gray-900">Contato</h2>

          <div className="mt-4 grid gap-2 text-gray-800">
            <div>
              <strong>Telefone:</strong> {business.phone_commercial}
            </div>
            {business.mobile_commercial && (
              <div>
                <strong>Celular:</strong> {business.mobile_commercial}
              </div>
            )}
            <div>
              <strong>Email:</strong>{" "}
              <a className="underline" href={`mailto:${business.email_commercial}`}>
                {business.email_commercial}
              </a>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border p-5">
          <h2 className="text-lg font-semibold text-gray-900">Endereço</h2>

          <div className="mt-4 grid gap-1 text-gray-800">
            <div>{addressLine1}</div>
            <div>{addressLine2}</div>
            <div>{addressLine3}</div>
            {business.address_complement && <div>{business.address_complement}</div>}
          </div>

          {business.map_url && (
            <div className="mt-4">
              <a
                className="underline"
                href={business.map_url}
                target="_blank"
                rel="noreferrer"
              >
                Ver no Google Maps
              </a>
            </div>
          )}
        </section>

        {hasAnySocial && (
          <section className="mt-6 rounded-xl border p-5">
            <h2 className="text-lg font-semibold text-gray-900">Redes sociais</h2>

            <ul className="mt-4 grid gap-2 text-gray-800">
              {instagram && (
                <li>
                  <a className="underline" href={instagram} target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                </li>
              )}
              {linkedin && (
                <li>
                  <a className="underline" href={linkedin} target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                </li>
              )}
              {x && (
                <li>
                  <a className="underline" href={x} target="_blank" rel="noreferrer">
                    X
                  </a>
                </li>
              )}
              {tiktok && (
                <li>
                  <a className="underline" href={tiktok} target="_blank" rel="noreferrer">
                    TikTok
                  </a>
                </li>
              )}
              {pinterest && (
                <li>
                  <a className="underline" href={pinterest} target="_blank" rel="noreferrer">
                    Pinterest
                  </a>
                </li>
              )}
            </ul>
          </section>
        )}

        <footer className="mt-10 text-sm text-gray-500">
          atomicpage.com.br/b/{business.public_slug}
        </footer>
      </div>
    </main>
  );
}
