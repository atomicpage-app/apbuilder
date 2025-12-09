// app/app/page.tsx
import { getCurrentUser } from '@/lib/supabase/server';

export default async function AppHomePage() {
  const user = await getCurrentUser();

  const email = user?.email ?? 'usuário';

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">
        Bem-vindo à área autenticada
      </h1>
      <p className="text-sm text-slate-300">
        Você está logado como{' '}
        <span className="font-mono text-emerald-300">{email}</span>.
      </p>
      <p className="text-sm text-slate-400">
        Em seguida, vamos configurar as informações do seu negócio
        para gerar o site institucional.
      </p>
    </section>
  );
}
