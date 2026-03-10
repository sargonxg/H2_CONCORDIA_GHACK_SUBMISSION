import { z } from "zod";
import { analyzePathways } from "@/lib/ai-service";
import { classifyApiError } from "@/lib/api-error";

const schema = z.object({
  transcript: z.string().min(1).max(50000),
  caseStructure: z.record(z.any()).optional(),
  framework: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    const { transcript, caseStructure, framework } = parsed.data;
    const result = await analyzePathways(
      transcript,
      caseStructure ? JSON.stringify(caseStructure) : "",
      framework,
    );
    return Response.json({ result });
  } catch (error) {
    const { message, status } = classifyApiError(error);
    console.error("Analyze error:", error instanceof Error ? error.message : error);
    return Response.json({ error: message }, { status });
  }
}
