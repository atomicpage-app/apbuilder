import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import PublicBusinessView from "./PublicBusinessView";

export const revalidate = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const { data: business } = await supabase
    .from("business")
    .select("name, description, address_city, logo_path")
    .eq("public_slug", params.slug)
    .eq("status", "published")
    .single();

  if (!business) return {};

  const description =
    business.description.length > 155
      ? business.description.slice(0, 152) + "..."
      : business.description;

  return {
    title: `${business.name} em ${business.address_city}`,
    description,
    openGraph: {
      title: business.name,
      description,
      images: business.logo_path ? [{ url: business.logo_path }] : undefined,
    },
    alternates: {
      canonical: `/b/${params.slug}`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: { slug: string };
}) {
  const { data: business } = await supabase
    .from("business")
    .select("*")
    .eq("public_slug", params.slug)
    .eq("status", "published")
    .single();

  if (!business) notFound();

  return <PublicBusinessView business={business} />;
}
