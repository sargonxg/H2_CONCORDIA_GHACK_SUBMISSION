/** Classify a Gemini / Vertex AI error and return a human-friendly message + HTTP status. */
export function classifyApiError(error: unknown): { message: string; status: number } {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  // ── Authentication / Authorization ──────────────────────────────────────────
  if (
    lower.includes("api key") ||
    lower.includes("permission denied") ||
    lower.includes("unauthenticated") ||
    lower.includes("credentials") ||
    lower.includes("invalid_grant") ||
    lower.includes("401") ||
    lower.includes("403")
  ) {
    return {
      message:
        "Authentication failed. Check your GEMINI_API_KEY or GOOGLE_SERVICE_ACCOUNT_JSON in .env.local.",
      status: 401,
    };
  }

  // ── Rate limit / quota ───────────────────────────────────────────────────────
  if (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("resource_exhausted") ||
    lower.includes("too many requests")
  ) {
    return {
      message: "API rate limit reached. Please wait a moment and try again.",
      status: 429,
    };
  }

  // ── Model not found ──────────────────────────────────────────────────────────
  if (
    (lower.includes("not found") && lower.includes("model")) ||
    lower.includes("model_not_found") ||
    lower.includes("does not exist") ||
    lower.includes("404")
  ) {
    return {
      message: `Model not available. Try setting MODEL_TEXT=gemini-2.0-flash in .env.local. (${msg})`,
      status: 503,
    };
  }

  // ── Context / input too long ─────────────────────────────────────────────────
  if (
    lower.includes("context length") ||
    lower.includes("token limit") ||
    lower.includes("input too long") ||
    lower.includes("maximum context")
  ) {
    return {
      message: "Input too long. Try shortening the transcript before analyzing.",
      status: 413,
    };
  }

  // ── Service unavailable ──────────────────────────────────────────────────────
  if (
    lower.includes("service unavailable") ||
    lower.includes("backend error") ||
    lower.includes("overloaded") ||
    lower.includes("503")
  ) {
    return {
      message: "Gemini API is temporarily unavailable. Please try again shortly.",
      status: 503,
    };
  }

  return { message: `Internal server error: ${msg}`, status: 500 };
}
