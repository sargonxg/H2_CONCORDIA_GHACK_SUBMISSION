// ── CONCORDIA De-escalation Library ──
// Patterns, protocols, and techniques for conflict de-escalation.

// ── Escalation trigger patterns ──
export const ESCALATION_TRIGGERS: { pattern: RegExp; category: string; severity: number }[] = [
  // Blame language
  { pattern: /\byou always\b/i, category: "blame", severity: 2 },
  { pattern: /\byou never\b/i, category: "blame", severity: 2 },
  { pattern: /\bit'?s your fault\b/i, category: "blame", severity: 3 },
  { pattern: /\byou caused\b/i, category: "blame", severity: 2 },
  { pattern: /\bbecause of you\b/i, category: "blame", severity: 2 },
  // Contempt
  { pattern: /\bthat'?s ridiculous\b/i, category: "contempt", severity: 3 },
  { pattern: /\bthat'?s absurd\b/i, category: "contempt", severity: 3 },
  { pattern: /\byou'?re pathetic\b/i, category: "contempt", severity: 4 },
  { pattern: /\byou'?re incompetent\b/i, category: "contempt", severity: 4 },
  { pattern: /\byou don'?t know what you'?re talking about\b/i, category: "contempt", severity: 3 },
  // Threats
  { pattern: /\bi'?ll take this to court\b/i, category: "threat", severity: 4 },
  { pattern: /\bi'?ll make sure you\b/i, category: "threat", severity: 3 },
  { pattern: /\byou'?ll regret\b/i, category: "threat", severity: 3 },
  { pattern: /\blegal action\b/i, category: "threat", severity: 3 },
  { pattern: /\bmy lawyer\b/i, category: "threat", severity: 2 },
  // Stonewalling
  { pattern: /\bi don'?t want to talk\b/i, category: "stonewalling", severity: 3 },
  { pattern: /\bthis is pointless\b/i, category: "stonewalling", severity: 3 },
  { pattern: /\bnot going to happen\b/i, category: "stonewalling", severity: 2 },
  { pattern: /\bwaste of time\b/i, category: "stonewalling", severity: 2 },
  { pattern: /\bi'?m done\b/i, category: "stonewalling", severity: 3 },
  // Gottman's Four Horsemen
  { pattern: /\bwhat'?s wrong with you\b/i, category: "criticism", severity: 3 },
  { pattern: /\byou'?re being defensive\b/i, category: "defensiveness", severity: 2 },
  { pattern: /\btypical\b.*\byou\b/i, category: "contempt", severity: 3 },
];

// ── De-escalation protocol levels ──
export interface EscalationProtocol {
  level: 1 | 2 | 3 | 4;
  name: string;
  escalationRange: [number, number]; // min/max escalation score
  triggers: string[];
  techniques: string[];
  description: string;
  scriptExample: string;
}

export const DE_ESCALATION_PROTOCOLS: EscalationProtocol[] = [
  {
    level: 1,
    name: "Acknowledgment",
    escalationRange: [30, 50],
    triggers: ["mild frustration", "slight tension", "slight impatience"],
    techniques: ["Reflective listening", "Validation", "Pacing"],
    description: "Acknowledge the emotion, name it, validate it before continuing",
    scriptExample: "I can hear that this is really important to you. Let's make sure your perspective is fully understood.",
  },
  {
    level: 2,
    name: "De-intensification",
    escalationRange: [51, 70],
    triggers: ["raised voice", "blame language", "interruptions"],
    techniques: ["Step to their side", "Reframe", "Slow the pace"],
    description: "Slow down, lower pace, name the dynamic without accusation",
    scriptExample: "I'm noticing the conversation is becoming quite heated. That's understandable given what's at stake. Let's slow down a bit.",
  },
  {
    level: 3,
    name: "Circuit Break",
    escalationRange: [71, 85],
    triggers: ["contempt", "threats", "personal attacks"],
    techniques: ["Name the pattern explicitly", "Ground rules reminder", "Suggest a pause"],
    description: "Interrupt the escalation cycle explicitly; invoke ground rules",
    scriptExample: "I'd like to pause for a moment. We agreed at the start to maintain mutual respect. Let's take a breath and refocus on what we're here to achieve.",
  },
  {
    level: 4,
    name: "Crisis Protocol",
    escalationRange: [86, 100],
    triggers: ["walkout threat", "hostile language", "breakdown of dialogue"],
    techniques: ["Individual caucus", "Power rebalancing", "Reframe crisis as turning point"],
    description: "Emergency de-escalation — speak with each party separately if needed",
    scriptExample: "I think it would be most helpful to speak with each of you individually for a few minutes. This will give us a chance to reset and find a path forward.",
  },
];

export function getProtocolForEscalation(score: number): EscalationProtocol | null {
  return (
    DE_ESCALATION_PROTOCOLS.find(
      (p) => score >= p.escalationRange[0] && score <= p.escalationRange[1],
    ) ?? null
  );
}

// ── William Ury's techniques ──
export const URY_TECHNIQUES = [
  {
    name: "Go to the balcony",
    description: "Mentally step back from the immediate conflict to gain perspective and composure.",
    when: "When you feel yourself being reactive or pulled into the conflict.",
  },
  {
    name: "Step to their side",
    description: "Acknowledge the other party's perspective and emotions before presenting your own.",
    when: "When the other party feels unheard or attacked.",
  },
  {
    name: "Reframe",
    description: "Transform the conversation from positions to interests, from blame to problem-solving.",
    when: "When parties are stuck in positional bargaining.",
  },
  {
    name: "Build a golden bridge",
    description: "Make it easy for the other party to agree by helping them see a face-saving path.",
    when: "When a party needs to shift position without losing face.",
  },
  {
    name: "Name the dynamic",
    description: "Explicitly identify the destructive pattern occurring without blaming anyone.",
    when: "When escalation patterns are repeating and parties can't see them.",
  },
];

// ── Glasl 9-stage model ──
export const GLASL_STAGES = [
  { stage: 1, name: "Tension", description: "Occasional friction, occasional cooperation", intervention: "Preventive dialogue, joint problem-solving" },
  { stage: 2, name: "Debate", description: "Polarization of thinking, either/or logic", intervention: "Structured dialogue, neutral facilitator" },
  { stage: 3, name: "Actions not words", description: "Empathy lost, actions replace talk", intervention: "Reality testing, reframing consequences" },
  { stage: 4, name: "Images & coalitions", description: "Negative images, allies recruited", intervention: "Rehumanization, separate dialogue first" },
  { stage: 5, name: "Loss of face", description: "Public attacks on character/identity", intervention: "Mediation — neutral third party required" },
  { stage: 6, name: "Strategies of threats", description: "Ultimatums, coercive power deployed", intervention: "Conciliation, de-power dynamics" },
  { stage: 7, name: "Limited destruction", description: "Accepting own losses to damage other", intervention: "Arbitration with binding decision" },
  { stage: 8, name: "Fragmentation", description: "Destruction of opponent's power base", intervention: "Power intervention, separation of parties" },
  { stage: 9, name: "Together into the abyss", description: "Total confrontation, mutual destruction accepted", intervention: "Imposed separation, legal/state intervention" },
];

export function detectEscalationLevel(text: string): number {
  let totalSeverity = 0;
  for (const trigger of ESCALATION_TRIGGERS) {
    if (trigger.pattern.test(text)) {
      totalSeverity += trigger.severity;
    }
  }
  return Math.min(100, totalSeverity * 10);
}

// ── Cognitive Distortions (Argyris-inspired) ──
export const COGNITIVE_DISTORTIONS = [
  {
    name: "Fundamental Attribution Error",
    description: "Attributing other's behavior to character rather than situation",
    indicator: "They did X because they're [character judgment]",
    intervention: "What circumstances might have led to that behavior?",
  },
  {
    name: "Confirmation Bias",
    description: "Seeking only evidence that confirms existing beliefs about the other party",
    indicator: "See? This proves they always...",
    intervention: "What evidence might point in a different direction?",
  },
  {
    name: "Zero-Sum Thinking",
    description: "Assuming any gain for the other party is a loss for self",
    indicator: "If they get X, I lose",
    intervention: "What if both of you could get what matters most?",
  },
  {
    name: "Reactive Devaluation",
    description: "Dismissing proposals simply because the other party made them",
    indicator: "They only suggested that because...",
    intervention: "If a neutral third party had suggested this, how would you evaluate it?",
  },
  {
    name: "Loss Aversion",
    description: "Losses feel ~2x more painful than equivalent gains feel good",
    indicator: "I can't give up X (even when gaining Y > X)",
    intervention: "Reframe: what are you GAINING, not just what you're giving up?",
  },
  {
    name: "Anchoring",
    description: "First offer/number disproportionately shapes the negotiation range",
    indicator: "But they said X first, so...",
    intervention: "Let's step back from that number and look at what the objective criteria suggest",
  },
];

// ── Glasl Stage Detection ──
export function detectGlaslStage(indicators: {
  personalAttacks: boolean;
  coalitionBuilding: boolean;
  threats: boolean;
  lossOfFace: boolean;
  destructiveBehavior: boolean;
  empathyPresent: boolean;
  dialogueWillingness: boolean;
}): { stage: number; intervention: string } {
  if (indicators.destructiveBehavior) return { stage: 7, intervention: "Arbitration required" };
  if (indicators.threats) return { stage: 6, intervention: "Conciliation, de-power" };
  if (indicators.lossOfFace) return { stage: 5, intervention: "Formal mediation required" };
  if (indicators.coalitionBuilding) return { stage: 4, intervention: "Rehumanization, separate dialogue" };
  if (indicators.personalAttacks && !indicators.empathyPresent) return { stage: 3, intervention: "Reality testing, reframing" };
  if (!indicators.empathyPresent && indicators.dialogueWillingness) return { stage: 2, intervention: "Structured dialogue" };
  return { stage: 1, intervention: "Preventive dialogue, joint problem-solving" };
}
