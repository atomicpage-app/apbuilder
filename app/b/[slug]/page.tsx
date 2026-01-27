import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import PublicBusinessView from './PublicBusinessView';

type PublicBusiness =
  Database['public']['Views']['public_business_with_products']['Row'];

type PageProps = {
  params: { slug: string };
};

export default async function PublicBusinessPage({ params }: PageProps) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('public_business_with_products')
    .select('*')
    .eq('public_slug', params.slug)
    .single<PublicBusiness>();

  if (error || !data) notFound();

  return (
    <PublicBusinessView
      business={{
        name: data.name ?? '',
        description: data.description ?? '',
      }}
      products={(data.products as any[]) ?? []}
    />
  );
}
