// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = new Set([
  "/sign-in",
  "/sign-up",
  "/sign-up/success",
  "/verify-email/confirmed",
  "/verify-email/error",
]);

const ACCOUNT_STATE_REDIRECTS: Record<string, string> = {
  suspended: "/account/suspended",
  disabled: "/account/blocked",
  deleted: "/account/deleted",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // APIs fora
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Rotas públicas
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // Assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Sessão
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("[MW][SESSION]", {
    path: pathname,
    hasUser: Boolean(user),
    userId: user?.id ?? null,
  });

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Email não confirmado
  if (!user.email_confirmed_at) {
    if (pathname.startsWith("/verify-email")) {
      return response;
    }
    return NextResponse.redirect(new URL("/verify-email", request.url));
  }

  // Account
  const { data: account } = await supabase
    .from("accounts")
    .select("id, tenant_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  console.log("[MW][ACCOUNT]", {
    path: pathname,
    userId: user.id,
    accountFound: Boolean(account),
    tenantId: account?.tenant_id ?? null,
    status: account?.status ?? null,
  });

  // Usuário ainda sem account → onboarding decide
  if (!account) {
    return response;
  }

  // Estados avançados
  if (account.status !== "active") {
    const redirectPath = ACCOUNT_STATE_REDIRECTS[account.status];
    if (!redirectPath) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    if (pathname === redirectPath) {
      return response;
    }
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  /**
   * REGRA ÚNICA DE BUSINESS
   * business EXISTE ⇔ tenant_id
   */
  if (pathname.startsWith("/app")) {
    const { data: business } = await supabase
      .from("business")
      .select("id")
      .eq("tenant_id", account.tenant_id)
      .maybeSingle();

    console.log("[MW][BUSINESS]", {
      path: pathname,
      tenantId: account.tenant_id,
      businessFound: Boolean(business),
    });

    console.log('[MW][PATH]', request.nextUrl.pathname);

    // Não tem business → onboarding
    if (!business && !pathname.startsWith("/app/onboarding")) {
      return NextResponse.redirect(
        new URL("/app/onboarding/business", request.url)
      );
    }

    // Tem business → nunca voltar ao onboarding
    if (business && pathname.startsWith("/app/onboarding")) {
      return NextResponse.redirect(
        new URL("/home", request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image).*)"],
};
