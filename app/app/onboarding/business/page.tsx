// app/app/onboarding/business/page.tsx
import { redirect } from "next/navigation";
import BusinessForm from "./BusinessForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTenantIdForUserId, getBusinessByTenantId } from "@/lib/business/server";

export default async function BusinessOnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  const user = data.user;
  if (!user) {
    redirect("/sign-in?next=/app/onboarding/business");
  }

  const tenantId = await getTenantIdForUserId(user.id);
  if (!tenantId) {
    // Premissa diz que sempre existe, mas se quebrar, preferimos falhar com redirect seguro.
    redirect("/sign-in?next=/app/onboarding/business");
  }

  const existingBusiness = await getBusinessByTenantId(tenantId);
  if (existingBusiness) {
    redirect("/app");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Cadastre seu negócio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Preencha as informações institucionais para liberar o acesso ao app.
        </p>
      </header>

      <BusinessForm />
    </div>
  );
}
