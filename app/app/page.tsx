import { createSupabaseServerClient } from "@/lib/supabase/server";
import LogoutButton from "@/app/app/logout-button";

export default async function AppHomePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Área protegida</h1>
        <p className="mt-2 text-sm text-slate-700">
          Você está autenticado como:{" "}
          <span className="font-medium text-slate-900">{data.user?.email}</span>
        </p>

        <div className="mt-6 flex items-center gap-3">
          <LogoutButton />
          <a
            href="/sign-in"
            className="text-sm font-medium text-slate-900 underline underline-offset-4"
          >
            Ir para Sign-in
          </a>
        </div>

        <p className="mt-8 text-xs text-slate-500">
          Esta página existe apenas para validar proteção de rota e sessão SSR.
        </p>
      </div>
    </main>
  );
}
