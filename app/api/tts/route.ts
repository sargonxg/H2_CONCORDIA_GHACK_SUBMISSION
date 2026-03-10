import { generateSpeech } from "@/lib/ai-service";

export async function POST(request: Request) {
  try {
    const { text, voiceName } = await request.json();
    const audio = await generateSpeech(text, voiceName);
    return Response.json({ audio });
  } catch (error: any) {
    console.error("TTS error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
