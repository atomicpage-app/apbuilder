'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ActionResult, ActionErrorCode } from './types';

type CreateDraftResult = {
  productId: string;
};

export async function createProductDraft(): Promise<
  ActionResult<CreateDraftResult>
> {
  try {
    const supabase = await createSupabaseServerClient();

    // 1. Auth
    const authResult = await supabase.auth.getUser();
    if (authResult.error || !authResult.data.user) {
      return { ok: false, error: { code: ActionErrorCode.UNAUTHORIZED } };
    }

    // 2. Resolve tenant
    const accountResult = await supabase
      .from('accounts')
      .select('tenant_id')
      .eq('user_id', authResult.data.user.id)
      .single();

    if (accountResult.error || !accountResult.data) {
      return { ok: false, error: { code: ActionErrorCode.UNAUTHORIZED } };
    }

    // 3. Resolve business
    const businessResult = await supabase
      .from('business')
      .select('id')
      .eq('tenant_id', accountResult.data.tenant_id)
      .single();

    if (businessResult.error || !businessResult.data) {
      return { ok: false, error: { code: ActionErrorCode.UNKNOWN_ERROR } };
    }

    // 4. Create draft
    const insertResult = await supabase
      .from('products')
      .insert({
        business_id: businessResult.data.id,
        status: 'draft',
        type: 'service',
        title: 'Novo produto',
      })
      .select('id')
      .single();

    if (insertResult.error || !insertResult.data) {
      return {
        ok: false,
        error: {
          code: ActionErrorCode.UNKNOWN_ERROR,
          message: insertResult.error?.message,
        },
      };
    }

    return {
      ok: true,
      data: { productId: insertResult.data.id },
    };
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
