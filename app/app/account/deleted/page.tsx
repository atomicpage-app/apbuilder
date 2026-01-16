import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function DeletedAccountPage() {
  const cookieStore = await cookies();

  if (!cookieStore.get("sb-access-token")) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Conta desativada
        </h1>

        <p className="text-gray-600">
          Esta conta foi desativada.
        </p>

        <p className="text-sm text-gray-500">
          Se você acredita que isso é um erro, entre em contato com o suporte.
        </p>

        <div className="pt-4">
          <form action="/sign-in">
            <button
              type="submit"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Voltar para o login
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
