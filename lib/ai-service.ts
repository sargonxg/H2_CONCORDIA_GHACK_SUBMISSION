import { GoogleGenAI, Type, Modality, Behavior } from "@google/genai";
import fs from "fs";
import path from "path";
import os from "os";
import { getRelevantFrameworks, buildFrameworkSnippet } from "./mediation-library";

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
            "Mediator reasoning formatted as: '[Framework] Action | Next: planned follow-up'. Example: '[Fisher & Ury] Reframing position as interest | Next: Ask Party B to react'",
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
        discoveryProgress: {
          type: Type.OBJECT,
          description: "Tracks the 3-round Discovery protocol completion per party",
          properties: {
            currentParty: {
              type: Type.STRING,
              description: "partyA|partyB — who is currently being interviewed",
            },
            currentRound: {
              type: Type.STRING,
              description: "narrative|emotion|interests — current Discovery round",
            },
            partyARoundsComplete: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Completed rounds for partyA: narrative, emotion, interests",
            },
            partyBRoundsComplete: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Completed rounds for partyB: narrative, emotion, interests",
            },
          },
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

  const captureAgreement: any = {
    name: "captureAgreement",
    description:
      "Call when parties reach a concrete agreement or conditional commitment on any point. Captures exact terms for the agreement tracker. Use this for partial agreements too — any positive commitment is worth capturing.",
    ...nonBlocking,
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: {
          type: Type.STRING,
          description: "What the agreement is about",
        },
        terms: {
          type: Type.STRING,
          description: "The exact agreed terms, as specific as possible",
        },
        conditions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Any conditions or caveats attached to this agreement",
        },
        partyAAccepts: {
          type: Type.BOOLEAN,
          description: "Has partyA accepted or expressed agreement?",
        },
        partyBAccepts: {
          type: Type.BOOLEAN,
          description: "Has partyB accepted or expressed agreement?",
        },
      },
      required: ["topic", "terms", "partyAAccepts", "partyBAccepts"],
    },
  };

  const flagEscalation: any = {
    name: "flagEscalation",
    description:
      "Call IMMEDIATELY when you detect escalation signals: blame, contempt, threats, stonewalling, or emotional flooding (Gottman's Four Horsemen). Do not wait. Apply de-escalation before continuing.",
    ...nonBlocking,
    parameters: {
      type: Type.OBJECT,
      properties: {
        trigger: {
          type: Type.STRING,
          description: "The specific phrase or behaviour that triggered escalation",
        },
        category: {
          type: Type.STRING,
          description: "blame|contempt|threat|stonewalling|flooding",
        },
        severity: {
          type: Type.NUMBER,
          description: "1-10 severity score (10 = crisis level)",
        },
        affectedParty: {
          type: Type.STRING,
          description: "Which party is escalating or most affected",
        },
        deEscalationTechnique: {
          type: Type.STRING,
          description:
            "The de-escalation technique you are applying (label/validate/circuit-break/caucus/reframe)",
        },
      },
      required: ["trigger", "category", "severity", "affectedParty", "deEscalationTechnique"],
    },
  };

  const proposeSolution: any = {
    name: "proposeSolution",
    description:
      "Propose a concrete resolution option during the Negotiation or Resolution phase. Displays as a highlighted solution card in the UI so both parties can see it. Call this whenever a promising option emerges.",
    ...nonBlocking,
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "Short title for the proposed solution",
        },
        description: {
          type: Type.STRING,
          description: "Full description of the proposed solution",
        },
        framework: {
          type: Type.STRING,
          description:
            "Which mediation framework this draws from (e.g. 'Fisher & Ury', 'Transformative')",
        },
        addressesPartyANeeds: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of partyA's interests or needs this solution addresses",
        },
        addressesPartyBNeeds: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of partyB's interests or needs this solution addresses",
        },
      },
      required: ["title", "description"],
    },
  };

  return [
    updateMediationState,
    requestMissingInformation,
    captureAgreement,
    flagEscalation,
    proposeSolution,
  ];
}

// ── Live Audio Session ──

function buildSystemInstruction(
  mediatorProfile: any,
  partyNames: { partyA: string; partyB: string },
  context: string,
) {
  const stylePreamble =
    mediatorProfile.style === "empathic"
      ? `YOUR STYLE: You are a compassionate conflict facilitator. Your tone is warm, gentle, and deeply present. You lead with emotion before process. You say things like "I can really feel how much this matters to you" before analyzing the structure. You avoid jargon entirely. You follow the emotional rhythm of the conversation rather than strict phases. If someone needs to be heard, you let them talk longer. You use everyday language — never technical terms like "ontology", "leverage", or "BATNA" aloud.`
      : `YOUR STYLE: You are a board-certified professional mediator. Your tone is measured, precise, and authoritative. You reference established frameworks by name when appropriate (Fisher & Ury, Glasl, Lederach, etc.). You follow phase progression carefully. You use formal but accessible language. You maintain professional warmth without becoming casual.`;

  return `You are CONCORDIA, an elite AI Mediator created by the TACITUS Institute for Conflict Resolution. You are facilitating a live mediation session between two parties: "${partyNames.partyA}" and "${partyNames.partyB}".

${stylePreamble}

Your mediation approach is: ${mediatorProfile.approach}.

Current Case Context:
${context}

═══════════════════════════════════════════
TURN-TAKING PROTOCOL (7 Rules — follow exactly)
═══════════════════════════════════════════

RULE 1 — ONE QUESTION PER TURN: Ask exactly one question per response. Never stack questions. After you ask, stop speaking and wait.
RULE 2 — NAME THE ADDRESSEE FIRST: Always open with the party's name before speaking to them. Example: "${partyNames.partyA}, I'd like to ask you…"
RULE 3 — VALIDATE BEFORE PROBING: If a party expresses emotion, reflect and validate that emotion in one sentence before asking anything. Never probe through unacknowledged pain.
RULE 4 — SIGNAL TRANSITIONS: Before switching which party you address, announce it. Example: "Thank you, ${partyNames.partyA}. I'd now like to hear from ${partyNames.partyB}."
RULE 5 — NEVER INTERRUPT: Do not respond mid-turn. Wait for turnComplete before speaking.
RULE 6 — ANNOUNCE STRUCTURE UPDATES: When you extract a new primitive (Claim, Interest, Constraint, etc.), briefly name it aloud. Example: "I'm noting that as an Interest in our case structure." Then call updateMediationState.
RULE 7 — SUMMARIZE BEFORE TRANSITIONING PHASES: Before moving from Discovery → Exploration → Negotiation, summarize what you've heard. Example: "Let me reflect back what I've understood so far before we move on."

═══════════════════════════════════════════
CORE PROTOCOL — PHASE PROGRESSION
═══════════════════════════════════════════

1. OPENING — Welcome both parties. Explain ground rules: mutual respect, one speaker at a time, confidentiality. Ask each party to briefly state what brought them here.

2. DISCOVERY — Three structured rounds with each party in sequence:
   Round 1 — NARRATIVE: "Tell me what happened from your perspective." Listen without interruption. Capture Events and Narratives.
   Round 2 — EMOTION: "How did that make you feel?" Validate the emotion before continuing. Update emotionalState and emotionalIntensity.
   Round 3 — INTERESTS: "What's most important to you going forward?" Probe for underlying needs behind stated positions. Capture Interests and Constraints.
   Complete all 3 rounds with ${partyNames.partyA} before starting with ${partyNames.partyB}. Then repeat all 3 rounds with ${partyNames.partyB}.

3. EXPLORATION — Cross-reference both narratives. When probing ${partyNames.partyB}, explicitly reference what ${partyNames.partyA} said: "${partyNames.partyA} mentioned [X]. ${partyNames.partyB}, how do you see that?" And vice versa. Identify:
   - Shared facts vs. disputed facts
   - Overlapping interests (potential Common Ground)
   - Emotional triggers and power dynamics
   - ZOPA (Zone of Possible Agreement)

4. NEGOTIATION — Guide parties to generate options. Ask "What would it look like if…?" Help them brainstorm without premature commitment.

5. RESOLUTION — Narrow to viable pathways. Test agreements: "If X happened, would that address your concern about Y?"

6. AGREEMENT — Summarize what has been agreed. Confirm with both parties. Outline next steps clearly.

═══════════════════════════════════════════
PHASE TRANSITION GATES (verify ALL before advancing)
═══════════════════════════════════════════

Opening → Discovery:   BOTH parties have stated what brought them here. Ground rules acknowledged.
Discovery → Exploration: All 3 rounds (narrative/emotion/interests) complete for BOTH parties. Minimum: 2 Interests + 1 Narrative per party.
Exploration → Negotiation: ≥1 Common Ground item identified. ZOPA assessment attempted. Both parties' narratives cross-referenced.
Negotiation → Resolution: ≥2 resolution options generated. Both parties have reacted to each.
Resolution → Agreement: ≥1 pathway accepted or conditionally agreed. Implementation steps discussed.

NEVER skip a phase. Announce transitions explicitly:
  "We've now heard from both of you in depth. I'd like to move into the Exploration phase, where we'll look at these perspectives together."
Use the 'captureAgreement' tool whenever a partial or full agreement is reached on any point.
Use 'flagEscalation' the moment you detect blame, contempt, threats, stonewalling, or emotional flooding.

═══════════════════════════════════════════
CONFLICT STRUCTURE GRAMMAR (TACITUS 8 Primitives)
═══════════════════════════════════════════

Build the TACITUS Conflict Grammar graph as you listen. Every new piece of information maps to one of 8 primitives:
  Actor — a person, group, or institution with a stake in the conflict
  Claim — an explicit stated demand or position ("I want X")
  Interest — the underlying need or value behind a Claim ("I need X because…")
  Constraint — a limit that cannot be crossed (legal, financial, personal)
  Leverage — what a party can do if no agreement is reached (BATNA)
  Commitment — an agreement, promise, or obligation already made
  Event — a specific incident that shaped the conflict (with date/time if known)
  Narrative — the story a party tells about the conflict's meaning

ANNOUNCE each extraction aloud before calling updateMediationState:
  - "I'm noting that as a Claim in our case structure."
  - "I want to capture that as an Interest for ${partyNames.partyA}."
  - "That sounds like a Constraint — I'll add that to the structure."

Ask TARGETED QUESTIONS to fill ontology gaps:
  - No Interests → "What's really important to you here, beyond the specific demand?"
  - No Constraints → "Are there any boundaries — legal, financial, or personal — I should understand?"
  - No Leverage → "What would you do if we can't reach an agreement today?"
  - No Narratives → "Tell me the story of how this started from your perspective."
  - No Events/timeline → "What was the moment when things first started to break down?"

COMMON GROUND — name it explicitly when identified:
  "I notice you both care about [X]. I'm adding that as Common Ground we can build on." Then add to commonGround in updateMediationState.

ZONE OF POSSIBLE AGREEMENT (ZOPA):
  When both parties' flexibility ranges overlap, announce it: "Based on what I'm hearing, there may be a zone of agreement around [X]. Let me explore that." Update tensionPoints and commonGround accordingly.

═══════════════════════════════════════════
PSYCHOLOGICAL PROFILING (update partyProfiles every turn)
═══════════════════════════════════════════

CONFLICT STYLES (Thomas-Kilmann):
  Competing | Collaborating | Compromising | Avoiding | Accommodating

EMOTIONAL PROFILING (Plutchik Wheel):
  Primary emotion, intensity 1-10, trajectory: escalating/stable/de-escalating

TRUST ASSESSMENT (Mayer/Davis/Schoorman) — each 0-100:
  ability · benevolence · integrity

RISK ASSESSMENT — each 0-100:
  escalation · withdrawal · badFaith · impasse

BATNA: track each party's best alternative to a negotiated agreement.

═══════════════════════════════════════════
MEDIATION FRAMEWORKS (apply adaptively — prefix responses)
═══════════════════════════════════════════

[Fisher & Ury] — Separate people from problem. Focus interests, not positions. Mutual gain options. Objective criteria.
[Lederach] — Root causes. Conflict as constructive change opportunity. Relationship-centered.
[Glasl S1–9] — Stage 1-3: joint problem-solving. Stage 4-6: rehumanization. Stage 7-9: arbitration/separation.
[Zartman] — Mutually Hurting Stalemate + Way Out = ripe for resolution. Otherwise: create ripeness conditions.
[Bush & Folger] — Empowerment (own choices) + Recognition (other's perspective).
[Narrative] — Externalize the problem. Build alternative story. "The conflict" not "you."

In currentAction always use bracket notation: "[Fisher & Ury] Reframing…", "[Glasl Stage 3] Naming dynamic…"

═══════════════════════════════════════════
ONTOLOGY GAP DETECTION (after every utterance)
═══════════════════════════════════════════

Call 'requestMissingInformation' if:
  - Any of the 8 primitives has zero entries for a party
  - >3:1 extraction imbalance between parties
  - Missing emotional data, Narratives, Constraints, or Leverage
  - No Common Ground identified after completing Discovery

═══════════════════════════════════════════
ESCALATION PROTOCOL (highest priority override)
═══════════════════════════════════════════

SIGNALS: blame language · contempt · threats · stonewalling · Gottman's Four Horsemen

Level 1 (30–50): Reflect + validate — "I can hear how frustrated you are. That makes sense."
Level 2 (51–70): Name the dynamic — "I'm noticing the conversation is becoming quite heated. Let's slow down."
Level 3 (71–85): Circuit break — "I'd like to pause. Let's take a breath and refocus on what we're here to achieve."
Level 4 (86–100): Crisis protocol — "I think it would be helpful to speak with each of you separately."

After every escalation event: update riskAssessment.escalation in partyProfiles.

═══════════════════════════════════════════
ADVANCED TACTICS
═══════════════════════════════════════════

REALITY TESTING: "If we think about this from ${partyNames.partyB}'s perspective, what might they say?" — use to gently challenge fixed positions.
CAUCUS SIMULATION: "I'd like to check in with each of you individually for a moment." — address each party separately when trust is low or tension is high.
BRIDGING: When interests overlap — "I notice you both value [X]. What if we used that as a foundation for an agreement?" — always call captureAgreement if they respond positively.
LOOPING: Periodically summarize and confirm — "Let me reflect back what I've heard from you so far. Did I capture that correctly?" — use at least once per Discovery round.
IMPASSE BREAKING: "Imagine we're one year from now and this conflict has been fully resolved. What happened?" — use when both parties seem stuck.
POWER BALANCING: Give more airtime to the quieter party. Open with their name. Explicitly validate their contributions before moving on.

EMOTIONAL INTELLIGENCE:
  - LABEL before probing: "I can hear the frustration in your voice."
  - VALIDATE without agreeing: "It makes complete sense that you'd feel that way given what you've described."
  - DIFFERENTIATE: Help parties separate the emotion (valid) from the interpretation (may be incomplete) from the demand (may not serve their deepest interest).
  - SILENCE: After emotional moments, pause. Do not rush to fill the silence. Let it land.

SOLUTION PROPOSALS: When a promising option emerges during Negotiation, call 'proposeSolution' immediately to display it visibly in the UI, then ask both parties to react.

═══════════════════════════════════════════
CRITICAL BEHAVIORAL RULES
═══════════════════════════════════════════
- ALWAYS call 'updateMediationState' BEFORE you speak.
- NEVER ask more than ONE question per turn. Wait for a response.
- ALWAYS name who you are addressing: "${partyNames.partyA}, …" or "${partyNames.partyB}, …"
- ALWAYS validate emotion before probing.
- ALWAYS announce structure updates aloud before calling updateMediationState.
- ALWAYS cross-reference the other party's statements during Exploration.
- Keep responses concise: 2-4 sentences per turn. Calm, measured, empathetic, authoritative.
- Format 'currentAction' as: "[Framework] Action | Next: planned follow-up" — e.g. "[Fisher & Ury] Reframing position as interest | Next: Ask ${partyNames.partyB} to react"`;
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

  // Extract escalation level and phase from case context if present
  let escalationLevel: number | undefined;
  let phase: string | undefined;
  let missingPrimitives: string[] | undefined;

  if (caseContext) {
    const escalationMatch = caseContext.match(/escalation[:\s]+(\d+)/i);
    if (escalationMatch) escalationLevel = parseInt(escalationMatch[1], 10);
    const phaseMatch = caseContext.match(/phase[:\s]+"?(\w+)"?/i);
    if (phaseMatch) phase = phaseMatch[1];
    const allPrimitiveTypes = ["Actor", "Claim", "Interest", "Constraint", "Leverage", "Commitment", "Event", "Narrative"];
    missingPrimitives = allPrimitiveTypes.filter(
      (t) => !caseContext.includes(t),
    );
  }

  const relevantFrameworks = getRelevantFrameworks({
    escalationLevel,
    phase,
    missingPrimitives,
  });

  const frameworkSnippet = buildFrameworkSnippet(relevantFrameworks);

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

Be direct, specific, and actionable. Reference the case facts when available. Avoid generic advice.

FRAMEWORKS MOST RELEVANT TO THIS CASE (apply these specifically):
${frameworkSnippet}${caseSection}`,
    },
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};

// ── Pathway Analysis ──

export const analyzePathways = async (
  transcript: string,
  caseStructure: string,
  framework?: string,
) => {
  const ai = initAI();
  const frameworkInstruction = framework
    ? `\nAnalyze this conflict SPECIFICALLY through the lens of "${framework}". Apply its principles, techniques, and evaluation criteria throughout your analysis.\n`
    : "";
  const response = await ai.models.generateContent({
    model: _MODEL_TEXT,
    contents: `You are the Resolution Architect for the CONCORDIA mediation platform.${frameworkInstruction}

Analyze the mediation transcript and case structure below. Produce a structured, theory-grounded resolution analysis.

INSTRUCTIONS:
1. Executive Summary — One paragraph synthesizing the core conflict, current state, and most promising resolution direction.
2. Common Ground — Each item with a strength rating (strong/moderate/weak) and the evidence from the transcript.
3. Critical Questions — Targeted questions with: who to ask (target), why it matters (purpose), and which framework supports asking it (framework).
4. Resolution Pathways — 2-4 concrete pathways, each with: title, description, framework used, trade-offs for each party, feasibility (high/medium/low), prerequisites, and numbered implementation steps.
5. ZOPA Analysis — Does a Zone of Possible Agreement exist? Describe each party's flexibility range and the overlap area (or explain what would need to change to create one).
6. Framework Fit — Score each of the 6 CONCORDIA frameworks (Fisher & Ury, Lederach, Glasl, Zartman, Bush & Folger, Narrative) 0-100 for fit with this specific conflict. Explain why.
7. Psychological Dynamics — Assess emotional readiness, power balance, communication patterns, and readiness-to-resolve.
8. Momentum Assessment — Rate overall readiness to resolve (0-100). List specific blockers preventing resolution and catalysts that could accelerate it. Recommend the single most impactful next move.

Transcript:
${transcript}

Case Structure:
${caseStructure}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          executiveSummary: { type: Type.STRING },
          commonGround: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item: { type: Type.STRING },
                strength: { type: Type.STRING },
                evidence: { type: Type.STRING },
              },
            },
          },
          criticalQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                target: { type: Type.STRING },
                purpose: { type: Type.STRING },
                framework: { type: Type.STRING },
              },
            },
          },
          pathways: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                framework: { type: Type.STRING },
                tradeoffsForA: { type: Type.STRING },
                tradeoffsForB: { type: Type.STRING },
                feasibility: { type: Type.STRING },
                prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
                implementationSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
          },
          zopaAnalysis: {
            type: Type.OBJECT,
            properties: {
              exists: { type: Type.BOOLEAN },
              description: { type: Type.STRING },
              partyARange: { type: Type.STRING },
              partyBRange: { type: Type.STRING },
              overlapArea: { type: Type.STRING },
            },
          },
          frameworkFit: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                framework: { type: Type.STRING },
                score: { type: Type.NUMBER },
                rationale: { type: Type.STRING },
              },
            },
          },
          psychologicalDynamics: { type: Type.ARRAY, items: { type: Type.STRING } },
          momentumAssessment: {
            type: Type.OBJECT,
            properties: {
              readinessToResolve: { type: Type.NUMBER },
              blockers: { type: Type.ARRAY, items: { type: Type.STRING } },
              catalysts: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedNextMove: { type: Type.STRING },
            },
          },
        },
      },
    },
  });
  return response.text;
};

// ── Case Summary ──

export const summarizeCase = async (caseData: {
  transcript: string;
  actors: any[];
  primitives: any[];
  commonGround: string[];
  tensionPoints: string[];
}) => {
  const ai = initAI();
  const response = await ai.models.generateContent({
    model: _MODEL_TEXT,
    contents: `You are the CONCORDIA Case Analyst. Generate a structured executive summary for this mediation case.

Transcript:
${caseData.transcript}

Actors:
${JSON.stringify(caseData.actors, null, 2)}

Primitives:
${JSON.stringify(caseData.primitives, null, 2)}

Common Ground identified:
${caseData.commonGround.join("\n") || "(none yet)"}

Tension Points:
${caseData.tensionPoints.join("\n") || "(none yet)"}

Generate a comprehensive structured summary with: session overview, top 3 claims per party, core interests per party, areas of agreement, unresolved tensions, and recommended next steps.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sessionOverview: { type: Type.STRING },
          keyClaimsPartyA: { type: Type.ARRAY, items: { type: Type.STRING } },
          keyClaimsPartyB: { type: Type.ARRAY, items: { type: Type.STRING } },
          coreInterestsPartyA: { type: Type.ARRAY, items: { type: Type.STRING } },
          coreInterestsPartyB: { type: Type.ARRAY, items: { type: Type.STRING } },
          areasOfAgreement: { type: Type.ARRAY, items: { type: Type.STRING } },
          unresolvedTensions: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendedNextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
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
