import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Rotas públicas de UX (não passam pelo gate)
 * ⚠️ NÃO misturar com regras de estado de conta
 */
const PUBLIC_PATHS = new Set([
  "/sign-in",
  "/sign-up",
  "/sign-up/success",
  "/verify-email/confirmed",
  "/verify-email/error",
]);

/**
 * Rotas técnicas de estado de conta
 * (middleware só redireciona, não faz UX)
 */
const ACCOUNT_STATE_REDIRECTS: Record<string, string> = {
  suspended: "/account/suspended",
  disabled: "/account/blocked", // disabled == blocked (conceito)
  deleted: "/account/deleted",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /**
   * 1. Rotas públicas absolutas (UX)
   */
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  /**
   * 2. Assets e rotas internas do Next
   */
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  /**
   * 3. Gate técnico central (P5)
   * - autenticação
   * - email confirmado
   * - status da conta
   * - regras de negócio existentes
   */
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: any) => {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  /**
   * 3.1 Sessão
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  /**
   * 3.2 E-mail não confirmado
   * (estado transitório, NÃO é estado avançado)
   */
  if (!user.email_confirmed_at) {
    if (pathname.startsWith("/verify-email")) {
      return response;
    }

    return NextResponse.redirect(new URL("/verify-email", request.url));
  }

  /**
   * 3.3 Resolver account
   */
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("id,status")
    .eq("user_id", user.id)
    .single();

  // Invariante quebrada → fail closed
  if (accountError || !account) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const status = account.status as string;

  /**
   * 3.4 Estados avançados (≠ active)
   */
  if (status !== "active") {
    const redirectPath = ACCOUNT_STATE_REDIRECTS[status];

    // Estado desconhecido → fail closed
    if (!redirectPath) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Permite permanecer na rota correta
    if (pathname === redirectPath) {
      return response;
    }

    return NextResponse.redirect(
      new URL(redirectPath, request.url)
    );
  }

  /**
   * 3.5 Status active → regras de negócio existentes
   * (onboarding de business)
   */
  if (pathname.startsWith("/app")) {
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("account_id", account.id)
      .maybeSingle();

    if (!business && !pathname.startsWith("/app/onboarding")) {
      return NextResponse.redirect(
        new URL("/app/onboarding/business", request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
      Aplica o middleware globalmente.
      Exclusões são feitas explicitamente no código,
      para evitar regressões silenciosas.
    */
    "/((?!_next/static|_next/image).*)",
  ],
};
