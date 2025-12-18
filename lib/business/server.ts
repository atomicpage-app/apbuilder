// lib/business/server.ts
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TenantAccount = {
  tenant_id: string;
};

export type BusinessRow = {
  id: string;
  tenant_id: string;
  status: "draft" | "published";
  name: string;
  description: string;
  phone_commercial: string;
  mobile_commercial: string | null;
  email_commercial: string;
  address_street: string;
  address_number: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_complement: string | null;
  created_at: string;
  updated_at: string;
};

export async function getTenantIdForUserId(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("accounts")
    .select("tenant_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getTenantIdForUserId: accounts query error", error);
    return null;
  }

  return (data?.tenant_id as string | null) ?? null;
}

export async function getBusinessByTenantId(tenantId: string): Promise<BusinessRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("business")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    console.error("getBusinessByTenantId: business query error", error);
    return null;
  }

  return (data as BusinessRow | null) ?? null;
}
