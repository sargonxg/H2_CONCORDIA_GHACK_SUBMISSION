import { z } from "zod";
import { generateSpeech } from "@/lib/ai-service";
import { classifyApiError } from "@/lib/api-error";

const schema = z.object({
  text: z.string().min(1).max(10000),
  voiceName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    const { text, voiceName } = parsed.data;
    const audio = await generateSpeech(text, voiceName);
    return Response.json({ audio });
  } catch (error) {
    const { message, status } = classifyApiError(error);
    console.error("TTS error:", error instanceof Error ? error.message : error);
    return Response.json({ error: message }, { status });
  }
}
