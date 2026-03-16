import { NextRequest } from 'next/server';
import { processDocument } from '@/lib/ai-service';
import { checkRateLimit } from '@/lib/rate-limit';
import { classifyApiError } from '@/lib/api-error';
import {
  processDocumentPipeline,
  synthesizeDocuments,
  DocumentExtractionResult,
} from '@/lib/document-pipeline';
import { generatePreSessionBriefing } from '@/lib/pre-session-briefing';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const limit = checkRateLimit(`doc:${ip}`, 10, 60000);
  if (!limit.allowed) return Response.json({ error: 'Rate limited' }, { status: 429 });

  try {
    const formData = await request.formData();

    // Check for multiple files (new multi-file path)
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;
    const partyAName = (formData.get('partyAName') as string) || 'Party A';
    const partyBName = (formData.get('partyBName') as string) || 'Party B';

    // Determine which files to process
    const filesToProcess: File[] = files.length > 0 ? files : singleFile ? [singleFile] : [];

    if (filesToProcess.length === 0) {
      return Response.json({ error: 'No file' }, { status: 400 });
    }

    // Validate file sizes
    for (const file of filesToProcess) {
      if (file.size > 5 * 1024 * 1024) {
        return Response.json(
          { error: `File "${file.name}" exceeds 5MB limit` },
          { status: 400 },
        );
      }
    }

    // ── Single file backward-compatible path ──
    // If a single file was provided via the old 'file' field and no 'files[]',
    // return the legacy format alongside the new structured format.
    if (files.length === 0 && singleFile) {
      const [summary, extraction] = await Promise.all([
        processDocument(singleFile),
        processDocumentPipeline(
          await singleFile.arrayBuffer(),
          singleFile.name,
          singleFile.type,
        ),
      ]);

      return Response.json({
        // Legacy field for backward compatibility
        summary,
        // New structured fields
        extractions: [extraction],
      });
    }

    // ── Multi-file deep ingestion path ──
    const extractions: DocumentExtractionResult[] = await Promise.all(
      filesToProcess.map(async (file) => {
        const content = await file.arrayBuffer();
        return processDocumentPipeline(content, file.name, file.type);
      }),
    );

    // Synthesize across documents when multiple files are provided
    const synthesis = extractions.length > 1
      ? await synthesizeDocuments(extractions)
      : undefined;

    // Generate pre-session briefing if synthesis is available
    const briefing = synthesis
      ? generatePreSessionBriefing(extractions, synthesis, partyAName, partyBName)
      : undefined;

    return Response.json({
      extractions,
      synthesis,
      briefing,
    });
  } catch (error) {
    const { message, status } = classifyApiError(error);
    return Response.json({ error: message }, { status });
  }
}
