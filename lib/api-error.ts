/** Classify a Gemini API error and return a human-friendly message. */
export function classifyApiError(error: unknown): { message: string; status: number } {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (lower.includes("api key") || lower.includes("permission denied") ||
      lower.includes("unauthenticated") || lower.includes("credentials")) {
    return {
      message: "Authentication failed. Check your GEMINI_API_KEY or GOOGLE_SERVICE_ACCOUNT_JSON in .env.local",
      status: 401,
    };
  }
  if (lower.includes("not found") || lower.includes("model") && lower.includes("404")) {
    return {
      message: `Model not available. Try setting MODEL_TEXT=gemini-2.0-flash in .env.local (error: ${msg})`,
      status: 503,
    };
  }
  if (lower.includes("quota") || lower.includes("rate limit") || lower.includes("resource_exhausted")) {
    return {
      message: "API rate limit hit. Wait a moment and try again.",
      status: 429,
    };
  }
  return { message: "Internal server error", status: 500 };
}
