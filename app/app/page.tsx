// app/app/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBusinessForUserId } from "@/lib/business/server";

export default async function AppEntryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Segurança
  if (!user) {
    redirect("/sign-in");
  }

  const business = await getBusinessForUserId(user.id);

  // Sem business → onboarding
  if (!business) {
    redirect("/app/onboarding/business");
  }

  // Com business → app
  redirect("/home");
}
