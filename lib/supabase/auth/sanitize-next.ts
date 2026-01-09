// lib/supabase/auth/sanitize-next.ts

/**
 * Sanitiza o parâmetro `next` para evitar open redirect.
 * Regras:
 * - aceita apenas paths relativos iniciando com "/"
 * - rejeita URLs absolutas (http/https), protocol-relative ("//"), e paths inválidos
 * - normaliza e remove caracteres de controle
 * - fallback padrão: "/app"
 */
export function sanitizeNext(
  nextValue: string | null | undefined,
  fallback: string = "/app"
): string {
  if (!nextValue) return fallback;

  const raw = String(nextValue).trim();

  // Remove caracteres de controle básicos (evita bypasses com \n \r \t etc.)
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, "");

  if (!cleaned) return fallback;

  // Não aceita URL absoluta
  const lower = cleaned.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return fallback;
  }

  // Não aceita protocol-relative
  if (cleaned.startsWith("//")) return fallback;

  // Aceita somente paths do app (precisa começar com "/")
  if (!cleaned.startsWith("/")) return fallback;

  // Bloqueia tentativa de path traversal óbvia
  if (cleaned.includes("..")) return fallback;

  // Bloqueia backslash (Windows path quirks)
  if (cleaned.includes("\\")) return fallback;

  // Limite defensivo de tamanho
  if (cleaned.length > 2048) return fallback;

  return cleaned;
}
