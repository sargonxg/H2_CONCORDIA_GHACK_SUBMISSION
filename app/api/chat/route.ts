import { z } from "zod";
import { chatWithAdvisor } from "@/lib/ai-service";
import { classifyApiError } from "@/lib/api-error";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  message: z.string().min(1).max(10000),
  history: z.array(z.any()).optional().default([]),
  caseContext: z.string().optional().default(""),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = checkRateLimit(`chat:${ip}`, 30, 60000);
  if (!limit.allowed) {
    return Response.json(
      { error: "Rate limited", retryAfter: limit.retryAfter },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    const { message, history, caseContext } = parsed.data;
    const text = await chatWithAdvisor(message, history, caseContext);
    return Response.json({ text });
  } catch (error) {
    const { message, status } = classifyApiError(error);
    console.error("Chat error:", error instanceof Error ? error.message : error);
    return Response.json({ error: message }, { status });
  }
}
