// app/app/onboarding/business/page.tsx
import BusinessForm from "./BusinessForm";

export default function BusinessOnboardingPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Cadastre seu negócio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Preencha as informações institucionais para liberar o acesso ao app.
        </p>
      </header>

      <BusinessForm />
    </div>
  );
}
