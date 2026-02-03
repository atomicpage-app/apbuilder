// lib/business/server.ts
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type BusinessRow =
  Database["public"]["Tables"]["business"]["Row"];

/**
 * Fonte única da verdade:
 * auth.user -> accounts -> tenant_id -> business
 */
export async function getBusinessForUserId(
  userId: string
): Promise<BusinessRow | null> {
  const supabase = await createSupabaseServerClient();

  /**
   * 1. Account (pode não existir)
   */
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("tenant_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (accountError) {
    console.error("getBusinessForUserId: account error", accountError);
    return null;
  }

  if (!account?.tenant_id) {
    return null;
  }

  /**
   * 2. Business (1 por tenant)
   */
  const { data: business, error: businessError } = await supabase
    .from("business")
    .select("*")
    .eq("tenant_id", account.tenant_id)
    .returns<BusinessRow>()
    .maybeSingle();

  if (businessError) {
    console.error("getBusinessForUserId: business error", businessError);
    return null;
  }

  return business ?? null;
}
