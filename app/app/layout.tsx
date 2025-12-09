// app/app/layout.tsx
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';

type AppLayoutProps = {
  children: ReactNode;
};

export const metadata = {
  title: 'Área autenticada | Builder',
  description: 'Área autenticada para configuração do site do negócio.'
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    // Futuro: podemos adicionar redirectTo na querystring
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold tracking-tight text-emerald-400">
            Builder
          </div>
          <div className="text-xs text-slate-400">
            Área autenticada
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
