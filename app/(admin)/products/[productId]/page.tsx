export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';

import AdminBreadcrumb from 'app/components/AdminBreadcrumb';
import AdminPageHeader from 'app/components/AdminPageHeader';

import { publishProduct, unpublishProduct } from '../actions/details-actions';

type PageProps = {
  params: Promise<{ productId: string }>;
  searchParams?: { status?: string };
};

export default async function ProductPage({ params, searchParams }: PageProps) {
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

  const productResult = await supabase
    .from('products')
    .select('id, title, status')
    .eq('id', productId)
    .limit(1);

  if (!productResult.data || productResult.data.length === 0) {
    throw new Error('Produto não encontrado.');
  }

  const product = productResult.data[0];

  const feedback =
    searchParams?.status === 'published'
      ? 'Produto publicado.'
      : searchParams?.status === 'unpublished'
        ? 'Produto despublicado.'
        : null;

  async function handlePublish() {
    'use server';
    await publishProduct(product.id);
  }

  async function handleUnpublish() {
    'use server';
    await unpublishProduct(product.id);
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb />

      {feedback && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {feedback}
        </div>
      )}

      <AdminPageHeader
        title={product.title}
        description={`Produto • Status: ${product.status}`}
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
          <form action={handlePublish}>
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
            >
              Publicar
            </button>
          </form>
        )}

        {product.status === 'published' && (
          <form action={handleUnpublish}>
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
            >
              Despublicar
            </button>
          </form>
        )}
      </section>
    </div>
  );
}