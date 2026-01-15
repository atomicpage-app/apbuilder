// app/(public)/verify-email/error/page.tsx

import Link from "next/link";
import { ResendConfirmationForm } from "@/app/components/resend-confirmation-form";

export default function VerifyEmailErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-2 text-2xl font-semibold">
        Não foi possível confirmar seu e-mail
      </h1>

      <p className="mb-6 text-sm text-gray-600">
        O link de confirmação pode estar expirado, inválido
        <br />
        ou já ter sido utilizado.
      </p>

      <Link
        href="/sign-in"
        className="mb-6 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100"
      >
        Ir para login
      </Link>

      <ResendConfirmationForm />
    </main>
  );
}
