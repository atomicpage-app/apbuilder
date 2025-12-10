'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";

type SignUpFormState = {
  isLoading: boolean;
  error: string | null;
  success: string | null;
};

export default function SignUpPage() {
  const [state, setState] = useState<SignUpFormState>({
    isLoading: false,
    error: null,
    success: null,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // IMPORTANTE: capturar o form ANTES do await para evitar erro no SyntheticEvent
    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!name || !email || !password) {
      setState({
        isLoading: false,
        error: "Preencha todos os campos.",
        success: null,
      });
      return;
    }

    setState({ isLoading: true, error: null, success: null });

    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Não foi possível criar sua conta. Tente novamente.";
        setState({
          isLoading: false,
          error: message,
          success: null,
        });
        return;
      }

      setState({
        isLoading: false,
        error: null,
        success:
          "Conta criada com sucesso. Verifique seu e-mail para confirmar o cadastro.",
      });

      // Agora usamos a referência salva do form, não o event.currentTarget pós-await
      form.reset();
    } catch (error) {
      console.error("[SIGN-UP HANDLE SUBMIT ERROR]", error);
      setState({
        isLoading: false,
        error: "Ocorreu um erro inesperado. Tente novamente.",
        success: null,
      });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Criar conta
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Crie sua conta para começar a usar a aplicação.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-800"
            >
              Nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
              placeholder="Seu nome completo"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-800"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
              placeholder="seuemail@exemplo.com"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-800"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
              placeholder="Crie uma senha"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}
          {state.success && (
            <p className="text-sm text-green-600">{state.success}</p>
          )}

          <button
            type="submit"
            disabled={state.isLoading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {state.isLoading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Já tem uma conta?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-slate-900 underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
