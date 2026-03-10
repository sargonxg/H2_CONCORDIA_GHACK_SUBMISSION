import { z } from "zod";
import { researchGrounding } from "@/lib/ai-service";
import { classifyApiError } from "@/lib/api-error";

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
    const { message, status } = classifyApiError(error);
    console.error("Research error:", error instanceof Error ? error.message : error);
    return Response.json({ error: message }, { status });
  }
}
