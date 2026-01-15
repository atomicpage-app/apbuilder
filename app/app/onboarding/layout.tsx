// app/app/onboarding/layout.tsx

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {children}
    </div>
  );
}
