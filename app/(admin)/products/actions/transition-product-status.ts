'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ActionResult, ActionErrorCode } from './types';
import {
  applyProductStatusTransition,
  ProductStatus,
} from '../_domain/product-status';

type Input = {
  productId: string;
  nextStatus: ProductStatus;
};

export async function transitionProductStatus(
  input: Input
): Promise<ActionResult<null>> {
  try {
    const supabase = await createSupabaseServerClient();

    // Auth
    const auth = await supabase.auth.getUser();
    if (auth.error || !auth.data.user) {
      return { ok: false, error: { code: ActionErrorCode.UNAUTHORIZED } };
    }

    // Tenant
    const account = await supabase
      .from('accounts')
      .select('tenant_id')
      .eq('user_id', auth.data.user.id)
      .single();

    if (account.error || !account.data) {
      return { ok: false, error: { code: ActionErrorCode.UNAUTHORIZED } };
    }

    // Business
    const business = await supabase
      .from('business')
      .select('id')
      .eq('tenant_id', account.data.tenant_id)
      .single();

    if (business.error || !business.data) {
      return { ok: false, error: { code: ActionErrorCode.UNKNOWN_ERROR } };
    }

    // Product
    const product = await supabase
      .from('products')
      .select('id,status,published_at')
      .eq('id', input.productId)
      .eq('business_id', business.data.id)
      .single();

    if (product.error || !product.data) {
      return { ok: false, error: { code: ActionErrorCode.UNAUTHORIZED } };
    }

    const transition = applyProductStatusTransition({
      currentStatus: product.data.status,
      nextStatus: input.nextStatus,
      publishedAt: product.data.published_at,
    });

    if (!transition.ok) {
      return {
        ok: false,
        error: { code: ActionErrorCode.INVALID_STATE_TRANSITION },
      };
    }

    const update = await supabase
      .from('products')
      .update({
        ...transition.patch,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.productId);

    if (update.error) {
      return { ok: false, error: { code: ActionErrorCode.UNKNOWN_ERROR } };
    }

    return { ok: true, data: null };
  } catch {
    return { ok: false, error: { code: ActionErrorCode.UNKNOWN_ERROR } };
  }
}