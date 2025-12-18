"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setIsLoggingOut(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/sign-out", { method: "POST" });

      if (!res.ok) {
        setError("Não foi possível sair. Tente novamente.");
        setIsLoggingOut(false);
        return;
      }

      router.push("/sign-in");
      router.refresh();
    } catch {
      setError("Não foi possível sair. Tente novamente.");
      setIsLoggingOut(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-80"
      >
        {isLoggingOut ? "Saindo..." : "Sair"}
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
