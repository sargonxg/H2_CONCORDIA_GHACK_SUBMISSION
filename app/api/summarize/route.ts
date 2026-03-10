import { z } from "zod";
import { summarizeCase } from "@/lib/ai-service";
import { classifyApiError } from "@/lib/api-error";

const schema = z.object({
  transcript: z.string().min(1).max(50000),
  actors: z.array(z.any()).optional().default([]),
  primitives: z.array(z.any()).optional().default([]),
  commonGround: z.array(z.string()).optional().default([]),
  tensionPoints: z.array(z.string()).optional().default([]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    const { transcript, actors, primitives, commonGround, tensionPoints } = parsed.data;
    const result = await summarizeCase({
      transcript: transcript ?? "",
      actors: actors ?? [],
      primitives: primitives ?? [],
      commonGround: commonGround ?? [],
      tensionPoints: tensionPoints ?? [],
    });
    return Response.json({ result });
  } catch (error) {
    const { message, status } = classifyApiError(error);
    console.error("Summarize error:", error instanceof Error ? error.message : error);
    return Response.json({ error: message }, { status });
  }
}
