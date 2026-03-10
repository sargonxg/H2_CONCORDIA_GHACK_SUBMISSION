import { chatWithAdvisor } from "@/lib/ai-service";

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();
    const text = await chatWithAdvisor(message, history);
    return Response.json({ text });
  } catch (error: any) {
    console.error("Chat error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
