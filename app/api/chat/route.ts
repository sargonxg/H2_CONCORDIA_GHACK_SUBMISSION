import { z } from "zod";
import { chatWithAdvisor } from "@/lib/ai-service";
import { classifyApiError } from "@/lib/api-error";

const schema = z.object({
  message: z.string().min(1).max(10000),
  history: z.array(z.any()).optional().default([]),
  caseContext: z.string().optional().default(""),
});

export async function POST(request: Request) {
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
