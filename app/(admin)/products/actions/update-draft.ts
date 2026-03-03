'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import { ActionResult, ActionErrorCode } from './types';

type AccountTenant = Pick<
  Database['public']['Tables']['accounts']['Row'],
  'tenant_id'
>;

type BusinessId = Pick<
  Database['public']['Tables']['business']['Row'],
  'id'
>;

type ProductRow = Database['public']['Tables']['products']['Row'];

type UpdateDraftInput = Partial<
  Database['public']['Tables']['products']['Update']
> & { productId: string };

export async function updateProductDraft(
  input: UpdateDraftInput
): Promise<ActionResult<null>> {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: { code: ActionErrorCode.UNAUTHORIZED } };
    }

    const accountResult = await supabase
      .from('accounts')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (accountResult.error || !accountResult.data) {
      return { ok: false, error: { code: ActionErrorCode.UNAUTHORIZED } };
    }

    const account: AccountTenant = accountResult.data;

    const businessResult = await supabase
      .from('business')
      .select('id')
      .eq('tenant_id', account.tenant_id)
      .single();

    if (businessResult.error || !businessResult.data) {
      return { ok: false, error: { code: ActionErrorCode.UNKNOWN_ERROR } };
    }

    const business: BusinessId = businessResult.data;

    const productResult = await supabase
      .from('products')
      .select('*')
      .eq('id', input.productId)
      .eq('business_id', business.id)
      .single();

    if (
      productResult.error ||
      !productResult.data ||
      productResult.data.status !== 'draft'
    ) {
      return {
        ok: false,
        error: { code: ActionErrorCode.UNAUTHORIZED },
      };
    }

    const product: ProductRow = productResult.data;

    const updateResult = await supabase
      .from('products')
      .update(input)
      .eq('id', product.id);

    if (updateResult.error) {
      return {
        ok: false,
        error: {
          code: ActionErrorCode.UNKNOWN_ERROR,
          message: updateResult.error.message,
        },
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
