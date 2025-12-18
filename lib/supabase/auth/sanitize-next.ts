export function sanitizeNext(input: string | null | undefined, fallback = "/app") {
  if (!input) return fallback;

  // remove espaços e normaliza
  const value = String(input).trim();

  // precisa começar com "/" e não pode começar com "//"
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;

  // bloqueia tentativas óbvias de URL absoluta embutida
  if (value.includes("://")) return fallback;

  // opcional: limitar tamanho para evitar abuso
  if (value.length > 2048) return fallback;

  return value;
}
