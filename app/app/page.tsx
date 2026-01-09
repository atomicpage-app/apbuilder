// app/app/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getTenantIdForUserId,
  getBusinessByTenantId,
} from "@/lib/business/server";

export default async function AppEntryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Segurança: se chegou aqui sem sessão, volta ao sign-in
  if (!user) {
    redirect("/sign-in");
  }

  const tenantId = await getTenantIdForUserId(user.id);

  // Inconsistência grave, mas protegida
  if (!tenantId) {
    redirect("/sign-in");
  }

  const business = await getBusinessByTenantId(tenantId);

  // Condição A — autenticado sem business → onboarding
  if (!business) {
    redirect("/app/onboarding/business");
  }

  // Condição B — autenticado com business → app liberado
  redirect("/app/home");
}
