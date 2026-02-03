import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';

import AdminBreadcrumb from 'app/components/AdminBreadcrumb';
import AdminPageHeader from 'app/components/AdminPageHeader';

type PageProps = {
  params: Promise<{ productId: string }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { productId } = await params;
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
    .select('id')
    .limit(1);

  if (!businessResult.data || businessResult.data.length === 0) {
    throw new Error('Business não resolvido.');
  }

  const businessId = businessResult.data[0].id;

  const productResult = await supabase
    .from('products')
    .select('id, title, status')
    .eq('id', productId)
    .eq('business_id', businessId)
    .single();

  if (!productResult.data) {
    throw new Error('Produto não encontrado.');
  }

  const product = productResult.data;

  return (
    <div className="space-y-6">
      <AdminBreadcrumb />

      <AdminPageHeader
        title={product.title}
        description={`Produto do Painel do Negócio • Status: ${product.status}`}
        action={
          <Link
            href={`/products/${product.id}/edit`}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Editar produto
          </Link>
        }
      />

      <section className="flex gap-3">
        {product.status === 'draft' && (
          <button className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-800">
            Publicar
          </button>
        )}

        {product.status === 'published' && (
          <button className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-800">
            Arquivar
          </button>
        )}
      </section>
    </div>
  );
}
