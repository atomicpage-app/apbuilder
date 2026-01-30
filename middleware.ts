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

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (!user.email_confirmed_at) {
    if (pathname.startsWith("/verify-email")) {
      return response;
    }
    return NextResponse.redirect(new URL("/verify-email", request.url));
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("id, tenant_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  // Usuário sem account ainda → onboarding decide
  if (!account) {
    return response;
  }

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
   * Regras de negócio do app (onboarding de business)
   * Compatível com dados legados
   */
  if (pathname.startsWith("/app")) {
    const { data: business } = await supabase
      .from("business")
      .select("id")
      .or(
        [
          account.tenant_id
            ? `tenant_id.eq.${account.tenant_id}`
            : null,
          `account_id.eq.${account.id}`,
        ]
          .filter(Boolean)
          .join(",")
      )
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
    "/((?!api|_next/static|_next/image).*)",
  ],
};
