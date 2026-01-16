import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function requireActiveAccount() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const { data: account, error } = await supabase
    .from("accounts")
    .select("id,status")
    .eq("user_id", user.id)
    .single();

  if (error || !account) {
    throw new Response("Unauthorized", { status: 401 });
  }

  if (account.status !== "active") {
    throw new Response("Forbidden", { status: 403 });
  }

  return { user, account };
}
