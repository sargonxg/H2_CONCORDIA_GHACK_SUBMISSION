import { NextRequest } from 'next/server';
import { processDocument } from '@/lib/ai-service';
import { checkRateLimit } from '@/lib/rate-limit';
import { classifyApiError } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const limit = checkRateLimit(`doc:${ip}`, 10, 60000);
  if (!limit.allowed) return Response.json({ error: 'Rate limited' }, { status: 429 });
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return Response.json({ error: 'No file' }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return Response.json({ error: 'File exceeds 5MB' }, { status: 400 });
    const result = await processDocument(file);
    return Response.json({ summary: result });
  } catch (error) {
    const { message, status } = classifyApiError(error);
    return Response.json({ error: message }, { status });
  }
}
