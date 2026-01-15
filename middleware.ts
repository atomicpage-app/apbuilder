// middleware.ts

import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set([
  "/sign-in",
  "/sign-up",
  "/sign-up/success",
  "/verify-email/confirmed",
  "/verify-email/error",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rotas públicas absolutas (UX)
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // 2. Assets e rotas internas do Next
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // 3. Gate técnico existente (NÃO ALTERADO)
  // ⚠️ Aqui entra sua lógica atual de:
  // - autenticação
  // - leitura de sessão
  // - verificação de accounts.status
  // - redirects para /verify-email, /app/onboarding, /app
  //
  // >>> ESTE BLOCO DEVE PERMANECER EXATAMENTE COMO JÁ FUNCIONA <<<

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
      Aplica o middleware globalmente.
      A exclusão real acontece no código acima,
      de forma explícita e controlada.
    */
    "/((?!_next/static|_next/image).*)",
  ],
};
