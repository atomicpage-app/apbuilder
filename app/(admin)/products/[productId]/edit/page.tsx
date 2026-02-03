export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import ProductEditForm from './ProductEditForm';

type PageProps = {
  params: Promise<{ productId: string }>;
};

export default async function ProductEditPage({ params }: PageProps) {
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
    .select(
      `
      id,
      title,
      description,
      price_cents,
      currency,
      unit,
      cta_label,
      image_url,
      status
      `
    )
    .eq('id', productId);

  if (!productResult.data || productResult.data.length === 0) {
    throw new Error('Produto não encontrado.');
  }

  const product = productResult.data[0];

  return (
    <ProductEditForm
      productId={product.id}
      initialStatus={product.status}
      initialValues={{
        title: product.title,
        description: product.description,
        price:
          product.price_cents !== null
            ? product.price_cents / 100
            : null,
        unit: product.unit,
        cta_label: product.cta_label,
        image_url: product.image_url,
      }}
    />
  );
}
