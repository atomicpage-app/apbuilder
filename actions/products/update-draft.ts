'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ActionResult, ActionErrorCode } from './types';
import type { Database } from '@/lib/supabase/database.types';

type UpdateDraftInput = {
  productId: string;
  title: string;
  short_description: string | null;
  description: string | null;
  type: Database['public']['Enums']['product_type'];
  price_reais: number | null;
  currency: string | null;
  cta_label: string | null;
  image_url: string | null;
  position: number;
};

type AccountTenant = { tenant_id: string };
type BusinessId = { id: string };

export async function updateProductDraft(
  input: UpdateDraftInput
): Promise<ActionResult<null>> {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: { code: ActionErrorCode.UNAUTHORIZED } };
    }

    const { data: account } = await supabase
      .from('accounts')
      .select('tenant_id')
      .eq('user_id', user.id)
      .returns<AccountTenant>()
      .single();

    if (!account?.tenant_id) {
      return { ok: false, error: { code: ActionErrorCode.UNAUTHORIZED } };
    }

    const { data: business } = await supabase
      .from('business')
      .select('id')
      .eq('tenant_id', account.tenant_id)
      .returns<BusinessId>()
      .single();

    if (!business?.id) {
      return { ok: false, error: { code: ActionErrorCode.UNKNOWN_ERROR } };
    }

    const { data: product } = await supabase
      .from('products')
      .select('id,status')
      .eq('id', input.productId)
      .eq('business_id', business.id)
      .returns<{ id: string; status: Database['public']['Enums']['product_status'] }>()
      .single();

    if (!product || product.status !== 'draft') {
      return { ok: false, error: { code: ActionErrorCode.UNAUTHORIZED } };
    }

    const price_cents =
      input.price_reais == null ? null : Math.round(input.price_reais * 100);

    const { error } = await supabase
      .from('products')
      .update({
        title: input.title,
        short_description: input.short_description,
        description: input.description,
        type: input.type,
        price_cents,
        currency: input.currency,
        cta_label: input.cta_label,
        image_url: input.image_url,
        position: input.position,
      })
      .eq('id', input.productId);

    if (error) {
      return {
        ok: false,
        error: { code: ActionErrorCode.UNKNOWN_ERROR, message: error.message },
      };
    }

    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: {
        code: ActionErrorCode.UNKNOWN_ERROR,
        message: err instanceof Error ? err.message : 'Unknown error',
      },
    };
  }
}
