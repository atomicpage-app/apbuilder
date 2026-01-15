// app/components/resend-confirmation-form.tsx

"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
        }
      ) => void;
    };
  }
}

export function ResendConfirmationForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "rate_limited"
  >("idle");

  const tokenRef = useRef<string | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!widgetRef.current || !window.turnstile) return;

    window.turnstile.render(widgetRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
      callback(token) {
        tokenRef.current = token;
      },
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    if (!tokenRef.current) {
      setStatus("error");
      return;
    }

    try {
      const res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          turnstileToken: tokenRef.current,
        }),
      });

      if (res.status === 429) {
        setStatus("rate_limited");
        return;
      }

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mt-6 w-full rounded-lg border border-gray-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
        />

        <div ref={widgetRef} />

        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 disabled:opacity-60"
        >
          {status === "loading"
            ? "Enviando..."
            : "Reenviar e-mail de confirmação"}
        </button>
      </form>

      {status === "success" && (
        <p className="mt-3 text-sm text-gray-600">
          Se existir uma conta com esse e-mail, um novo link de confirmação foi
          enviado.
        </p>
      )}

      {status === "rate_limited" && (
        <p className="mt-3 text-sm text-gray-600">
          Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.
        </p>
      )}

      {status === "error" && (
        <p className="mt-3 text-sm text-gray-600">
          Não foi possível enviar o e-mail agora. Tente novamente mais tarde.
        </p>
      )}
    </div>
  );
}
