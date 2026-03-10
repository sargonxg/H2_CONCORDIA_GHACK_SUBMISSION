import { GoogleGenAI, Type, Modality, Behavior } from "@google/genai";
import fs from "fs";
import path from "path";
import os from "os";

// ══════════════════════════════════════════════════════════════════════════════
// LAZY INITIALIZATION
//
// Problem: lib/ai-service.ts is imported at the top of server.ts, which means
// its module-level code runs BEFORE Next.js calls app.prepare() and loads
// .env.local into process.env. If we create GoogleGenAI() at module load time,
// USE_VERTEX_AI, GEMINI_API_KEY etc. are all undefined, so it always defaults
// to Vertex AI mode — causing "Could not load the default credentials" errors.
//
// Solution: defer all environment reading and client construction until the
// first actual API call. By then, Next.js has populated process.env correctly.
// ══════════════════════════════════════════════════════════════════════════════

let _ai: GoogleGenAI | null = null;
let _useVertexAI = false;
let _MODEL_LIVE = "";
let _MODEL_TEXT = "";
let _MODEL_TTS = "";
let _MODEL_TRANSCRIBE = "";

function initAI(): GoogleGenAI {
  if (_ai) return _ai;

  // Write service account credentials if provided
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (saJson && saJson.trim() !== "" && !saJson.includes("{...}")) {
    try {
      const credPath = path.join(os.tmpdir(), "gcloud-credentials.json");
      fs.writeFileSync(credPath, saJson);
      process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
    } catch (err) {
      console.warn("[AI] Could not write service account credentials:", err);
    }
  }

  _useVertexAI = process.env.USE_VERTEX_AI !== "false";

  const aiConfig: any = _useVertexAI
    ? {
        vertexai: true,
        project:
          process.env.GOOGLE_CLOUD_PROJECT || "gcloud-hackathon-ybh0sdqtc9kco",
        location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
      }
    : {
        apiKey: process.env.GEMINI_API_KEY,
      };

  _ai = new GoogleGenAI(aiConfig);

  // Model names — configurable via env vars.
  // gemini-2.5-flash is the current stable GA model available to all users.
  // gemini-2.0-flash has been deprecated for new API key users.
  _MODEL_LIVE =
    process.env.MODEL_LIVE ||
    (_useVertexAI
      ? "gemini-live-2.5-flash-native-audio"
      : "gemini-2.5-flash-native-audio-preview-12-2025");
  _MODEL_TEXT = process.env.MODEL_TEXT || "gemini-2.5-flash";
  _MODEL_TTS = process.env.MODEL_TTS || "gemini-2.5-flash-preview-tts";
  _MODEL_TRANSCRIBE = process.env.MODEL_TRANSCRIBE || "gemini-2.5-flash";

  // Startup diagnostics — printed once on first use
  const authMode = _useVertexAI ? "Vertex AI" : "Gemini API Key";
  const keyHint =
    !_useVertexAI && process.env.GEMINI_API_KEY
      ? `...${process.env.GEMINI_API_KEY.slice(-4)}`
      : process.env.GOOGLE_CLOUD_PROJECT || "n/a";
  console.log(`[AI] Auth mode: ${authMode} (${keyHint})`);
  console.log(
    `[AI] Models: live=${_MODEL_LIVE}  text=${_MODEL_TEXT}  tts=${_MODEL_TTS}`,
  );

  return _ai;
}

// ── Shared party profile schema (reused for partyA and partyB) ──
const partyProfileSchema = {
  type: Type.OBJECT,
  properties: {
    emotionalState: { type: Type.STRING },
    engagementLevel: { type: Type.STRING },
    communicationStyle: { type: Type.STRING },
    cooperativeness: { type: Type.NUMBER },
    defensiveness: { type: Type.NUMBER },
    keyNeeds: { type: Type.ARRAY, items: { type: Type.STRING } },
    riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
    conflictStyle: {
      type: Type.STRING,
      description:
        "Thomas-Kilmann: Competing|Collaborating|Compromising|Avoiding|Accommodating",
    },
    emotionalIntensity: {
      type: Type.NUMBER,
      description: "Plutchik intensity 1-10",
    },
    emotionalTrajectory: {
      type: Type.STRING,
      description: "escalating|stable|de-escalating",
    },
    trustTowardOther: {
      type: Type.OBJECT,
      description: "Mayer/Davis/Schoorman trust 0-100 each",
      properties: {
        ability: { type: Type.NUMBER },
        benevolence: { type: Type.NUMBER },
        integrity: { type: Type.NUMBER },
      },
    },
    riskAssessment: {
      type: Type.OBJECT,
      description: "Risk scores 0-100 each",
      properties: {
        escalation: { type: Type.NUMBER },
        withdrawal: { type: Type.NUMBER },
        badFaith: { type: Type.NUMBER },
        impasse: { type: Type.NUMBER },
      },
    },
  },
};

// Tool declarations are built lazily inside createLiveSession so they can
// read _useVertexAI (which is only known after initAI() runs).
function buildToolDeclarations(): any[] {
  const nonBlocking = !_useVertexAI ? { behavior: Behavior.NON_BLOCKING } : {};

  const updateMediationState: any = {
    name: "updateMediationState",
    description:
      "Update the UI state of the mediation process based on the conversation progress. Call this BEFORE every response to keep the UI synchronized with your reasoning.",
    ...nonBlocking,
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
            "Brief mediator reasoning — include which framework you're drawing on (e.g. '[Fisher & Ury] Reframing positions as interests...')",
        },
        missingItems: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Facts, perspectives, or emotional dimensions still missing",
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
            partyA: partyProfileSchema,
            partyB: partyProfileSchema,
          },
          description: "Deep psychological profiles for both parties",
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
        narratives: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              actorName: { type: Type.STRING },
              content: { type: Type.STRING },
              type: {
                type: Type.STRING,
                description:
                  "origin-story|grievance|justification|aspiration|identity-claim|counter-narrative",
              },
              framing: {
                type: Type.STRING,
                description: "victim|hero|villain|mediator|neutral",
              },
              emotionalTone: { type: Type.STRING },
            },
          },
          description: "Narrative frames each party uses to construct meaning",
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

  const requestMissingInformation: any = {
    name: "requestMissingInformation",
    description:
      "Call when you detect ontology gaps — missing primitive types, party imbalances, or structural issues. Notifies the mediator UI so the human mediator can follow up.",
    ...nonBlocking,
    parameters: {
      type: Type.OBJECT,
      properties: {
        gapType: {
          type: Type.STRING,
          description: "primitive_missing|imbalance|structural|emotional",
        },
        description: {
          type: Type.STRING,
          description: "What gap was detected",
        },
        suggestedQuestion: {
          type: Type.STRING,
          description: "The exact question to ask to fill this gap",
        },
        priority: {
          type: Type.STRING,
          description: "critical|important|minor",
        },
        targetParty: {
          type: Type.STRING,
          description: "Which party to ask, or 'Both'",
        },
      },
      required: [
        "gapType",
        "description",
        "suggestedQuestion",
        "priority",
        "targetParty",
      ],
    },
  };

  return [updateMediationState, requestMissingInformation];
}

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

═══════════════════════════════════════════
CORE PROTOCOL — PHASE PROGRESSION
═══════════════════════════════════════════

1. OPENING — Welcome both parties. Explain ground rules: mutual respect, one person speaks at a time, confidentiality. Ask each party to briefly introduce themselves and state what brought them here.

2. DISCOVERY — Address each party ONE AT A TIME. Ask a single, open-ended question. Listen deeply. Probe for:
   - What happened (their narrative)
   - How it made them feel (emotional dimension)
   - What they need going forward (underlying interests)
   - What they have already tried (history of attempts)

3. EXPLORATION — Cross-reference both narratives. Identify shared facts vs. disputed facts, overlapping interests, emotional triggers, and power dynamics.

4. NEGOTIATION — Guide parties to generate options. Ask "What would it look like if...?" Help them brainstorm without committing.

5. RESOLUTION — Narrow down to viable pathways. Test agreements: "If X happened, would that address your concern about Y?"

6. AGREEMENT — Summarize what has been agreed. Confirm with both parties. Outline next steps.

═══════════════════════════════════════════
PSYCHOLOGICAL PROFILING (update partyProfiles every turn)
═══════════════════════════════════════════

CONFLICT STYLES (Thomas-Kilmann) — Assess each party:
  - Competing: high assertiveness, low cooperation — wants to win
  - Collaborating: high assertiveness, high cooperation — seeks mutual gain
  - Compromising: moderate on both — seeks middle ground
  - Avoiding: low assertiveness, low cooperation — withdraws from conflict
  - Accommodating: low assertiveness, high cooperation — yields to other

EMOTIONAL PROFILING (Plutchik Wheel):
  - Assess primary emotion (joy, trust, fear, surprise, sadness, disgust, anger, anticipation)
  - Intensity 1-10 (1=mild, 10=overwhelming)
  - Trajectory: escalating / stable / de-escalating
  - Update emotionalState, emotionalIntensity, emotionalTrajectory in partyProfiles

TRUST ASSESSMENT (Mayer/Davis/Schoorman Model) — each 0-100:
  - ability: do they believe the other party is competent to fulfill commitments?
  - benevolence: do they believe the other party wants good outcomes for them?
  - integrity: do they believe the other party will honor agreements?
  - Update trustTowardOther in partyProfiles

RISK ASSESSMENT — each 0-100:
  - escalation: probability of conflict intensifying
  - withdrawal: probability of a party leaving the process
  - badFaith: indicators of manipulation or hidden agenda
  - impasse: probability of reaching deadlock
  - Update riskAssessment in partyProfiles each turn

POWER DYNAMICS:
  - Track BATNA (Best Alternative to Negotiated Agreement) for each party
  - Identify ZOPA (Zone of Possible Agreement)
  - Note if power imbalance is affecting communication

═══════════════════════════════════════════
MEDIATION FRAMEWORKS (apply adaptively, note in currentAction)
═══════════════════════════════════════════

FISHER & URY (Principled Negotiation):
  - Separate people from the problem
  - Focus on INTERESTS, not positions — always ask "why do you want that?"
  - Invent options for mutual gain
  - Insist on objective criteria
  - Prefix: [Fisher & Ury]

LEDERACH (Conflict Transformation):
  - Attend to root causes, not just surface symptoms
  - Conflict as opportunity for constructive change
  - Relationship building is central
  - Prefix: [Lederach]

GLASL (9-Stage Escalation Model) — identify stage, apply intervention:
  Stage 1-3 (Win-Win possible): Joint problem-solving, structured dialogue
  Stage 4-6 (Win-Lose): Rehumanization, mediation, reality testing
  Stage 7-9 (Lose-Lose): Arbitration, power intervention, separation
  Prefix: [Glasl S1-9]

ZARTMAN (Ripeness Theory):
  - Is there a Mutually Hurting Stalemate? (both parties feel the pain)
  - Is there a Way Out? (both believe a negotiated solution exists)
  - If ripe: move to resolution. If not ripe: create ripeness conditions.
  Prefix: [Zartman]

BUSH & FOLGER (Transformative Mediation):
  - Empowerment: help each party make their own choices
  - Recognition: help each party recognize the other's perspective
  Prefix: [Bush & Folger]

WINSLADE & MONK (Narrative Mediation):
  - Identify dominant conflict narrative
  - Externalize the problem ("the conflict" not "you")
  - Build alternative, more constructive story
  Prefix: [Narrative]

═══════════════════════════════════════════
ONTOLOGY GAP DETECTION (after every party utterance)
═══════════════════════════════════════════

After each party speaks, call 'requestMissingInformation' if:
- Any of the 8 TACITUS primitives (Actor/Claim/Interest/Constraint/Leverage/Commitment/Event/Narrative) has zero entries for a party
- >3:1 extraction imbalance between parties (one party has far more entries)
- Missing emotional data — suggest: "How are you feeling about what just happened?"
- Missing Narratives — suggest: "Tell me the story of how this started from your perspective."
- Missing Constraints — suggest: "Are there any legal, financial, or practical limits I should understand?"
- Missing Leverage — suggest: "What options do you have if we can't reach an agreement today?"
- No common ground identified after Discovery phase — flag as structural gap

═══════════════════════════════════════════
ESCALATION PROTOCOL (highest priority)
═══════════════════════════════════════════

Monitor CONTINUOUSLY for escalation signals:
  - BLAME language: "you always", "you never", "it's your fault", "you caused this"
  - CONTEMPT: dismissiveness, eye-rolling described, "that's ridiculous", insults
  - THREATS: "I'll take this to court", "you'll regret this", ultimatums
  - STONEWALLING: "this is pointless", "I'm done talking", refusing to engage
  - GOTTMAN'S FOUR HORSEMEN: criticism, contempt, defensiveness, stonewalling

When escalation is detected, IMMEDIATELY de-escalate before anything else:
  Level 1 (escalation 30-50): Reflect + validate: "I can hear how frustrated you are. That makes sense."
  Level 2 (escalation 51-70): Name the dynamic: "I'm noticing the conversation is becoming quite heated. Let's slow down."
  Level 3 (escalation 71-85): Circuit break: "I'd like to pause for a moment. Let's take a breath and refocus on what we're here to achieve."
  Level 4 (escalation 86-100): Crisis protocol: "I think it would be helpful to speak with each of you separately for a few minutes."

AFTER any escalation event: update riskAssessment.escalation in partyProfiles.

═══════════════════════════════════════════
TACITUS CONFLICT GRAMMAR — BUILD AS YOU LISTEN
═══════════════════════════════════════════

You are building a TACITUS Conflict Grammar graph as you listen. Every time a party reveals new information, extract it as a primitive (Claim, Interest, Constraint, Leverage, Commitment, Event, or Narrative) and update the case structure via updateMediationState.

Ask TARGETED QUESTIONS to fill gaps in the ontology:
- If you have Claims but no Interests → ask: "What's really important to you here, beyond the specific demand?"
- If you have no Constraints → ask: "Are there any boundaries or limitations — legal, financial, or personal — I should know about?"
- If you have no Leverage → ask: "What options do you have if we can't reach an agreement today?"
- If you have no Narratives → ask: "Tell me the story of how this started from your perspective."
- If you have no Events/timeline → ask: "What was the moment when things first started to break down?"

COMMON GROUND — name it explicitly when you find it:
When you identify shared interests, values, or facts, name them aloud: "I notice you both value X. Let me note that as shared ground we can build on." Then add it to commonGround in updateMediationState.

ZONE OF POSSIBLE AGREEMENT (ZOPA):
Keep a running mental model of each party's flexibility range. When both parties' ranges overlap, name the ZOPA explicitly: "Based on what I'm hearing, there may be a zone of agreement around [X]. Let me explore that with both of you."

═══════════════════════════════════════════
CRITICAL BEHAVIORAL RULES
═══════════════════════════════════════════
- ALWAYS call 'updateMediationState' BEFORE you speak.
- NEVER ask more than ONE question at a time. Wait for a response.
- ALWAYS name who you are addressing: "${partyNames.partyA}, ..." or "${partyNames.partyB}, ..."
- When a party shows strong emotion, VALIDATE before moving on.
- In currentAction, use bracket notation for the framework: e.g. "[Fisher & Ury] Reframing...", "[Glasl Stage 3] Naming dynamic...", "[Narrative] Externalizing problem..."
- Your voice should be calm, measured, empathetic, and authoritative.
- Keep responses concise (2-4 sentences per turn).`;
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
  const ai = initAI();

  console.log(
    `[Live] Connecting to ${_MODEL_LIVE}` +
      (resumptionHandle ? " (resuming session)" : " (new session)"),
  );

  const config: any = {
    responseModalities: [Modality.AUDIO],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: mediatorProfile.voice },
      },
    },
    tools: [{ functionDeclarations: buildToolDeclarations() }],
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
    model: _MODEL_LIVE,
    callbacks,
    config,
  });
};

// ── Transcription ──

export const transcribeAudio = async (
  base64Audio: string,
  mimeType: string,
) => {
  const ai = initAI();
  const response = await ai.models.generateContent({
    model: _MODEL_TRANSCRIBE,
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
  const ai = initAI();
  const response = await ai.models.generateContent({
    model: _MODEL_TTS,
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
  caseContext?: string,
) => {
  const ai = initAI();
  const caseSection = caseContext
    ? `\n\nACTIVE CASE CONTEXT:\n${caseContext}\n\nUse this case structure and transcript when answering questions. Reference specific parties, primitives, and facts from the case.`
    : "";

  const chat = ai.chats.create({
    model: _MODEL_TEXT,
    history,
    config: {
      systemInstruction: `You are the Strategic Advisor Agent for CONCORDIA, the TACITUS Institute's AI mediation platform.

Your role is to provide deep analytical support for conflict resolution. You synthesize conflict primitives (Claims, Interests, Constraints, Leverage, Commitments, Events, Narratives) into:

1. Analytical Briefings — Break down the conflict structure, identify power dynamics, highlight hidden interests
2. Tactical Recommendations — Suggest specific questions, reframing strategies, de-escalation techniques
3. Resolution Pathways — Propose concrete solution options with trade-off analysis
4. Psychological Insights — Identify emotional patterns, communication styles (Thomas-Kilmann), trust levels, and underlying needs
5. Risk Assessment — Flag escalation triggers, power imbalances, and process risks using the CONCORDIA risk model

Draw upon established frameworks:
- Principled Negotiation (Fisher & Ury) — Focus on interests, not positions
- Lederach Conflict Transformation — Root causes, relationship, constructive change
- Glasl 9-Stage Escalation — Identify stage and apply stage-appropriate intervention
- Zartman Ripeness Theory — Mutually hurting stalemate + way out
- Transformative Mediation (Bush & Folger) — Empowerment and recognition
- Narrative Mediation (Winslade & Monk) — Dominant narratives, externalization
- TACITUS 8-Primitive Ontology — Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative

Be direct, specific, and actionable. Reference the case facts when available. Avoid generic advice.${caseSection}`,
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
  const ai = initAI();
  const response = await ai.models.generateContent({
    model: _MODEL_TEXT,
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
  const ai = initAI();
  const response = await ai.models.generateContent({
    model: _MODEL_TEXT,
    contents: `You are the Extraction Agent for the CONCORDIA mediation platform, using the full TACITUS conflict ontology (8 primitives).

Extract ALL conflict primitives from the following mediation transcript. Apply the complete TACITUS grammar:

ACTORS — Named parties and stakeholders:
  - type: individual|group|organization|state
  - stance: their declared position
  - powerLevel: 1 (low) to 5 (high)

CLAIMS — What parties assert as fact or demand:
  - type: position|demand|assertion|accusation
  - status: active|withdrawn|acknowledged|disputed
  - confidence: 0.0–1.0 (how certain they seem)

INTERESTS — The underlying needs behind claims (dig deeper):
  - type: substantive (tangible resources)|procedural (process fairness)|psychological (respect, identity)|relational (relationship quality)
  - priority: critical|important|desirable
  - visibility: stated (explicit)|implicit (inferable)|hidden (buried)

CONSTRAINTS — Limits on what is possible:
  - type: legal|financial|temporal|organizational|cultural|emotional
  - rigidity: hard (non-negotiable)|soft (flexible)|negotiable

LEVERAGE — Sources of power and influence:
  - type: coercive|reward|legitimate|expert|referent|informational
  - strength: 1 (weak) to 5 (dominant)

COMMITMENTS — Promises, agreements, threats already made:
  - type: promise|agreement|concession|threat|ultimatum
  - status: proposed|accepted|rejected|conditional|fulfilled|broken
  - bindingness: moral|legal|social

EVENTS — Key incidents, turning points, deadlines:
  - type: trigger|escalation|de-escalation|turning-point|deadline|milestone
  - impact: high|medium|low

NARRATIVES — How parties frame and make meaning of the conflict:
  - type: origin-story|grievance|justification|aspiration|identity-claim|counter-narrative
  - framing: victim|hero|villain|mediator|neutral
  - emotionalTone: describe the emotional quality (e.g., "bitter resentment", "cautious hope")

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
                type: { type: Type.STRING },
                stance: { type: Type.STRING },
                powerLevel: { type: Type.NUMBER },
              },
            },
          },
          primitives: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                primitiveType: {
                  type: Type.STRING,
                  description:
                    "Must be exactly one of: 'Claim', 'Interest', 'Constraint', 'Leverage', 'Commitment', 'Event', 'Narrative'",
                },
                actorName: { type: Type.STRING },
                description: { type: Type.STRING },
                subType: {
                  type: Type.STRING,
                  description: "The specific sub-type for this primitive",
                },
                // Claim fields
                status: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                // Interest fields
                priority: { type: Type.STRING },
                visibility: { type: Type.STRING },
                // Constraint fields
                rigidity: { type: Type.STRING },
                // Leverage / Actor fields
                strength: { type: Type.NUMBER },
                powerLevel: { type: Type.NUMBER },
                // Commitment fields
                bindingness: { type: Type.STRING },
                // Event fields
                impact: { type: Type.STRING },
                timestamp: { type: Type.STRING },
                // Narrative fields
                framing: { type: Type.STRING },
                emotionalTone: { type: Type.STRING },
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
  const ai = initAI();
  const response = await ai.models.generateContent({
    model: _MODEL_TEXT,
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
