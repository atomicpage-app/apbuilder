'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Campos editáveis do produto (draft / published)
 */
export type UpdateProductDraftInput = {
  productId: string;
  title: string;
  description: string | null;
  price: number | null;
  unit: string | null;
  cta_label: string | null;
  image_url: string | null;
};

export type UpdateProductDraftResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateProductDraft(
  input: UpdateProductDraftInput
): Promise<UpdateProductDraftResult> {
  // ⚠️ cookies() é async — PRECISA de await
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

  // --------------------------------------------------
  // 1. Validar existência e status do produto
  // --------------------------------------------------
  const productResult = await supabase
    .from('products')
    .select('status')
    .eq('id', input.productId)
    .limit(1);

  if (!productResult.data || productResult.data.length === 0) {
    return { ok: false, message: 'Produto não encontrado.' };
  }

  const status = productResult.data[0].status;

  if (status === 'archived') {
    return {
      ok: false,
      message: 'Produto arquivado não pode ser editado.',
    };
  }

  // --------------------------------------------------
  // 2. Converter preço (UI → DB)
  // --------------------------------------------------
  const price_cents =
    input.price !== null
      ? Math.round(input.price * 100)
      : null;

  // --------------------------------------------------
  // 3. Atualizar produto
  // --------------------------------------------------
  const updateResult = await supabase
    .from('products')
    .update({
      title: input.title,
      description: input.description,
      price_cents,
      unit: input.unit,
      cta_label: input.cta_label,
      image_url: input.image_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.productId);

  if (updateResult.error) {
    return {
      ok: false,
      message: 'Erro ao salvar alterações.',
    };
  }

  return { ok: true };
}
