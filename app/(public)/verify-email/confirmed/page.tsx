// app/verify-email/confirmed/page.tsx

import Link from "next/link";

export default function VerifyEmailConfirmedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-4 text-2xl font-semibold">
        E-mail confirmado com sucesso
      </h1>

      <p className="mb-6 text-sm text-gray-600">
        Seu e-mail foi confirmado.
        <br />
        Agora você pode entrar na sua conta.
      </p>

      <div className="w-full">
        <Link
          href="/sign-in"
          className="block rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Ir para login
        </Link>
      </div>
    </main>
  );
}
