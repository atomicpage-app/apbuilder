'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function getSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
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
}

// --------------------------------------------------
// Publicar (tornar visível)
// --------------------------------------------------
export async function publishProduct(productId: string) {
  const supabase = await getSupabase();

  const update = await supabase
    .from('products')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (update.error) {
    throw new Error('Erro ao publicar produto.');
  }

  revalidatePath(`/products/${productId}`);
  revalidatePath('/products');

  redirect(`/products/${productId}?status=published`);
}

// --------------------------------------------------
// Despublicar (tornar invisível)
// --------------------------------------------------
export async function unpublishProduct(productId: string) {
  const supabase = await getSupabase();

  const update = await supabase
    .from('products')
    .update({
      status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (update.error) {
    throw new Error('Erro ao despublicar produto.');
  }

  revalidatePath(`/products/${productId}`);
  revalidatePath('/products');

  redirect(`/products/${productId}?status=unpublished`);
}