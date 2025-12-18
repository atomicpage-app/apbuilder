"use client";

// app/app/onboarding/business/BusinessForm.tsx
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

function isEmailLike(value: string) {
  // MVP: validação leve (backend é autoridade)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function BusinessForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
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

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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
        phoneCommercial: form.phoneCommercial.trim(),
        mobileCommercial: form.mobileCommercial.trim() ? form.mobileCommercial.trim() : null,
        emailCommercial: form.emailCommercial.trim(),
        address: {
          street: form.street.trim(),
          number: form.number.trim(),
          neighborhood: form.neighborhood.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zip: form.zip.trim(),
          complement: form.complement.trim() ? form.complement.trim() : null,
        },
      };

      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await res.json().catch(() => ({}))) as ApiError & Record<string, unknown>;

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
      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="text-base font-medium">Dados do negócio</h2>

        <div className="space-y-2">
          <label className="text-sm font-medium">Nome *</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Ex: Oficina do João"
            autoComplete="organization"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">O que faz *</label>
          <textarea
            className="min-h-[96px] w-full rounded-md border px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Descreva em uma frase o serviço ou atuação do negócio"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="text-base font-medium">Contato comercial</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Telefone comercial *</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.phoneCommercial}
              onChange={(e) => update("phoneCommercial", e.target.value)}
              placeholder="Ex: 1133334444"
              autoComplete="tel"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Celular comercial</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.mobileCommercial}
              onChange={(e) => update("mobileCommercial", e.target.value)}
              placeholder="Ex: 11999998888"
              autoComplete="tel"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">E-mail comercial *</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.emailCommercial}
            onChange={(e) => update("emailCommercial", e.target.value)}
            placeholder="contato@seudominio.com"
            autoComplete="email"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="text-base font-medium">Endereço</h2>

        <div className="space-y-2">
          <label className="text-sm font-medium">Logradouro *</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.street}
            onChange={(e) => update("street", e.target.value)}
            placeholder="Rua, Avenida..."
            autoComplete="street-address"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
            <label className="text-sm font-medium">Número *</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.number}
              onChange={(e) => update("number", e.target.value)}
              placeholder="123"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Bairro *</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.neighborhood}
              onChange={(e) => update("neighborhood", e.target.value)}
              placeholder="Centro"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
            <label className="text-sm font-medium">Cidade *</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="São Paulo"
            />
          </div>

          <div className="space-y-2 sm:col-span-1">
            <label className="text-sm font-medium">Estado *</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.state}
              onChange={(e) => update("state", e.target.value)}
              placeholder="SP"
            />
          </div>

          <div className="space-y-2 sm:col-span-1">
            <label className="text-sm font-medium">CEP *</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.zip}
              onChange={(e) => update("zip", e.target.value)}
              placeholder="01000-000"
              autoComplete="postal-code"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Complemento</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.complement}
            onChange={(e) => update("complement", e.target.value)}
            placeholder="Sala, bloco, apto..."
          />
        </div>
      </section>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {info ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {info}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Salvando..." : "Salvar e continuar"}
        </button>
      </div>
    </form>
  );
}
