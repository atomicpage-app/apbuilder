'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import {
  UpdateProductDraftPayload,
  UpdateProductDraftResult,
  ProductDraftEditableFields,
} from '../../types/product-edit';

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export async function updateProductDraftAction(
  payload: UpdateProductDraftPayload
): Promise<UpdateProductDraftResult> {
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

  const { productId, data } = payload;

  if (!productId) {
    return {
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Produto inválido.',
    };
  }

  // ------------------------
  // Validações mínimas
  // ------------------------

  if (typeof data.title === 'string') {
    const title = data.title.trim();
    if (title.length < 3 || title.length > 80) {
      return {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Título deve ter entre 3 e 80 caracteres.',
      };
    }
  }

  if (data.price !== undefined && data.price !== null) {
    if (!Number.isFinite(data.price) || data.price < 0) {
      return {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Preço inválido.',
      };
    }
  }

  if (typeof data.image_url === 'string' && data.image_url.length > 0) {
    if (!isValidUrl(data.image_url)) {
      return {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'URL de imagem inválida.',
      };
    }
  }

  // ------------------------
  // Resolver business
  // ------------------------

  const businessResult = await supabase
    .from('business')
    .select('id')
    .limit(1);

  if (businessResult.error || !businessResult.data || businessResult.data.length === 0) {
    return {
      success: false,
      code: 'UNKNOWN',
      message: 'Business não resolvido.',
    };
  }

  const businessId = businessResult.data[0].id as string;

  // ------------------------
  // Garantir que produto pertence ao business
  // ------------------------

  const productResult = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('business_id', businessId)
    .limit(1);

  if (productResult.error || !productResult.data || productResult.data.length === 0) {
    return {
      success: false,
      code: 'NOT_FOUND',
      message: 'Produto não encontrado.',
    };
  }

  // ------------------------
  // Payload de update
  // - força status = draft
  // ------------------------

  const updatePayload: Partial<ProductDraftEditableFields> & { status: 'draft' } = {
    status: 'draft',
  };

  if (data.title !== undefined) updatePayload.title = data.title.trim();
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.price !== undefined) updatePayload.price = data.price;
  if (data.unit !== undefined) updatePayload.unit = data.unit;
  if (data.cta_label !== undefined) updatePayload.cta_label = data.cta_label;
  if (data.image_url !== undefined) updatePayload.image_url = data.image_url;

  const updateResult = await supabase
    .from('products')
    .update(updatePayload)
    .eq('id', productId)
    .eq('business_id', businessId)
    .select('title, description, price, unit, cta_label, image_url')
    .limit(1);

  if (updateResult.error || !updateResult.data || updateResult.data.length === 0) {
    return {
      success: false,
      code: 'UNKNOWN',
      message: 'Erro ao salvar alterações.',
    };
  }

  return {
    success: true,
    product: updateResult.data[0] as ProductDraftEditableFields,
  };
}
