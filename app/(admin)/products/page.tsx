import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';

import AdminBreadcrumb from 'app/components/AdminBreadcrumb';
import AdminPageHeader from 'app/components/AdminPageHeader';

export default async function ProductsPage() {
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

  const productsResult = await supabase
    .from('products')
    .select('id, title, status')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  const products = productsResult.data ?? [];

  return (
    <div className="space-y-6">
      <AdminBreadcrumb />

      <AdminPageHeader
        title="Produtos"
        description="Área de produtos do Painel do Negócio"
        action={
          <Link
            href="/products/new"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            + Criar produto
          </Link>
        }
      />

      <section className="rounded-lg border border-gray-200 bg-white">
        <ul className="divide-y">
          {products.length === 0 && (
            <li className="p-6 text-sm text-gray-500">
              Nenhum produto cadastrado ainda.
            </li>
          )}

          {products.map((product) => (
            <li
              key={product.id}
              className="flex items-center justify-between p-4"
            >
              <div>
                <Link
                  href={`/products/${product.id}`}
                  className="font-medium text-gray-900 hover:underline"
                >
                  {product.title}
                </Link>
                <p className="text-xs text-gray-500">
                  Status: {product.status}
                </p>
              </div>

              <Link
                href={`/products/${product.id}/edit`}
                className="text-sm text-blue-600 hover:underline"
              >
                Editar
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
