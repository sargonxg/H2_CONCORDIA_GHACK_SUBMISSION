import { GoogleGenAI, Type, Modality, Behavior } from "@google/genai";
import fs from "fs";
import path from "path";

// Write service account credentials to temp file for Google Auth
if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  const credPath = path.join("/tmp", "gcloud-credentials.json");
  fs.writeFileSync(credPath, process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
}

const useVertexAI = process.env.USE_VERTEX_AI !== "false";

const aiConfig: any = useVertexAI
  ? {
      vertexai: true,
      project:
        process.env.GOOGLE_CLOUD_PROJECT || "gcloud-hackathon-ybh0sdqtc9kco",
      location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
    }
  : {
      apiKey: process.env.GEMINI_API_KEY,
    };

const ai = new GoogleGenAI(aiConfig);

// Model names — configurable via env vars
// NOTE: gemini-2.0-flash-live-001 was shut down Dec 2025.
// gemini-live-2.5-flash-native-audio is the current GA Live API model.
const MODEL_LIVE =
  process.env.MODEL_LIVE ||
  (useVertexAI
    ? "gemini-live-2.5-flash-native-audio"
    : "gemini-2.5-flash-native-audio-preview-12-2025");
const MODEL_TEXT = process.env.MODEL_TEXT || "gemini-2.0-flash";
const MODEL_TTS =
  process.env.MODEL_TTS || "gemini-2.5-flash-preview-tts";
const MODEL_TRANSCRIBE =
  process.env.MODEL_TRANSCRIBE || "gemini-2.0-flash";

// ── Tool declaration for live mediation state updates ──

const updateMediationStateDeclaration: any = {
  name: "updateMediationState",
  description:
    "Update the UI state of the mediation process based on the conversation progress. Call this BEFORE every response to keep the UI synchronized with your reasoning.",
  // NON_BLOCKING prevents the 1008 error by allowing audio to continue during tool calls.
  // Note: Behavior enum is not supported in Vertex AI, only Gemini Developer API.
  ...(useVertexAI ? {} : { behavior: Behavior.NON_BLOCKING }),
  parameters: {
    type: Type.OBJECT,
    properties: {
      phase: {
        type: Type.STRING,
        description:
          "Current phase: 'Opening', 'Discovery', 'Exploration', 'Negotiation', 'Resolution', 'Agreement'",
      },
      targetActor: {
        type: Type.STRING,
        description:
          "The name of the party who should speak next, or 'Both' for joint address",
      },
      currentAction: {
        type: Type.STRING,
        description:
          "A short sentence explaining your mediator reasoning",
      },
      missingItems: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "List of facts, perspectives, or emotional dimensions still missing from the case",
      },
      structuredItems: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            summary: { type: Type.STRING },
            actor: { type: Type.STRING },
          },
        },
        description: "Established facts, agreements, or key revelations",
      },
      partyProfiles: {
        type: Type.OBJECT,
        properties: {
          partyA: {
            type: Type.OBJECT,
            properties: {
              emotionalState: { type: Type.STRING },
              engagementLevel: { type: Type.STRING },
              communicationStyle: { type: Type.STRING },
              cooperativeness: { type: Type.NUMBER },
              defensiveness: { type: Type.NUMBER },
              keyNeeds: { type: Type.ARRAY, items: { type: Type.STRING } },
              riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
          partyB: {
            type: Type.OBJECT,
            properties: {
              emotionalState: { type: Type.STRING },
              engagementLevel: { type: Type.STRING },
              communicationStyle: { type: Type.STRING },
              cooperativeness: { type: Type.NUMBER },
              defensiveness: { type: Type.NUMBER },
              keyNeeds: { type: Type.ARRAY, items: { type: Type.STRING } },
              riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
        description: "Psychological profiles for both parties",
      },
      commonGround: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Areas of agreement or shared interests identified so far",
      },
      tensionPoints: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Active points of disagreement or high-emotion topics",
      },
    },
    required: [
      "phase",
      "targetActor",
      "currentAction",
      "missingItems",
      "structuredItems",
      "partyProfiles",
      "commonGround",
      "tensionPoints",
    ],
  },
};

// ── Live Audio Session ──

function buildSystemInstruction(
  mediatorProfile: any,
  partyNames: { partyA: string; partyB: string },
  context: string,
) {
  return `You are CONCORDIA, an elite AI Mediator created by the TACITUS Institute for Conflict Resolution. You are facilitating a live mediation session between two parties: "${partyNames.partyA}" and "${partyNames.partyB}".

Your mediation approach is: ${mediatorProfile.approach}.

Current Case Context:
${context}

CORE PROTOCOL:

PHASE PROGRESSION:
1. OPENING - Welcome both parties. Explain ground rules: mutual respect, one person speaks at a time, confidentiality. Ask each party to briefly introduce themselves and state what brought them here.

2. DISCOVERY - Address each party ONE AT A TIME. Ask a single, open-ended question. Listen deeply. Probe for:
   - What happened (their narrative)
   - How it made them feel (emotional dimension)
   - What they need going forward (underlying interests)
   - What they have already tried (history of attempts)

3. EXPLORATION - Cross-reference what both parties have said. Identify shared facts vs. disputed facts, overlapping interests, emotional triggers, and power dynamics. Ask clarifying questions.

4. NEGOTIATION - Guide parties to generate options. Ask "What would it look like if...?" questions. Help them brainstorm without committing.

5. RESOLUTION - Narrow down to viable pathways. Test agreements: "If X happened, would that address your concern about Y?"

6. AGREEMENT - Summarize what has been agreed. Confirm with both parties. Outline next steps.

CRITICAL BEHAVIORAL RULES:
- ALWAYS call 'updateMediationState' BEFORE you speak.
- NEVER ask more than ONE question at a time. Wait for a response.
- ALWAYS name who you are addressing: "${partyNames.partyA}, ..." or "${partyNames.partyB}, ..."
- When a party shows strong emotion, VALIDATE it before moving on.
- Track psychological indicators and update partyProfiles accordingly.
- When you detect escalation, immediately de-escalate.
- Identify COMMON GROUND proactively and name it explicitly.
- Track TENSION POINTS and approach them strategically.
- Your voice should be calm, measured, empathetic, and authoritative.
- Keep your responses concise (2-4 sentences per turn).`;
}

export const createLiveSession = (
  callbacks: any,
  context: string = "",
  mediatorProfile: any = { voice: "Zephyr", approach: "Facilitative" },
  partyNames: { partyA: string; partyB: string } = {
    partyA: "Party A",
    partyB: "Party B",
  },
  resumptionHandle?: string,
) => {
  console.log(
    `[Live] Connecting to ${MODEL_LIVE}` +
      (resumptionHandle ? " (resuming session)" : " (new session)"),
  );

  const config: any = {
    responseModalities: [Modality.AUDIO],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: mediatorProfile.voice },
      },
    },
    tools: [{ functionDeclarations: [updateMediationStateDeclaration] }],
    systemInstruction: buildSystemInstruction(
      mediatorProfile,
      partyNames,
      context,
    ),
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    // Enable context window compression for sessions longer than 15 min
    contextWindowCompression: {
      slidingWindow: {},
    },
  };

  // Only include session resumption when we have a handle to resume
  if (resumptionHandle) {
    config.sessionResumption = { handle: resumptionHandle };
  }

  return ai.live.connect({
    model: MODEL_LIVE,
    callbacks,
    config,
  });
};

// ── Transcription ──

export const transcribeAudio = async (
  base64Audio: string,
  mimeType: string,
) => {
  const response = await ai.models.generateContent({
    model: MODEL_TRANSCRIBE,
    contents: [
      {
        parts: [
          { inlineData: { data: base64Audio, mimeType } },
          { text: "Transcribe this audio accurately." },
        ],
      },
    ],
  });
  return response.text;
};

// ── Text-to-Speech ──

export const generateSpeech = async (
  text: string,
  voiceName: string = "Kore",
) => {
  const response = await ai.models.generateContent({
    model: MODEL_TTS,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

// ── Advisor Chat ──

export const chatWithAdvisor = async (
  message: string,
  history: { role: string; parts: { text: string }[] }[],
) => {
  const chat = ai.chats.create({
    model: MODEL_TEXT,
    config: {
      systemInstruction: `You are the Strategic Advisor Agent for CONCORDIA, the TACITUS Institute's AI mediation platform.

Your role is to provide deep analytical support for conflict resolution. You synthesize conflict primitives (Claims, Interests, Constraints, Leverage, Commitments, Events) into:

1. Analytical Briefings — Break down the conflict structure, identify power dynamics, highlight hidden interests
2. Tactical Recommendations — Suggest specific questions, reframing strategies, de-escalation techniques
3. Resolution Pathways — Propose concrete solution options with trade-off analysis
4. Psychological Insights — Identify emotional patterns, communication styles, and underlying needs
5. Risk Assessment — Flag potential escalation triggers, power imbalances, and process risks

Draw upon established frameworks:
- Principled Negotiation (Fisher & Ury) — Focus on interests, not positions
- Transformative Mediation — Empowerment and recognition
- Narrative Mediation — Deconstructing conflict stories
- TACITUS Ontology — Reification, temporal graphs, traces of conflict

Be direct, specific, and actionable. Avoid generic advice.`,
    },
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};

// ── Pathway Analysis ──

export const analyzePathways = async (
  transcript: string,
  caseStructure: string,
) => {
  const response = await ai.models.generateContent({
    model: MODEL_TEXT,
    contents: `You are the Resolution Architect for the CONCORDIA mediation platform.

Analyze the following mediation transcript and case structure. Produce a detailed resolution analysis:

1. Common Ground — Identify shared interests, acknowledged facts, agreements, shared values, and mutual concerns.
2. Critical Questions — Generate targeted questions to reveal hidden interests, test flexibility, help parties see each other's perspective, and move from blame to problem-solving.
3. Resolution Pathways — Propose concrete, actionable pathways with trade-offs and implementation steps.
4. Psychological Dynamics — Assess the emotional landscape: power balance, emotional readiness, communication patterns.

Transcript:
${transcript}

Case Structure:
${caseStructure}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          commonGround: { type: Type.ARRAY, items: { type: Type.STRING } },
          criticalQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          pathways: { type: Type.ARRAY, items: { type: Type.STRING } },
          psychologicalDynamics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      },
    },
  });
  return response.text;
};

// ── Primitive Extraction ──

export const extractPrimitives = async (text: string) => {
  const response = await ai.models.generateContent({
    model: MODEL_TEXT,
    contents: `You are the Extraction Agent for the CONCORDIA mediation platform, using the TACITUS conflict ontology.

Extract structured conflict primitives from the following mediation transcript. For each party involved, identify:

- Claims — What each party states as fact or asserts as their position
- Interests — The underlying needs, desires, fears, or motivations behind their claims
- Constraints — Limitations, boundaries, or non-negotiables each party has
- Leverage — Sources of power, influence, or advantage each party holds
- Commitments — Promises, obligations, or agreements already made
- Events — Key incidents, timeline markers, or turning points referenced

Also identify the actors with their names and roles/stances.

Text:
${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          actors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
              },
            },
          },
          primitives: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  description:
                    "Must be exactly 'Claim', 'Interest', 'Constraint', 'Leverage', 'Commitment', or 'Event'",
                },
                actorName: { type: Type.STRING },
                description: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
  });
  return response.text;
};

// ── Research Grounding ──

export const researchGrounding = async (query: string) => {
  const response = await ai.models.generateContent({
    model: MODEL_TEXT,
    contents: `Research the following conflict context or entities to provide grounding facts, legal precedents, or relevant background information that could inform the mediation: ${query}`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return {
    text: response.text,
    chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
  };
};
