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

type AdminProduct = Pick<
  Database['public']['Tables']['products']['Row'],
  'id' | 'title' | 'status' | 'type' | 'price_cents' | 'currency' | 'position'
>;

export async function listAdminProducts(): Promise<
  ActionResult<AdminProduct[]>
> {
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

    const productsResult = await supabase
      .from('products')
      .select('id,title,status,type,price_cents,currency,position')
      .eq('business_id', business.id)
      .order('position', { ascending: true });

    if (productsResult.error) {
      return {
        ok: false,
        error: {
          code: ActionErrorCode.UNKNOWN_ERROR,
          message: productsResult.error.message,
        },
      };
    }

    return {
      ok: true,
      data: productsResult.data ?? [],
    };
  } catch (err) {
    return {
      ok: false,
      error: {
        code: ActionErrorCode.UNKNOWN_ERROR,
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      },
    };
  }
}
