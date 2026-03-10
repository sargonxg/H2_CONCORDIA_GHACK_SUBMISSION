import { z } from "zod";
import { researchGrounding } from "@/lib/ai-service";

const schema = z.object({
  query: z.string().min(1).max(10000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    const { query } = parsed.data;
    const result = await researchGrounding(query);
    return Response.json(result);
  } catch (error) {
    console.error("Research error:", error instanceof Error ? error.message : "Unknown");
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
