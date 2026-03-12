import { z } from "zod";
import { analyzePathways } from "@/lib/ai-service";
import { classifyApiError } from "@/lib/api-error";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  transcript: z.string().min(1).max(100000),
  // Accept either a pre-stringified JSON string OR a plain object — both are valid
  caseStructure: z.union([z.string(), z.record(z.any())]).optional(),
  framework: z.string().optional(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = checkRateLimit(`analyze:${ip}`, 10, 60000);
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
      return Response.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { transcript, caseStructure, framework } = parsed.data;
    // Normalize to string — clients may send a JSON string or a plain object
    const caseStr =
      typeof caseStructure === "string"
        ? caseStructure
        : caseStructure
          ? JSON.stringify(caseStructure)
          : "";
    const result = await analyzePathways(transcript, caseStr, framework);
    return Response.json({ result });
  } catch (error) {
    const { message, status } = classifyApiError(error);
    console.error("Analyze error:", error instanceof Error ? error.message : error);
    return Response.json({ error: message }, { status });
  }
}
