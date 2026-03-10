import { z } from "zod";
import { generateSpeech } from "@/lib/ai-service";

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
    console.error("TTS error:", error instanceof Error ? error.message : "Unknown");
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
