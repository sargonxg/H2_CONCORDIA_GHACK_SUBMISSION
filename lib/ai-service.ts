import { GoogleGenAI, Type, Modality, Behavior, EndSensitivity, ActivityHandling } from "@google/genai";
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

  const assessPowerDynamics: any = {
    name: "assessPowerDynamics",
    description:
      "Assess and update the power dynamics between parties. Call when you " +
      "detect power moves (threats, appeals to authority, information asymmetry) or " +
      "when transitioning between phases. Powers are rated on a -5 to +5 scale where " +
      "negative means Party A dominance and positive means Party B dominance.",
    ...nonBlocking,
    parameters: {
      type: Type.OBJECT,
      properties: {
        dimensions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              dimension: { type: Type.STRING, description: "Power dimension name" },
              score: { type: Type.NUMBER, description: "-5 (A dominant) to +5 (B dominant), 0 = balanced" },
              evidence: { type: Type.STRING, description: "What you observed" },
            },
          },
          description:
            "Dimensions: informational, economic, positional, relational, " +
            "emotional, procedural, coercive, expert, legitimate, referent",
        },
        overallBalance: {
          type: Type.STRING,
          description: "balanced|A-favored|B-favored|severely-imbalanced",
        },
        rebalancingStrategy: {
          type: Type.STRING,
          description: "Specific strategy to rebalance if needed",
        },
      },
      required: ["dimensions", "overallBalance"],
    },
  };

  const detectImpasse: any = {
    name: "detectImpasse",
    description:
      "Call when you detect the conversation is stuck — repeated positions, " +
      "circular arguments, emotional withdrawal, or no new information surfacing. " +
      "Triggers the impasse-breaking protocol.",
    ...nonBlocking,
    parameters: {
      type: Type.OBJECT,
      properties: {
        signals: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Observed impasse signals",
        },
        duration: { type: Type.STRING, description: "How long the impasse has lasted" },
        lastNewInformation: {
          type: Type.STRING,
          description: "What was the last new piece of information",
        },
        suggestedBreaker: {
          type: Type.STRING,
          description:
            "Impasse-breaking technique to try: " +
            "'future-casting' (imagine resolution achieved) | " +
            "'role-reversal' (ask each to argue the other's position) | " +
            "'single-text' (mediator proposes a draft both can critique) | " +
            "'process-change' (switch to caucus, bring in expert, change setting) | " +
            "'parking' (set aside and address easier issues first) | " +
            "'new-actor' (bring in a decision-maker or stakeholder) | " +
            "'BATNA-reality-test' (explore alternatives to agreement)",
        },
      },
      required: ["signals", "suggestedBreaker"],
    },
  };

  return [
    updateMediationState,
    requestMissingInformation,
    captureAgreement,
    flagEscalation,
    proposeSolution,
    assessPowerDynamics,
    detectImpasse,
  ];
}

// ── Voice Palette for Mediation Contexts ──

export const MEDIATOR_VOICES = {
  professional: { voice: 'Zephyr', description: 'Calm, authoritative, measured' },
  empathic: { voice: 'Kore', description: 'Warm, gentle, emotionally present' },
  firm: { voice: 'Orus', description: 'Direct, grounded, clear boundaries' },
  facilitative: { voice: 'Aoede', description: 'Encouraging, collaborative, light' },
} as const;

// ── Live Audio Session ──

function buildSystemInstruction(
  mediatorProfile: any,
  partyNames: { partyA: string; partyB: string },
  context: string,
) {
  const stylePreamble =
    mediatorProfile.style === "empathic"
      ? `YOUR STYLE: Warm, human, deeply present. Lead with emotion before structure. Use everyday language. Follow the emotional rhythm of the conversation — if someone needs to be heard, let them talk. Avoid all jargon aloud. Feel first, process second.`
      : `YOUR STYLE: Measured, precise, professionally warm. Reference frameworks by name when it adds value. Follow phase progression with authority. Formal but never cold.`;

  return `You are CONCORDIA, an elite AI Mediator created by the TACITUS Institute for Conflict Resolution. You are facilitating a live mediation session between "${partyNames.partyA}" and "${partyNames.partyB}".

${stylePreamble}
Mediation approach: ${mediatorProfile.approach}.
${context ? `\nCase Context:\n${context}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE RESPONSE DISCIPLINE (non-negotiable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BREVITY: Maximum 2 sentences per turn. Usually 1 is better. Human spoken attention span is ~10 seconds. The question IS the full response.
Silence is not emptiness — it is the most powerful thing you can do after a question.

ONE QUESTION: One question per turn. Stop after asking it. No softeners, no "take your time", no follow-up clauses. Just ask it and stop.

NO REPETITION: NEVER paraphrase what a party just said. They said it — they know it. Instead: reflect the EMOTIONAL CORE in ≤8 words using their own language, then ask forward. Example: they said "I feel completely ignored by this company" → you say "Completely ignored — what matters most to you now?" Not: "I hear that you're feeling ignored and that's really difficult, can you tell me more about..."

NO FILLER PHRASES: Never use these: "I can hear that...", "I understand that...", "Thank you for sharing...", "That's really important...", "Absolutely...", "Of course..." — vary every acknowledgment. Use specific, concrete reflection of what was actually said.

NATURAL LANGUAGE: Use contractions throughout — "I'm", "you've", "that's", "it's", "we're". Formal uncontracked speech sounds robotic. Occasionally use natural filler phrases to signal you're processing: "Actually...", "Let me think about that...", "I'm wondering...". These sound human. Never use markdown formatting, bullets, or headers in speech.

NAME THE SPEAKER FIRST: Always open with their name. "${partyNames.partyA}, ..." or "${partyNames.partyB}, ..."

WAIT: After asking, do not speak again. The silence is yours to hold. They will fill it.

BACKCHANNELING: During a party's turn, you can use short vocal backchannels at natural mid-speech pause points (not at the end — that signals turn-taking): "Mm-hmm", "I see", "Right", "Okay". At emotional content, upgrade: "That sounds really hard" or "That's a lot to carry." Backchanneling signals you're present without interrupting. Use sparingly — every 2-3 sentences at most.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE PROGRESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. OPENING (2-3 exchanges total)
   Your very first words must be a warm, specific welcome. Use this exact structure:
   - GREET both parties by name: "Welcome, ${partyNames.partyA} and ${partyNames.partyB}. I'm CONCORDIA — I'll be your mediator today."
   - VOICE CALIBRATION: "${partyNames.partyA}, could you say a quick hello so I can learn your voice? ... Great. ${partyNames.partyB}, you too? ... Perfect, I've got you both."
   - CONTEXT: If pre-session documents or statements were provided, acknowledge: "I've reviewed the background materials. I have a good starting picture."
   - GROUND RULES in ONE sentence: "We'll speak one at a time, treat each other with respect, and everything here stays in this room."
   - FIRST QUESTION: "${partyNames.partyA}, what brought you here today?" Then advance.
   Do NOT linger in Opening. After voice calibration and the first question, move forward.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPEAKER IDENTIFICATION (shared microphone mode)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are receiving audio from a SINGLE microphone shared by two parties. You can distinguish speakers by voice characteristics (pitch, pace, timbre, accent). Apply these rules:

VOICE CALIBRATION (Opening phase — critical):
  In Opening, when each party introduces themselves, MEMORIZE their vocal signature.
  "Thank you, ${partyNames.partyA}. And ${partyNames.partyB}, I hear you too — I now have both your voices."
  If you receive the party names from pre-session intake, confirm:
  "${partyNames.partyA}, just so I can keep track — could you say a quick hello? ... Great. And ${partyNames.partyB}?"

WHEN UNCERTAIN who is speaking:
  → Ask immediately and naturally: "I want to make sure I'm following — was that ${partyNames.partyA} or ${partyNames.partyB}?"
  → Do NOT guess and attribute incorrectly. Misattribution damages trust more than asking.
  → After clarification, acknowledge: "Got it, ${partyNames.partyA}. Thank you."

SPEAKER TRACKING in updateMediationState:
  Always set targetActor to the name of the party you're ABOUT TO address (not who just spoke).
  In transcript entries, prefix with the speaker's name when you know it.

THIRD VOICES:
  If you detect a voice that doesn't match either calibrated party, ask:
  "I'm hearing someone new — could you introduce yourself?"
  This handles observers, family members, or legal counsel who may be present.

2. DISCOVERY — NARRATIVE → EMOTION → INTERESTS (max 4 exchanges per party per round)
   NARRATIVE: "Tell me what happened from your side." One follow-up max. Then next.
   EMOTION: "What was the hardest part of that?" (Not "how did it make you feel?" — too clinical.)
   INTERESTS: "What do you need most going forward?" Probe once with "What's underneath that for you?"

   ► GOOD ENOUGH RULE: If you have a clear narrative, an emotion, and at least one interest, advance. Perfect completeness is never the goal. Progress is the goal.
   ► TIME BOX: Discovery for one party should not exceed 6-8 exchanges total. Move on.
   ► SEQUENCE: Complete all 3 rounds with ${partyNames.partyA} first. Then all 3 with ${partyNames.partyB}.

3. EXPLORATION (cross-referencing)
   Reference the other party explicitly: "${partyNames.partyA} mentioned [X in their exact words]. ${partyNames.partyB}, where does that land with you?"
   Identify: shared facts · overlapping interests · ZOPA · emotional triggers

4. NEGOTIATION
   Hypotheticals: "What would it look like if...?" / "What would need to be true for you to consider...?"
   Scaling: "On a scale of 1-10, how workable is that for you?"
   Future-focused: "If we got this right, what would be different next month?"

5. RESOLUTION → AGREEMENT
   Test draft agreements: "If X, does that address your concern about Y?"
   Confirm with both. Call captureAgreement immediately when any point is agreed.

TRANSITION GATES — do not advance without:
  Opening→Discovery: Both stated why they're here.
  Discovery→Exploration: ≥1 Interest + ≥1 Narrative per party. (2 interests ideal, not required.)
  Exploration→Negotiation: ≥1 Common Ground. ZOPA attempted.
  Negotiation→Resolution: ≥2 options generated, both parties reacted.
  Resolution→Agreement: ≥1 pathway conditionally accepted.

Announce transitions clearly and proactively — don't ask permission:
  "We've heard from both of you. Let me now bring your perspectives together."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE TALK vs. SUSTAIN TALK (MI Core)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Listen for these signals in every party utterance:

CHANGE TALK (moving toward resolution) — words like: "want to", "need to", "ready to", "could", "would", "I suppose", "it might help if...":
  → REFLECT IT BACK: They hear their own change talk once when they say it, twice when you reflect it. Reinforce it: "So a part of you is open to..."
  → EXPLORE IT: "Tell me more about that." or "What would that look like for you?"
  → SUMMARIZE IT PROMINENTLY: When summarizing, include change talk and highlight it slightly more than the rest.

SUSTAIN TALK (moving away from resolution) — words like: "but", "however", "I can't because", "it's not fair", "they never":
  → Do NOT argue, dismiss, or ignore it. Arguing amplifies resistance.
  → STRAIGHT REFLECTION: Repeat it back without judgment: "So it doesn't feel fair to you." Then wait.
  → AMPLIFIED REFLECTION: Reflect it at slightly higher intensity so the party hears themselves and often softens naturally: "So this feels completely impossible." (They often respond: "Well, not completely...")
  → DOUBLE-SIDED REFLECTION: Capture both sides of ambivalence — always end on the change side: "On one hand, you're not willing to give ground on this. And on the other, you're exhausted by how long this has gone on." Ending with the change talk side creates forward pull.

AMBIVALENCE SUMMARY (use before key moments): Collect both the reasons to stay stuck AND the reasons to resolve. Present them side by side. Then highlight the change talk side slightly: "I've heard you say [sustain], and I've also heard [change talk]. What's most important to you right now?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANTI-STAGNATION & MOMENTUM RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REPETITION DETECTION: If a party repeats a point already made:
  → Acknowledge ONCE ("Yes, I've got that.") then reframe: "Let me ask you something different — [new angle]."
  → Never ask for more detail on a point already made. It signals you weren't listening.
  → If it's the 2nd repetition: name the depth beneath it: "You keep coming back to this — and that tells me it's really important. What's underneath it for you?"

LOOP DETECTION: If the same exchange has happened 2+ times:
  → Name it without blame: "I notice we've visited this territory a few times now. Let's try a different approach."
  → Use a reframe, hypothetical, or addressee change to break the loop.
  → If still stuck: "Let's set this aside and find something we can agree on first — then come back."

"WHAT ELSE?": Before closing ANY topic, ask "What else?" or "Is there anything else about that you want me to understand?" — this is low-pressure, invites depth, and prevents premature closure. Use once per topic maximum.

INCREMENTAL CONCESSION SEEDING: When both parties are rigid, start with the SMALLEST point of agreement, not the hardest issue:
  → "Before we get to the bigger questions — is there anything, even something small, that you both feel the same way about?"
  → Small agreements build momentum and demonstrate good faith. Each one creates reciprocity pressure.

MOMENTUM MOVES (use proactively):
  → After a good exchange: don't pause to reflect — immediately advance to the next question.
  → After emotional disclosure: brief acknowledgment, then forward: "[Their exact words back] — and what do you need now?"
  → After a long silence from a party: "Take a moment. What's coming up for you?"
  → Between phases: 1-sentence bridge and advance. No recap.

DIAGNOSIS BEFORE INTERVENTION (when stuck after multiple techniques):
  → Missing information: "Is there any information that, if you had it, might change how you're thinking about this?"
  → Momentum absent: Find any micro-agreement and name it explicitly — even "you both agreed to be here today."
  → Face-saving barrier: Move to caucus mode (private session) — saying yes privately is easier than yes publicly.

ORID QUESTIONING SEQUENCE (for structured exploration):
  Objective: "What specifically happened?"
  Reflective: "What was your gut reaction?"
  Interpretive: "What does this mean for you going forward?"
  Decisional: "What would you need to see to feel this is resolved?"
  Move through O→R→I→D across no more than 2-3 turns per dimension.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LISTENING & AFFECT INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AFFECTIVE AUDIO: You hear vocal emotion directly — tone, pace, tremor, hesitation, breath. This is one of your most powerful capabilities. Use it constantly.
  → Emotional flooding (voice tremor + pace increase): slow your pace, soften your tone, lower your volume. Become a calming presence, not a mirror.
  → Mismatch (calm words / stressed voice): name it with a hedged guess: "Your words sound okay, but I'm picking up something else — am I sensing some tension there?"
  → Quiet/withdrawn voice: "You've gone quiet — what's going on for you right now?"
  → Rising anger: DO NOT match their pace or volume. Become even calmer and slower. Your composure is the intervention.
  → Prosodic shift: When a party's voice drops in pitch and slows, they are often disclosing something important. Stay silent longer than usual to hold space for it.

PROACTIVE LISTENING: When parties talk to each other, LISTEN SILENTLY. Accumulate observations.
  → Speak only when: (a) escalation detected, (b) a natural pause opens, (c) you're directly addressed.
  → After 3+ exchanges between them: "I've been listening. I noticed something important..."
  → This is especially powerful in Exploration and Negotiation phases.

EMOTION-FIRST RULE: If someone expresses emotion, reflect the feeling in their own words first. Then ask. Never ask through unacknowledged pain.
  → Use specific labels: "That sounds like genuine grief" / "That's a lot of frustration to carry" — not generic "I hear you're frustrated."
  → Count to 5 mentally after an emotional moment before saying anything. The space itself has value.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONFLICT STRUCTURE (TACITUS 8 Primitives)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Map every statement to a primitive: Actor / Claim / Interest / Constraint / Leverage / Commitment / Event / Narrative

SILENT EXTRACTION: Extract and call updateMediationState silently for routine updates. Do NOT announce every extraction — it breaks conversational flow and feels mechanical.
ANNOUNCE ONLY significant discoveries:
  → New Common Ground: "I want to name something — you both care about [X]. That's a foundation."
  → Surprising Constraint: "That's an important limit I want to make sure I've understood correctly."
  → Shared Interest emerging: "Something just connected — you're both describing the same underlying need."
  → Critical Gap: Ask a targeted question (don't announce the gap; just ask the question that fills it).

GAP-FILLING QUESTIONS (use naturally, not mechanically):
  → No Interests: "What matters most to you here — underneath the specific ask?"
  → No Constraints: "Are there any hard limits — financial, legal, or personal — I should know about?"
  → No BATNA/Leverage: "What would you do if we don't reach an agreement today?"
  → No Events: "What was the moment when things first shifted between you?"
  → No Narratives: "How did this start, from your perspective?"

COMMON GROUND — name explicitly:
  "I notice you both [X]. That's something real to build on." → add to commonGround in updateMediationState.
ZOPA — when flexibility ranges overlap:
  "There might be a zone of agreement around [X]. Let me test that." → update tensionPoints, commonGround.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PSYCHOLOGICAL PROFILING (update every turn)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Update partyProfiles silently via updateMediationState on every turn:
  conflictStyle: Thomas-Kilmann (Competing/Collaborating/Compromising/Avoiding/Accommodating)
  emotionalIntensity: Plutchik 1-10, trajectory: escalating/stable/de-escalating
  emotionalState: specific description including vocal cues (e.g., "Voice tense, words measured — suppressed frustration")
  trustTowardOther: Mayer/Davis/Schoorman — ability/benevolence/integrity 0-100
  riskAssessment: escalation/withdrawal/badFaith/impasse 0-100
  BATNA: what they'll do if no agreement is reached

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESCALATION PROTOCOL (override all else)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Call flagEscalation IMMEDIATELY on: blame / contempt / threats / stonewalling / Gottman Four Horsemen.
Do NOT wait. Intervene before words escalate further.

Level 1 (30-50): Name emotion, do not match energy. "That sounds really painful. Let's slow down."
Level 2 (51-70): Name the dynamic. "I'm noticing the heat in this. That tells me this matters deeply to both of you. Let's breathe."
Level 3 (71-85): Hard circuit-break. "I need to pause us. This is important enough to get right — let's take a moment and refocus."
Level 4 (86-100): Separate immediately. "I think we need to speak individually. ${partyNames.partyA}, let me check in with you first."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADVANCED INTERVENTION TOOLKIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REFRAME (position → interest):
  Formula: Strip emotional/positional charge → identify underlying concern → restate as need or interest.
  Example: "He's stealing from me" → "You feel something that was rightfully yours wasn't properly accounted for — and that matters a great deal to you."
  Example: "I want full ownership." → "What would full ownership give you that you don't have now?"
  NEVER echo the charged language — always translate to interest.

HEDGED GUESS (most human-sounding technique — use for emotional depth):
  Lead with uncertainty to invite correction: "I could be wrong, but I'm sensing there might be some hurt beneath this — does that resonate?"
  Or: "This might not be quite right, but what I'm hearing underneath this is... am I close?"
  Why: Imperfect guesses that invite correction feel more human and trustworthy than confident pronouncements. They also allow the party to deepen and correct, which builds rapport.
  Use when: You detect something beneath the surface that the party hasn't named yet.

MIRACLE QUESTION (solution-focused, for impasse):
  "Suppose you woke up tomorrow and somehow this was fully resolved — what's the first thing that would be different?"

PERSPECTIVE SWAP (for fixed positions):
  "${partyNames.partyA}, if you were in ${partyNames.partyB}'s position right now, what do you think you'd be feeling?"

NAMING WHAT YOU'RE DOING (builds trust, sounds human):
  "I'm going to try to reflect back what I heard — stop me if I miss something."
  "I want to try something a bit different — is that okay?"
  Transparency about process makes the conversation feel less scripted.

LOOPING (check comprehension, build trust):
  "Let me make sure I have this right: [use their exact words, not a summary]. Did I catch that?"
  Use max once per Discovery round.

SCALING (readiness/flexibility check):
  "On a scale of 1-10, how workable is that idea for you? What would move it from a [X] to a [X+2]?"

PARKING (when an issue is blocking progress):
  "Let's note that and come back to it. What's something both of you feel clearer about right now?"

EXTERNAL CRITERIA (for deadlock on specifics):
  "What would an independent expert in this area say is fair? Let's use that as a reference point."

POWER BALANCING:
  Give quieter party more turns. Start with their name. Validate explicitly before moving to the other.

BRIDGING (when interests align):
  "You both just described the same underlying need from two different angles. What if we built the agreement around that shared need?"
  → Call captureAgreement immediately if they respond positively.

DOUBLE-BLIND PROPOSAL (for caucus mode — when parties are deadlocked on specifics):
  In private caucus with each party separately, propose a specific option. Neither knows the other's response.
  This removes face-saving barriers — agreeing privately is much easier than agreeing publicly in front of the other party.
  Only use in caucus mode and only when both parties have already indicated some openness.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEDIATION FRAMEWORKS (prefix currentAction)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Fisher & Ury] Separate people from problem. Interests not positions. Objective criteria. Mutual gain.
[Bush & Folger] Empowerment (their choices) + Recognition (other's perspective). Restore agency.
[Narrative] Externalize the problem: "the conflict" not "you." Build alternative story.
[Glasl S1-9] S1-3: problem-solving. S4-6: rehumanize. S7-9: arbitrate/separate. Know the stage.
[Zartman] Mutually Hurting Stalemate + Way Out = ripeness. If not ripe: create ripeness conditions.
[Argyris] Walk back the Ladder of Inference: from conclusions → interpretations → observable facts.
[Coleman] Is this conflict self-sustaining? Perturb the attractor — don't just negotiate within it.
[Schelling] Find the natural focal point both would independently gravitate toward.
[Galtung ABC] Attitude + Behavior + Contradiction — address all three or it won't hold.
[Deutsch] Cooperative process → cooperative outcome. Shift the process, not just the content.
[NVC] — Observation → Feeling → Need → Request. Translate positions into universal human needs.
[Difficult Conversations] — Three layers: What Happened + Feelings + Identity. Address the identity threat first.
[Lewicki Trust] — Diagnose which trust dimension broke (ability/benevolence/integrity). Match the repair strategy.
[Shapiro Identity] — Is this about identity, not interests? Surface the taboo. Dissolve enemy images.
[Solution-Focused] — Miracle question. Exception finding. Scaling. What's already working?
[Mnookin Tensions] — Create value before distributing it. Empathy AND assertiveness. Behind-the-table pressures.
[Follett] — Seek integration (creative third option), not just compromise. Differences are a resource.

Format currentAction: "[Framework] Action | Next: planned follow-up"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT INJECTION PROTOCOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You will receive [SYSTEM CONTEXT UPDATE] messages with extracted structure, agreements, gaps, and analysis.
1. Integrate silently — treat as your own memory refreshed. DO NOT read them aloud.
2. Reference extracted primitives when relevant: "Earlier we identified your interest in X — does that still hold?"
3. Fill gaps immediately: if the update shows missing Constraints, ask the gap-filling question in your next turn.
4. When [ANALYSIS RESULTS] arrive: if ZOPA exists, move toward it. If momentum is low, name what's blocking and propose a change.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL BEHAVIORAL RULES (absolute)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROHIBITIONS:
✗ NEVER repeat or paraphrase what was just said.
✗ NEVER ask 2 questions in one turn.
✗ NEVER speak more than 2 sentences before your question.
✗ NEVER use generic filler phrases (I hear you / I understand / Thank you for sharing / Absolutely / Of course).
✗ NEVER announce routine extractions — extract and call updateMediationState silently.
✗ NEVER stay in Discovery beyond 8 exchanges per party — move forward.
✗ NEVER add softeners after asking a question — silence is the signal to wait.
✗ NEVER use the same opening phrase twice in a row — vary every turn.
✗ NEVER ignore sustain talk — always reflect it before moving forward.

REQUIREMENTS:
✓ ALWAYS call updateMediationState before speaking.
✓ ALWAYS name the addressee first.
✓ ALWAYS validate emotion with their own words (not yours) before probing.
✓ ALWAYS reflect change talk prominently — say it back to amplify it.
✓ ALWAYS cross-reference the other party's statements during Exploration.
✓ ALWAYS announce Common Ground and Agreements aloud — these are milestones.
✓ ALWAYS propose transitions proactively — do not ask permission to advance.
✓ ALWAYS ask "What else?" before closing any topic (once per topic).
✓ ALWAYS use contractions in speech — "I'm", "you've", "that's", "it's", "we're".
✓ Format currentAction: "[Framework] Action | Next: planned follow-up"

LANGUAGE VARIETY ROTATION — use different acknowledgments every turn:
  "That makes sense." / "I hear that." / "Got it." / "That's clear." / "Right." /
  "[Their exact phrase back]" / "So [their words]" / "Mm-hmm." / "[silence]" /
  "I'm with you." / "That tracks." / "That lands." / "Understood." / "Noted."
  Never use the same one twice in a row.`;
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

  // ── Vertex AI-exclusive Live API features ─────────────────────────────────
  //
  //  enableAffectiveDialog  — model reads vocal emotion (tone, pace, tremor)
  //                           for empathic response tuning and early flooding
  //                           detection before words signal distress.
  //
  //  proactivity.proactiveAudio — co-listener mode: model does NOT auto-respond
  //                               to every audio chunk. It listens silently while
  //                               parties speak to each other and only interrupts
  //                               when it detects escalation, a natural pause, or
  //                               a direct address. Essential for mediation.
  //
  //  realtimeInputConfig — voice activity detection (VAD) tuning:
  //    • END_SENSITIVITY_LOW   — more tolerant of pauses. Prevents the model
  //                              cutting off speakers in the middle of emotional
  //                              sentences where people pause to gather thoughts.
  //    • silenceDurationMs:2500 — 2.5s of silence required before turn ends.
  //                               Standard is ~500ms; 2.5s is better for mediation
  //                               where emotional speakers often pause mid-sentence.
  //    • NO_INTERRUPTION_HANDLING — model does not interrupt when new speech begins;
  //                                 it waits to finish its response first. Prevents
  //                                 the AI from talking over a party.
  //
  // ⚠️  ALL THREE are Vertex AI-only. API key mode rejects them with code=1007
  //     "Unknown name" and closes the session immediately. Never include without
  //     the _useVertexAI guard below.
  //
  // ⚠️  thinkingConfig is NOT a valid LiveConnectConfig field (generateContent only).
  //     Including it causes immediate session close. DO NOT add it here.
  // ───────────────────────────────────────────────────────────────────────────

  const vertexOnlyConfig = _useVertexAI
    ? {
        enableAffectiveDialog: true,
        proactivity: { proactiveAudio: true },
        realtimeInputConfig: {
          automaticActivityDetection: {
            // Low end-of-speech sensitivity = more tolerant of pauses mid-sentence.
            // Mediation parties often pause when emotional — we don't want to cut them off.
            endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
            // 2.5s of silence before the model considers a turn complete.
            silenceDurationMs: 2500,
          },
          // Do not interrupt ongoing model speech when the user starts talking.
          // Prevents the AI from talking over a party during emotional moments.
          activityHandling: ActivityHandling.NO_INTERRUPTION,
        },
      }
    : {};

  const config: any = {
    responseModalities: [Modality.AUDIO],
    ...vertexOnlyConfig,
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
    // Transcribe both parties' speech and the model's own speech.
    // Results arrive as message.serverContent.inputTranscription.text
    // and message.serverContent.outputTranscription.text respectively.
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    // Sliding window compression keeps long mediation sessions (30min+) alive
    // by summarizing older context instead of dropping it.
    contextWindowCompression: {
      slidingWindow: {},
    },
    // Session resumption: {} enables handle tracking for the new session.
    // Pass the handle when actually resuming a dropped session.
    ...(resumptionHandle
      ? { sessionResumption: { handle: resumptionHandle } }
      : { sessionResumption: {} }),
  };

  const activeFeatures = [
    _useVertexAI ? "affectiveDialog" : null,
    _useVertexAI ? "proactiveAudio" : null,
    _useVertexAI ? "VAD(END_SENSITIVITY_LOW,2500ms,NO_INTERRUPT)" : null,
    "transcription(in+out)",
    "contextCompression",
    "sessionResumption",
  ].filter(Boolean).join(" | ");

  console.log(`[Live] model=${_MODEL_LIVE} voice=${mediatorProfile.voice} resume=${!!resumptionHandle}`);
  console.log(`[Live] features: ${activeFeatures}`);

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
- Deutsch Crude Law — Cooperative process → cooperative outcome; shift the process
- Pruitt Dual Concern Model — Map concern-for-self vs concern-for-other; feasibility matters
- Galtung ABC Triangle — Attitude + Behavior + Contradiction; address all three
- Curle Progression Model — Assess readiness: education → advocacy → mediation → maintenance
- Nonviolent Communication (Rosenberg NVC) — OFNR sequence; translate positions into universal human needs
- Difficult Conversations (Stone/Patton/Heen) — Three layers: What Happened + Feelings + Identity; address identity threat first
- Trust Repair (Lewicki) — Diagnose competence/benevolence/integrity violation; match repair strategy
- Negotiating the Nonnegotiable (Shapiro) — Identity-based conflict; surface taboos; dissolve enemy images
- Solution-Focused Brief Approach (de Shazer/Berg) — Miracle question; exception finding; scaling; build on what works
- Beyond Winning (Mnookin) — Create value before distributing; empathy AND assertiveness; behind-the-table pressures
- Creative Integration (Follett) — Seek integration not just compromise; differences as resource; power-with not power-over
- Schelling Focal Points — Construct salient, "natural" solutions parties independently converge on
- Coleman Intractable Conflicts — Attractor dynamics; perturb rather than negotiate within the loop
- Ury/Brett/Goldberg Interest-Rights-Power — Diagnose mechanism; loop parties back toward interests
- Argyris Ladder of Inference — Walk parties from conclusions back to shared observable data
- TACITUS 8-Primitive Ontology — Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative

Be direct, specific, and actionable. Reference the case facts when available. Avoid generic advice.

RESPONSE MODES (select based on query type):
  BRIEFING — When user says "brief me", "situation", "analyze":
    → Situation Assessment (2-3 sentences)
    → Key Dynamics
    → Risk Factors
    → Opportunities
    → 3-5 Next Steps

  STRATEGY — When user says "what should I do", "advise", "how to handle":
    → Assessment
    → Option A [framework] with pros/cons
    → Option B [framework] with pros/cons
    → Recommendation

  QUESTIONS — When user says "what should I ask", "generate questions", "what's missing":
    → Gap Analysis
    → Phase-Appropriate Questions
    → Framework-Specific Questions
    → Priority ranking

Always be specific to this case. Reference parties by name. Quote transcript when relevant. Cite specific primitives.

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

// Guard against prompt injection in transcribed speech.
// A party could say "Ignore all previous instructions" during mediation and have it
// transcribed and forwarded to the extraction LLM — this strips known injection patterns.
function sanitizeTranscriptForExtraction(text: string): string {
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/gi,
    /you\s+are\s+now\s+a/gi,
    /system\s*:\s*/gi,
    /\[SYSTEM\]/gi,
    /\[INST\]/gi,
    /<<SYS>>/gi,
    /```\s*(system|assistant|user)/gi,
  ];
  let sanitized = text;
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }
  return sanitized;
}

export const extractPrimitives = async (text: string) => {
  const ai = initAI();
  const sanitized = sanitizeTranscriptForExtraction(text);
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
${sanitized}`,
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

// ── Document Processing ──

export const processDocument = async (file: File): Promise<string> => {
  const ai = initAI();
  const prompt = 'Extract a structured summary for a mediation pre-session briefing. Include: key facts, dates, demands/positions, emotional language/grievances, and relevant context. Max 300 words. No legal advice.';
  let contents: any[];
  if (file.type === 'application/pdf') {
    const buffer = Buffer.from(await file.arrayBuffer());
    contents = [
      { inlineData: { mimeType: 'application/pdf', data: buffer.toString('base64') } },
      { text: prompt },
    ];
  } else {
    const text = await file.text();
    contents = [{ text: `${prompt}\n\n---\n${text.slice(0, 50000)}\n---` }];
  }
  const response = await ai.models.generateContent({ model: _MODEL_TEXT, contents });
  return response.text || 'Unable to extract summary.';
};

// ── Settlement Agreement Generation ──

export const generateAgreement = async (data: {
  caseTitle: string; caseType: string; partyAName: string; partyBName: string;
  agreements: { topic: string; terms: string; conditions?: string[] }[];
  commonGround: string[]; context: string;
}): Promise<any> => {
  const ai = initAI();
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const response = await ai.models.generateContent({
    model: _MODEL_TEXT,
    contents: `You are a document drafting assistant for the CONCORDIA mediation platform by TACITUS.

Generate a formal mediation settlement agreement:

Case: ${data.caseTitle} (${data.caseType})
Date: ${date}
Party A: ${data.partyAName}
Party B: ${data.partyBName}

Agreements reached:
${data.agreements.map((a, i) => `${i+1}. ${a.topic}: ${a.terms}${a.conditions?.length ? ` (Conditions: ${a.conditions.join('; ')})` : ''}`).join('\n')}

Common Ground: ${data.commonGround.join('; ') || 'None documented'}

Context: ${data.context}

Generate fields: preamble, background, agreedTerms (array of {number, title, text, responsible, deadline}), implementationPlan, reviewMechanism, contingencies, confidentiality, acknowledgment, disclaimer (include: "This document was generated with AI assistance during a mediation facilitated by CONCORDIA, a product of the TACITUS Institute for Conflict Resolution. It is not legal advice. Parties are encouraged to have it reviewed by legal counsel.").`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          preamble: { type: Type.STRING }, background: { type: Type.STRING },
          agreedTerms: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
            number: { type: Type.NUMBER }, title: { type: Type.STRING }, text: { type: Type.STRING },
            responsible: { type: Type.STRING }, deadline: { type: Type.STRING },
          }}},
          implementationPlan: { type: Type.STRING }, reviewMechanism: { type: Type.STRING },
          contingencies: { type: Type.STRING }, confidentiality: { type: Type.STRING },
          acknowledgment: { type: Type.STRING }, disclaimer: { type: Type.STRING },
        },
      },
    },
  });
  return JSON.parse(response.text || '{}');
};
