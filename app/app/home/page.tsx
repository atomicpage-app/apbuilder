// app/app/home/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import LogoutButton from "@/app/app/logout-button";

export default async function AppHomePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Painel do Negócio
          </h1>
          <p className="mt-2 text-sm text-slate-700">
            Área inicial do app. Aqui ficarão configurações, visão geral e
            futuras funcionalidades.
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Sessão ativa
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Usuário autenticado como{" "}
            <span className="font-medium text-slate-900">
              {data.user?.email}
            </span>
          </p>

          <div className="mt-4 flex items-center gap-3">
            <LogoutButton />
          </div>
        </section>

        <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <h2 className="text-sm font-semibold text-slate-900 uppercase">
            Próximos módulos
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Configurações do negócio</li>
            <li>Página pública</li>
            <li>Produtos / serviços</li>
            <li>Analytics e visitas</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
