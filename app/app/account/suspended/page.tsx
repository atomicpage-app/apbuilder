import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function SuspendedAccountPage() {
  const cookieStore = await cookies();

  if (!cookieStore.get("sb-access-token")) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Conta suspensa
        </h1>

        <p className="text-gray-600">
          Sua conta está temporariamente suspensa. O acesso ao sistema está indisponível no momento.
        </p>

        <p className="text-sm text-gray-500">
          Se você acredita que isso é um engano, entre em contato com o suporte.
        </p>

        <div className="pt-4">
          <a
            href="mailto:suporte@seudominio.com"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Entrar em contato com o suporte
          </a>
        </div>
      </div>
    </main>
  );
}
