// ── Deep Document Ingestion & Ontology Pre-Population Pipeline ──
// Part of Prompt 2: Extracts structured conflict primitives from uploaded documents
// and synthesizes cross-document findings for pre-session briefings.

import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import path from "path";
import os from "os";

// ── Types ──

export interface DocumentExtractionResult {
  metadata: {
    type: 'contract' | 'email' | 'complaint' | 'report' | 'other';
    date?: string;
    author?: string;
    recipients?: string[];
    filename: string;
  };
  summary: string;
  extractedPrimitives: {
    actors: { name: string; role: string; type: string }[];
    claims: { content: string; type: string; actorName: string }[];
    interests: { content: string; type: string; priority: string; actorName: string }[];
    constraints: { content: string; type: string; rigidity: string; actorName: string }[];
    events: { content: string; type: string; timestamp?: string; impact: string }[];
    narratives: { content: string; type: string; framing: string; actorName: string }[];
    keyDates: { date: string; description: string }[];
    monetaryAmounts: { amount: string; context: string }[];
    quotedStatements: { quote: string; speaker: string; context: string }[];
  };
}

export interface CrossDocumentSynthesis {
  contradictions: { topic: string; partyAVersion: string; partyBVersion: string; source: string }[];
  timeline: { date: string; event: string; source: string }[];
  missingInformation: string[];
  powerAsymmetries: string[];
}

// ── Lazy AI Initialization (mirrors ai-service.ts pattern) ──

let _pipelineAI: GoogleGenAI | null = null;
let _pipelineModel = "";

function initPipelineAI(): GoogleGenAI {
  if (_pipelineAI) return _pipelineAI;

  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (saJson && saJson.trim() !== "" && !saJson.includes("{...}")) {
    try {
      const credPath = path.join(os.tmpdir(), "gcloud-credentials.json");
      fs.writeFileSync(credPath, saJson);
      process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
    } catch (err) {
      console.warn("[DocumentPipeline] Could not write service account credentials:", err);
    }
  }

  const useVertex = process.env.USE_VERTEX_AI === "true";

  if (useVertex) {
    _pipelineAI = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT || "",
      location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
    });
    _pipelineModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-preview-native-audio-dialog";
  } else {
    _pipelineAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
    });
    _pipelineModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-preview-native-audio-dialog";
  }

  // Use a text-capable model for document processing
  const textModel = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
  _pipelineModel = textModel;

  console.log(`[DocumentPipeline] Initialized with model: ${_pipelineModel}`);
  return _pipelineAI;
}

// ── Extraction Prompt ──

const EXTRACTION_PROMPT = `You are a conflict analysis expert for the CONCORDIA mediation platform by TACITUS.
Analyze the following document and extract structured information for a mediation pre-session briefing.

You MUST return valid JSON matching the schema exactly. Extract as many primitives as possible from the document.

For each primitive, identify:
1. **Actors**: People, organizations, or groups mentioned. Include their role and type (individual/group/organization/state).
2. **Claims**: Positions, demands, assertions, or accusations made by any actor.
3. **Interests**: Underlying needs — substantive, procedural, psychological, or relational. Rate priority as critical/important/desirable.
4. **Constraints**: Legal, financial, temporal, organizational, cultural, or emotional limitations. Rate rigidity as hard/soft/negotiable.
5. **Events**: Triggers, escalations, de-escalations, turning points, deadlines, milestones. Rate impact as high/medium/low.
6. **Narratives**: How actors frame the conflict — origin stories, grievances, justifications, aspirations. Identify framing as victim/hero/villain/mediator/neutral.
7. **Key Dates**: Any dates mentioned with their significance.
8. **Monetary Amounts**: Any financial figures with their context.
9. **Quoted Statements**: Direct quotes with speaker attribution and context.

Also classify the document type (contract/email/complaint/report/other), extract metadata (date, author, recipients), and provide a 2-3 sentence summary.`;

// ── Response Schema for Gemini ──

const EXTRACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    metadata: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: "Document type: contract|email|complaint|report|other" },
        date: { type: Type.STRING, description: "Document date if found" },
        author: { type: Type.STRING, description: "Document author if identifiable" },
        recipients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Recipients if applicable" },
      },
    },
    summary: { type: Type.STRING, description: "2-3 sentence summary of the document's relevance to the conflict" },
    actors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          role: { type: Type.STRING },
          type: { type: Type.STRING, description: "individual|group|organization|state" },
        },
      },
    },
    claims: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING },
          type: { type: Type.STRING, description: "position|demand|assertion|accusation" },
          actorName: { type: Type.STRING },
        },
      },
    },
    interests: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING },
          type: { type: Type.STRING, description: "substantive|procedural|psychological|relational" },
          priority: { type: Type.STRING, description: "critical|important|desirable" },
          actorName: { type: Type.STRING },
        },
      },
    },
    constraints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING },
          type: { type: Type.STRING, description: "legal|financial|temporal|organizational|cultural|emotional" },
          rigidity: { type: Type.STRING, description: "hard|soft|negotiable" },
          actorName: { type: Type.STRING },
        },
      },
    },
    events: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING },
          type: { type: Type.STRING, description: "trigger|escalation|de-escalation|turning-point|deadline|milestone" },
          timestamp: { type: Type.STRING },
          impact: { type: Type.STRING, description: "high|medium|low" },
        },
      },
    },
    narratives: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING },
          type: { type: Type.STRING, description: "origin-story|grievance|justification|aspiration|identity-claim|counter-narrative" },
          framing: { type: Type.STRING, description: "victim|hero|villain|mediator|neutral" },
          actorName: { type: Type.STRING },
        },
      },
    },
    keyDates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          description: { type: Type.STRING },
        },
      },
    },
    monetaryAmounts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.STRING },
          context: { type: Type.STRING },
        },
      },
    },
    quotedStatements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          quote: { type: Type.STRING },
          speaker: { type: Type.STRING },
          context: { type: Type.STRING },
        },
      },
    },
  },
};

// ── Synthesis Prompt ──

const SYNTHESIS_PROMPT = `You are a conflict analysis expert for the CONCORDIA mediation platform by TACITUS.
You have been given extraction results from multiple documents related to a mediation case.
Synthesize the findings across all documents to identify:

1. **Contradictions**: Where different documents or parties present conflicting versions of events or facts.
2. **Timeline**: A chronological timeline of events across all documents.
3. **Missing Information**: What important information is NOT present in any document but would be needed for mediation.
4. **Power Asymmetries**: Evidence of power imbalances between parties (informational, economic, positional, etc.).

Return structured JSON matching the schema exactly.`;

const SYNTHESIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    contradictions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          partyAVersion: { type: Type.STRING },
          partyBVersion: { type: Type.STRING },
          source: { type: Type.STRING },
        },
      },
    },
    timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          event: { type: Type.STRING },
          source: { type: Type.STRING },
        },
      },
    },
    missingInformation: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    powerAsymmetries: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
};

// ── Pipeline Functions ──

/**
 * Process a single document through the extraction pipeline.
 * Supports PDF (via Gemini native PDF understanding) and text-based documents.
 */
export async function processDocumentPipeline(
  fileContent: string | ArrayBuffer,
  filename: string,
  mimeType: string,
): Promise<DocumentExtractionResult> {
  const ai = initPipelineAI();

  let contents: any[];

  if (mimeType === 'application/pdf') {
    // Use Gemini's native PDF understanding via inlineData
    const buffer = fileContent instanceof ArrayBuffer
      ? Buffer.from(fileContent)
      : Buffer.from(fileContent, 'utf-8');
    contents = [
      { inlineData: { mimeType: 'application/pdf', data: buffer.toString('base64') } },
      { text: EXTRACTION_PROMPT },
    ];
  } else {
    // Text-based document
    const text = typeof fileContent === 'string'
      ? fileContent
      : Buffer.from(fileContent).toString('utf-8');
    contents = [
      { text: `${EXTRACTION_PROMPT}\n\n---\nFILENAME: ${filename}\n\n${text.slice(0, 50000)}\n---` },
    ];
  }

  const response = await ai.models.generateContent({
    model: _pipelineModel,
    contents,
    config: {
      responseMimeType: 'application/json',
      responseSchema: EXTRACTION_SCHEMA as any,
    },
  });

  const rawText = response.text || '{}';
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    console.error('[DocumentPipeline] Failed to parse extraction response:', rawText.slice(0, 200));
    parsed = {};
  }

  return {
    metadata: {
      type: parsed.metadata?.type || 'other',
      date: parsed.metadata?.date,
      author: parsed.metadata?.author,
      recipients: parsed.metadata?.recipients || [],
      filename,
    },
    summary: parsed.summary || 'No summary extracted.',
    extractedPrimitives: {
      actors: parsed.actors || [],
      claims: parsed.claims || [],
      interests: parsed.interests || [],
      constraints: parsed.constraints || [],
      events: parsed.events || [],
      narratives: parsed.narratives || [],
      keyDates: parsed.keyDates || [],
      monetaryAmounts: parsed.monetaryAmounts || [],
      quotedStatements: parsed.quotedStatements || [],
    },
  };
}

/**
 * Synthesize findings across multiple document extractions.
 * Identifies contradictions, builds a unified timeline, and detects power asymmetries.
 */
export async function synthesizeDocuments(
  extractions: DocumentExtractionResult[],
): Promise<CrossDocumentSynthesis> {
  const ai = initPipelineAI();

  // Build a summary of all extractions for synthesis
  const extractionSummaries = extractions.map((ext, i) => {
    const p = ext.extractedPrimitives;
    return `
--- Document ${i + 1}: ${ext.metadata.filename} (${ext.metadata.type}) ---
Summary: ${ext.summary}
Actors: ${p.actors.map(a => `${a.name} (${a.role})`).join(', ') || 'None'}
Claims: ${p.claims.map(c => `[${c.actorName}] ${c.content}`).join('; ') || 'None'}
Interests: ${p.interests.map(i => `[${i.actorName}] ${i.content} (${i.priority})`).join('; ') || 'None'}
Constraints: ${p.constraints.map(c => `[${c.actorName}] ${c.content}`).join('; ') || 'None'}
Events: ${p.events.map(e => `${e.content} (${e.timestamp || 'no date'}, ${e.impact} impact)`).join('; ') || 'None'}
Narratives: ${p.narratives.map(n => `[${n.actorName}] ${n.content} (${n.framing})`).join('; ') || 'None'}
Key Dates: ${p.keyDates.map(d => `${d.date}: ${d.description}`).join('; ') || 'None'}
Monetary Amounts: ${p.monetaryAmounts.map(m => `${m.amount}: ${m.context}`).join('; ') || 'None'}
Quoted Statements: ${p.quotedStatements.map(q => `"${q.quote}" — ${q.speaker}`).join('; ') || 'None'}
`;
  }).join('\n');

  const response = await ai.models.generateContent({
    model: _pipelineModel,
    contents: `${SYNTHESIS_PROMPT}\n\n${extractionSummaries}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: SYNTHESIS_SCHEMA as any,
    },
  });

  const rawText = response.text || '{}';
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    console.error('[DocumentPipeline] Failed to parse synthesis response:', rawText.slice(0, 200));
    parsed = {};
  }

  return {
    contradictions: parsed.contradictions || [],
    timeline: parsed.timeline || [],
    missingInformation: parsed.missingInformation || [],
    powerAsymmetries: parsed.powerAsymmetries || [],
  };
}
