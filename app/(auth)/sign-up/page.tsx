// src/app/(auth)/sign-up/page.tsx
'use client';

import { FormEvent, useState } from 'react';

type SignUpResponse =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      errors: string[];
    };

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessages([]);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          password
        })
      });

      const data = (await response.json()) as SignUpResponse;

      if (!response.ok || !data.ok) {
        const errors = !data.ok ? data.errors : ['Não foi possível criar a conta.'];
        setErrorMessages(errors);
        return;
      }

      setSuccessMessage(data.message);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
    } catch (error) {
      console.error('Error submitting sign-up form:', error);
      setErrorMessages(['Erro inesperado. Tente novamente mais tarde.']);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-xl bg-slate-900 p-8 shadow-xl shadow-slate-900/50">
        <h1 className="mb-2 text-center text-2xl font-semibold text-slate-50">
          Criar conta
        </h1>
        <p className="mb-6 text-center text-sm text-slate-400">
          Crie sua conta para configurar o site institucional do seu negócio.
        </p>

        {errorMessages.length > 0 && (
          <div className="mb-4 rounded-lg border border-red-500/60 bg-red-500/10 p-3 text-sm text-red-200">
            <ul className="list-disc space-y-1 pl-4">
              {errorMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg border border-emerald-500/60 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-slate-200"
            >
              Nome completo
            </label>
            <input
              id="name"
              name="name"
              className="block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-200"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@exemplo.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-1 block text-sm font-medium text-slate-200"
            >
              Telefone (opcional)
            </label>
            <input
              id="phone"
              name="phone"
              className="block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(11) 99999-9999"
              autoComplete="tel"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-200"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Criando conta...' : 'Criar conta'}
          </button>

          <p className="pt-1 text-center text-xs text-slate-500">
            Ao continuar, você concorda em receber um e-mail para confirmar sua
            conta antes de acessar o painel.
          </p>
        </form>
      </div>
    </main>
  );
}
