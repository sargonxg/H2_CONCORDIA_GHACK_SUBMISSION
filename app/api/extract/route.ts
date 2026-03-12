import { z } from "zod";
import { extractPrimitives } from "@/lib/ai-service";
import { classifyApiError } from "@/lib/api-error";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  text: z.string().min(1).max(50000),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = checkRateLimit(`extract:${ip}`, 20, 60000);
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
      return Response.json({ error: "Transcript is required" }, { status: 422 });
    }
    const { text } = parsed.data;
    const result = await extractPrimitives(text);
    return Response.json({ result });
  } catch (error) {
    const { message, status } = classifyApiError(error);
    console.error("Extract error:", error instanceof Error ? error.message : error);
    return Response.json({ error: message }, { status });
  }
}
