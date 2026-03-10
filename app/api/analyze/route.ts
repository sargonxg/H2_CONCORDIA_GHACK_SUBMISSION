import { analyzePathways } from "@/lib/ai-service";

export async function POST(request: Request) {
  try {
    const { transcript, caseStructure } = await request.json();
    const result = await analyzePathways(transcript, caseStructure);
    return Response.json({ result });
  } catch (error: any) {
    console.error("Analyze error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
