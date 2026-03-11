/**
 * Safely parse a JSON string. Returns `fallback` on any parse error or
 * if the input is null/undefined/empty, instead of throwing.
 */
export function safeJsonParse<T = any>(
  str: string | null | undefined,
  fallback: T,
): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}
