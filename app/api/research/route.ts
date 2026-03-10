import { researchGrounding } from "@/lib/ai-service";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    const result = await researchGrounding(query);
    return Response.json(result);
  } catch (error: any) {
    console.error("Research error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
