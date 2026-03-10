import { extractPrimitives } from "@/lib/ai-service";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const result = await extractPrimitives(text);
    return Response.json({ result });
  } catch (error: any) {
    console.error("Extract error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
