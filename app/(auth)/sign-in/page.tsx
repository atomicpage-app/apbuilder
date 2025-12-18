"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { sanitizeNext } from "@/lib/supabase/auth/sanitize-next";

type SignInFormState = {
  isLoading: boolean;
  error: string | null;
  info: string | null;
  needsEmailConfirmation: boolean;
  isAuthenticated: boolean;
};

type ResendState = {
  isSending: boolean;
  message: string | null;
  error: string | null;
};

type LogoutState = {
  isLoggingOut: boolean;
  error: string | null;
};

function sanitizeNextNullable(nextParam: string | null) {
  if (!nextParam) return null;
  const sanitized = sanitizeNext(nextParam, "/app");
  // Se sanitizou e devolveu fallback, tratamos como "não fornecido" para UI.
  if (sanitized === "/app" && nextParam !== "/app") return null;
  return sanitized;
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmedFromEmail = searchParams.get("confirmed") === "1";
  const nextParam = sanitizeNextNullable(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [state, setState] = useState<SignInFormState>({
    isLoading: false,
    error: null,
    info: null,
    needsEmailConfirmation: false,
    isAuthenticated: false,
  });

  const [resendState, setResendState] = useState<ResendState>({
    isSending: false,
    message: null,
    error: null,
  });

  const [logoutState, setLogoutState] = useState<LogoutState>({
    isLoggingOut: false,
    error: null,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Informe e-mail e senha.",
        info: null,
        needsEmailConfirmation: false,
        isAuthenticated: false,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      info: null,
      needsEmailConfirmation: false,
      isAuthenticated: false,
    }));

    setResendState({ isSending: false, message: null, error: null });
    setLogoutState({ isLoggingOut: false, error: null });

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const needsEmailConfirmation =
          !!(data && (data as any).needsEmailConfirmation === true);

        const message =
          (data && typeof (data as any).error === "string" && (data as any).error) ||
          (needsEmailConfirmation
            ? "Sua conta ainda não foi confirmada. Verifique seu e-mail ou solicite o reenvio."
            : "Não foi possível entrar. Verifique seus dados e tente novamente.");

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
          info: null,
          needsEmailConfirmation,
          isAuthenticated: false,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
        info: "Login realizado com sucesso.",
        needsEmailConfirmation: false,
        isAuthenticated: true,
      }));

      const destination = nextParam || "/app";
      router.push(destination);
      router.refresh();
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Ocorreu um erro inesperado. Tente novamente.",
        info: null,
        needsEmailConfirmation: false,
        isAuthenticated: false,
      }));
    }
  }

  async function handleResendConfirmation() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setResendState({
        isSending: false,
        message: null,
        error: "Informe o e-mail utilizado no cadastro para reenviar a confirmação.",
      });
      return;
    }

    setResendState({ isSending: true, message: null, error: null });

    try {
      const response = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json().catch(() => null);

      const genericMessage =
        (data && typeof (data as any).message === "string" && (data as any).message) ||
        "Se existir uma conta com este e-mail, enviaremos um novo link de confirmação.";

      setResendState({ isSending: false, message: genericMessage, error: null });
    } catch {
      setResendState({
        isSending: false,
        message: null,
        error: "Não foi possível processar o reenvio. Tente novamente.",
      });
    }
  }

  async function handleLogout() {
    setLogoutState({ isLoggingOut: true, error: null });

    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });

      if (!response.ok) {
        setLogoutState({
          isLoggingOut: false,
          error: "Não foi possível sair. Tente novamente.",
        });
        return;
      }

      setState((prev) => ({
        ...prev,
        isAuthenticated: false,
        info: null,
      }));

      setEmail("");
      setPassword("");

      router.push("/sign-in");
      router.refresh();
    } catch {
      setLogoutState({
        isLoggingOut: false,
        error: "Não foi possível sair. Tente novamente.",
      });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Entrar
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Acesse sua conta para continuar.
          </p>

          {confirmedFromEmail && (
            <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              Seu e-mail foi confirmado com sucesso. Agora você pode entrar na sua conta.
            </p>
          )}

          {nextParam && (
            <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Faça login para acessar a área protegida.
            </p>
          )}
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-800">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
              placeholder="seuemail@exemplo.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-800">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
              placeholder="Digite sua senha"
            />
          </div>

          {state.error && <p className="text-sm text-red-500">{state.error}</p>}
          {state.info && <p className="text-sm text-green-600">{state.info}</p>}

          {state.needsEmailConfirmation && (
            <div className="space-y-2 rounded-md border border-dashed border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-800">
              <p>
                Sua conta ainda não foi confirmada. Verifique sua caixa de entrada
                ou solicite um novo e-mail de confirmação abaixo.
              </p>
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendState.isSending}
                className="mt-1 inline-flex items-center rounded-md border border-yellow-500 px-3 py-1 text-xs font-medium text-yellow-900 transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {resendState.isSending ? "Reenviando..." : "Reenviar e-mail de confirmação"}
              </button>
              {resendState.error && <p className="text-xs text-red-500">{resendState.error}</p>}
              {resendState.message && <p className="text-xs text-green-700">{resendState.message}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={state.isLoading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {state.isLoading ? "Entrando..." : "Entrar"}
          </button>

          {state.isAuthenticated && (
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-700">Sessão ativa.</p>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutState.isLoggingOut}
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {logoutState.isLoggingOut ? "Saindo..." : "Sair"}
                </button>
              </div>
              {logoutState.error && <p className="mt-2 text-xs text-red-500">{logoutState.error}</p>}
            </div>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Ainda não tem conta?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-slate-900 underline-offset-4 hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
