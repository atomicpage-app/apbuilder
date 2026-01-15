"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* ---------------- helpers (mascara + normalizacao) ---------------- */

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function maskPhone(value: string) {
  const d = onlyDigits(value).slice(0, 11);

  if (d.length <= 10) {
    // (11) 3333-4444
    return d.replace(
      /^(\d{0,2})(\d{0,4})(\d{0,4})/,
      (_, a, b, c) =>
        [a && `(${a})`, b, c && `-${c}`].filter(Boolean).join(" ")
    );
  }

  // (11) 99999-8888
  return d.replace(
    /^(\d{2})(\d{5})(\d{4})/,
    "($1) $2-$3"
  );
}

function maskZip(value: string) {
  const d = onlyDigits(value).slice(0, 8);
  return d.replace(/^(\d{5})(\d{0,3})/, (_, a, b) =>
    b ? `${a}-${b}` : a
  );
}

function isEmailLike(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/* ------------------------------------------------------------------ */

type FormState = {
  name: string;
  description: string;
  phoneCommercial: string;
  mobileCommercial: string;
  emailCommercial: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  complement: string;
};

type ApiError = { error?: string; message?: string };

export default function BusinessForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    phoneCommercial: "",
    mobileCommercial: "",
    emailCommercial: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zip: "",
    complement: "",
  });

  const requiredMissing = useMemo(() => {
    const required = [
      form.name,
      form.description,
      form.phoneCommercial,
      form.emailCommercial,
      form.street,
      form.number,
      form.neighborhood,
      form.city,
      form.state,
      form.zip,
    ];
    return required.some((v) => v.trim().length === 0);
  }, [form]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (requiredMissing) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!isEmailLike(form.emailCommercial)) {
      setError("E-mail comercial inválido.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        phoneCommercial: onlyDigits(form.phoneCommercial),
        mobileCommercial: form.mobileCommercial
          ? onlyDigits(form.mobileCommercial)
          : null,
        emailCommercial: form.emailCommercial.trim(),
        address: {
          street: form.street.trim(),
          number: onlyDigits(form.number),
          neighborhood: form.neighborhood.trim(),
          city: form.city.trim(),
          state: form.state.trim().toUpperCase(),
          zip: onlyDigits(form.zip),
          complement: form.complement.trim() || null,
        },
      };

      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await res.json().catch(() => ({}))) as ApiError;

      if (res.status === 201) {
        router.replace("/app");
        return;
      }

      if (res.status === 409) {
        setInfo("Negócio já cadastrado. Redirecionando…");
        setTimeout(() => router.replace("/app"), 600);
        return;
      }

      if (res.status === 401 || res.status === 403) {
        router.replace("/sign-in?next=/app/onboarding/business");
        return;
      }

      setError(body?.message ?? "Não foi possível criar o negócio.");
    } catch (err) {
      console.error("BusinessForm submit error:", err);
      setError("Erro inesperado ao criar o negócio.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* -------- Dados do negócio -------- */}
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-base font-medium text-gray-900">
          Dados do negócio
        </h2>

        <div className="space-y-2">
          <label className="text-sm font-medium">Nome *</label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            autoComplete="organization"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">O que faz *</label>
          <textarea
            className="min-h-[96px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>
      </section>

      {/* -------- Contato -------- */}
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-base font-medium text-gray-900">
          Contato comercial
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            placeholder="Telefone comercial *"
            inputMode="tel"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={form.phoneCommercial}
            onChange={(e) =>
              update("phoneCommercial", maskPhone(e.target.value))
            }
          />

          <input
            placeholder="Celular comercial"
            inputMode="tel"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={form.mobileCommercial}
            onChange={(e) =>
              update("mobileCommercial", maskPhone(e.target.value))
            }
          />
        </div>

        <input
          placeholder="E-mail comercial *"
          inputMode="email"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={form.emailCommercial}
          onChange={(e) => update("emailCommercial", e.target.value)}
        />
      </section>

      {/* -------- Endereço -------- */}
      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-base font-medium text-gray-900">Endereço</h2>

        <input
          placeholder="Logradouro *"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={form.street}
          onChange={(e) => update("street", e.target.value)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <input
            placeholder="Número *"
            inputMode="numeric"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={form.number}
            onChange={(e) =>
              update("number", onlyDigits(e.target.value))
            }
          />

          <input
            placeholder="Bairro *"
            className="sm:col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={form.neighborhood}
            onChange={(e) => update("neighborhood", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <input
            placeholder="Cidade *"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
          />

          <input
            placeholder="UF *"
            maxLength={2}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm uppercase"
            value={form.state}
            onChange={(e) =>
              update("state", e.target.value.toUpperCase())
            }
          />

          <input
            placeholder="CEP *"
            inputMode="numeric"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={form.zip}
            onChange={(e) =>
              update("zip", maskZip(e.target.value))
            }
          />
        </div>

        <input
          placeholder="Complemento"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={form.complement}
          onChange={(e) => update("complement", e.target.value)}
        />
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {info && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {info}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 disabled:opacity-50"
        >
          {submitting ? "Salvando..." : "Salvar e continuar"}
        </button>
      </div>
    </form>
  );
}
