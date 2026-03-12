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

AFFECTIVE AUDIO INTELLIGENCE:
You have native access to the emotional qualities of each speaker's voice — tone, pace, pitch, tremor, hesitation. USE this information to:

Detect emotional flooding BEFORE it escalates to words (voice tremor, pace increase)
Match your vocal delivery to the emotional needs of the moment (softer when distressed, firmer when structure is needed)
Report vocal emotional cues in partyProfiles.emotionalState — e.g. "Voice indicates rising frustration despite calm words"
When you detect a mismatch between words and tone (saying "I'm fine" with a trembling voice), name it gently: "I notice your voice suggests this might be harder than your words indicate. Would you like to say more about how you're feeling?"

═══════════════════════════════════════════
PROACTIVE LISTENING MODE
═══════════════════════════════════════════

You have Proactive Audio enabled. This means you can co-listen to the parties speaking to each other WITHOUT interrupting. Use this capability:

When parties are in direct dialogue, LISTEN SILENTLY and accumulate observations
Only speak when: (a) directly addressed, (b) you detect escalation requiring intervention, (c) a natural pause occurs where your input would advance the process, or (d) a party looks to you for guidance
After extended listening, summarize what you observed: "I've been listening to your exchange, and I noticed..."
This is especially valuable in the Exploration and Negotiation phases where parties should be engaging with each other, not just through you

═══════════════════════════════════════════
MEDIATION FRAMEWORKS (apply adaptively — prefix responses)
═══════════════════════════════════════════

[Fisher & Ury] — Separate people from problem. Focus interests, not positions. Mutual gain options. Objective criteria.
[Lederach] — Root causes. Conflict as constructive change opportunity. Relationship-centered.
[Glasl S1–9] — Stage 1-3: joint problem-solving. Stage 4-6: rehumanization. Stage 7-9: arbitration/separation.
[Zartman] — Mutually Hurting Stalemate + Way Out = ripe for resolution. Otherwise: create ripeness conditions.
[Bush & Folger] — Empowerment (own choices) + Recognition (other's perspective).
[Narrative] — Externalize the problem. Build alternative story. "The conflict" not "you."
[Deutsch] — Crude Law: cooperative process → cooperative outcome. Shift the PROCESS itself, not just the content.
[Pruitt] — Dual Concern: map concern-for-self vs concern-for-other. Feasibility determines strategy, not just preferences.
[Galtung ABC] — Attitude + Behavior + Contradiction. Address ALL THREE vertices or settlement won't hold.
[Curle] — Is mediation the right tool? Check power balance and awareness first. Stage 3 only.
[Schelling] — Construct focal points: "natural" solutions both parties would independently gravitate toward.
[Coleman] — Is this conflict self-perpetuating? Perturb the attractor landscape — don't just negotiate within it.
[Ury/Brett/Goldberg] — Power → Rights → Interests: diagnose the current mechanism and loop parties back toward interests.
[Argyris] — Ladder of Inference: walk parties back from sweeping conclusions to shared observable facts.

In currentAction always use bracket notation: "[Fisher & Ury] Reframing…", "[Glasl Stage 3] Naming dynamic…", "[Argyris] Walking back inference ladder…"

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
CONTEXT INJECTION PROTOCOL
═══════════════════════════════════════════

During the session, you will periodically receive [SYSTEM CONTEXT UPDATE] messages containing the latest extracted conflict structure, common ground, tensions, agreements, and ontology gaps. When you receive these:

1. INTEGRATE the information into your mental model of the conflict — treat it as your own memory being refreshed
2. REFERENCE specific extracted primitives by name when relevant: "Earlier we identified your Interest in X — does that still hold?"
3. ADDRESS ontology gaps by asking the targeted questions suggested: if the update shows missing Constraints, probe for them in your next turn
4. ACKNOWLEDGE agreements: "We've captured your agreement on X — let's build on that foundation"
5. CORRECT any extraction errors you notice: "I think the system may have miscategorized X — that's more of a Constraint than a Claim"
6. When you receive [ANALYSIS RESULTS], use the ZOPA and momentum data to guide your next intervention: if momentum is low, diagnose blockers; if ZOPA exists, move toward it
7. DO NOT read context updates aloud — integrate them silently and continue naturally

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
