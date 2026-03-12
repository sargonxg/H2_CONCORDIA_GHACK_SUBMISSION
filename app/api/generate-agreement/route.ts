import { NextRequest } from 'next/server';
import { generateAgreement } from '@/lib/ai-service';
import { checkRateLimit } from '@/lib/rate-limit';
import { classifyApiError } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const limit = checkRateLimit(`agreement:${ip}`, 5, 60000);
  if (!limit.allowed) return Response.json({ error: 'Rate limited' }, { status: 429 });
  try {
    const body = await request.json();
    const agreement = await generateAgreement(body);
    return Response.json({ agreement });
  } catch (error) {
    const { message, status } = classifyApiError(error);
    return Response.json({ error: message }, { status });
  }
}
