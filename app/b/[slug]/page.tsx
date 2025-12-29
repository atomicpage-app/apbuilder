import { notFound } from "next/navigation";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabasePublicClient } from "@/lib/supabase/public";

function resolvePublicLogoUrl(logoPath: string | null) {
  if (!logoPath) return null;

  const trimmed = logoPath.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  // Expect "<bucket>/<path>"
  const idx = trimmed.indexOf("/");
  if (idx <= 0) return null;

  const bucket = trimmed.slice(0, idx);
  const path = trimmed.slice(idx + 1);

  if (!bucket || !path) return null;

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

function safeSocialObject(socialLinks: Json | null) {
  if (!socialLinks || typeof socialLinks !== "object" || Array.isArray(socialLinks)) return null;
  return socialLinks as Record<string, unknown>;
}

function pickString(obj: Record<string, unknown> | null, key: string) {
  const v = obj?.[key];
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

export default async function PublicBusinessPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = (params.slug ?? "").trim().toLowerCase();
  if (!slug) notFound();

  const supabase = createSupabasePublicClient();

  const { data: business, error } = await supabase
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
        "status",
      ].join(",")
    )
    .eq("public_slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !business) notFound();

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
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`Logo de ${business.name}`}
              className="h-16 w-16 rounded-lg border object-contain"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg border bg-gray-50" />
          )}

          <div className="flex-1">
            <h1 className="text-2xl font-semibold leading-tight text-gray-900">
              {business.name}
            </h1>
            <p className="mt-2 text-gray-700">{business.description}</p>
          </div>
        </header>

        <section className="mt-8 rounded-xl border p-5">
          <h2 className="text-lg font-semibold text-gray-900">Contato</h2>

          <div className="mt-4 grid gap-2 text-gray-800">
            <div>
              <span className="font-medium">Telefone:</span>{" "}
              <span>{business.phone_commercial}</span>
            </div>

            <div>
              <span className="font-medium">Celular:</span>{" "}
              <span>{business.mobile_commercial}</span>
            </div>

            <div>
              <span className="font-medium">Email:</span>{" "}
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
            {business.address_complement ? <div>{business.address_complement}</div> : null}
          </div>

          {business.map_url ? (
            <div className="mt-4">
              <a className="underline" href={business.map_url} target="_blank" rel="noreferrer">
                Ver no Google Maps
              </a>
            </div>
          ) : null}
        </section>

        {hasAnySocial ? (
          <section className="mt-6 rounded-xl border p-5">
            <h2 className="text-lg font-semibold text-gray-900">Redes sociais</h2>

            <ul className="mt-4 grid gap-2 text-gray-800">
              {instagram ? (
                <li>
                  <a className="underline" href={instagram} target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                </li>
              ) : null}
              {linkedin ? (
                <li>
                  <a className="underline" href={linkedin} target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                </li>
              ) : null}
              {x ? (
                <li>
                  <a className="underline" href={x} target="_blank" rel="noreferrer">
                    X
                  </a>
                </li>
              ) : null}
              {tiktok ? (
                <li>
                  <a className="underline" href={tiktok} target="_blank" rel="noreferrer">
                    TikTok
                  </a>
                </li>
              ) : null}
              {pinterest ? (
                <li>
                  <a className="underline" href={pinterest} target="_blank" rel="noreferrer">
                    Pinterest
                  </a>
                </li>
              ) : null}
            </ul>
          </section>
        ) : null}

        <footer className="mt-10 text-sm text-gray-500">
          <span>atomicpage.com.br/{business.public_slug}</span>
        </footer>
      </div>
    </main>
  );
}
