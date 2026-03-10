import { transcribeAudio } from "@/lib/ai-service";

export async function POST(request: Request) {
  try {
    const { base64Audio, mimeType } = await request.json();
    const text = await transcribeAudio(base64Audio, mimeType);
    return Response.json({ text });
  } catch (error: any) {
    console.error("Transcribe error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
