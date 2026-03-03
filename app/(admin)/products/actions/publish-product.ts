'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ActionResult, ActionErrorCode } from './types';

type PublishProductInput = {
  productId: string;
};

export async function publishProduct(
  input: PublishProductInput
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
      .select('id,status')
      .eq('id', input.productId)
      .eq('business_id', business.data.id)
      .single();

    if (product.error || !product.data) {
      return { ok: false, error: { code: ActionErrorCode.UNAUTHORIZED } };
    }

    if (product.data.status !== 'draft') {
      return { ok: false, error: { code: ActionErrorCode.UNAUTHORIZED } };
    }

    // Published limit (3)
    const publishedCount = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.data.id)
      .eq('status', 'published');

    if ((publishedCount.count ?? 0) >= 3) {
      return { ok: false, error: { code: ActionErrorCode.UNAUTHORIZED } };
    }

    // Publish
    const update = await supabase
      .from('products')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
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
