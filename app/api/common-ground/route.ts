import { backgroundAnalyzeCommonGround } from "@/lib/ai-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { classifyApiError } from "@/lib/api-error";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = checkRateLimit(`cg:${ip}`, 10, 60000);
  if (!limit.allowed) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }
  try {
    const body = await request.json();
    const result = await backgroundAnalyzeCommonGround(
      body.transcript,
      body.primitives,
      body.actors,
    );
    return Response.json(result);
  } catch (error) {
    const { message, status } = classifyApiError(error);
    return Response.json({ error: message }, { status });
  }
}
