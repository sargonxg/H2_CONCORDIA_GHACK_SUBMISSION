import { z } from "zod";
import { transcribeAudio } from "@/lib/ai-service";

const ALLOWED_MIME_TYPES = [
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
] as const;

const schema = z.object({
  base64Audio: z.string().min(1),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    const { base64Audio, mimeType } = parsed.data;
    const text = await transcribeAudio(base64Audio, mimeType);
    return Response.json({ text });
  } catch (error) {
    console.error("Transcribe error:", error instanceof Error ? error.message : "Unknown");
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
