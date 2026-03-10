import { z } from "zod";
import { analyzePathways } from "@/lib/ai-service";

const schema = z.object({
  transcript: z.string().min(1).max(50000),
  caseStructure: z.record(z.any()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    const { transcript, caseStructure } = parsed.data;
    const result = await analyzePathways(transcript, caseStructure);
    return Response.json({ result });
  } catch (error) {
    console.error("Analyze error:", error instanceof Error ? error.message : "Unknown");
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
