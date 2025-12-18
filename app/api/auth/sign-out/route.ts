import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  const all = cookieStore.getAll();

  // Remove qualquer cookie sb-* e o cookie único sb-<project>-auth-token
  for (const c of all) {
    if (c.name.startsWith("sb-")) {
      cookieStore.set({
        name: c.name,
        value: "",
        path: "/",
        maxAge: 0,
      });
    }
  }

  return NextResponse.json({ message: "Logout realizado com sucesso." });
}