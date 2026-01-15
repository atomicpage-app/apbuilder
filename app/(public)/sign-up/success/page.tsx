// app/sign-up/success/page.tsx

import Link from "next/link";
import { ResendConfirmationForm } from "@/app/components/resend-confirmation-form";

export default function SignUpSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">
        Conta criada com sucesso
      </h1>

      <p className="mb-6 text-sm text-gray-600">
        Enviamos um e-mail de confirmação para o endereço informado.
        <br />
        Para entrar na plataforma, é necessário confirmar seu e-mail primeiro.
      </p>

      <Link
        href="/sign-in"
        className="mb-6 inline-flex w-full justify-center rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
      >
        Ir para login
      </Link>

      <ResendConfirmationForm />
    </main>
  );
}
