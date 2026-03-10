import { z } from "zod";
import { extractPrimitives } from "@/lib/ai-service";

const schema = z.object({
  text: z.string().min(1).max(50000),
});

export async function POST(request: Request) {
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
    console.error("Extract error:", error instanceof Error ? error.message : "Unknown");
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
