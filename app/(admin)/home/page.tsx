import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import ProductsSection from 'app/components/ProductsSection';

export default async function HomePage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const businessResult = await supabase
    .from('business')
    .select('id, name')
    .limit(1);

  if (!businessResult.data || businessResult.data.length === 0) {
    throw new Error('Business não resolvido.');
  }

  const business = businessResult.data[0];

  const productsResult = await supabase
    .from('products')
    .select('id, title, status')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(3);

  const products = productsResult.data ?? [];

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Header do Negócio */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Painel do negócio</h1>
        <p className="text-lg text-gray-600">{business.name}</p>
        <p className="text-sm text-gray-500">
          Gerencie conteúdos e configurações do seu negócio.
        </p>
      </header>

      {/* Seções */}
      <ProductsSection products={products} />
    </main>
  );
}
