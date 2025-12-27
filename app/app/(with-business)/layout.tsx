// app/app/(with-business)/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTenantIdForUserId, getBusinessByTenantId } from "@/lib/business/server";

type Props = {
  children: ReactNode;
};

export default async function WithBusinessLayout({ children }: Props) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  const user = data.user;
  if (!user) {
    redirect("/sign-in?next=/app");
  }

  const tenantId = await getTenantIdForUserId(user.id);
  if (!tenantId) {
    redirect("/sign-in?next=/app");
  }

  const business = await getBusinessByTenantId(tenantId);
  if (!business) {
    redirect("/app/onboarding/business");
  }

  return <>{children}</>;
}
