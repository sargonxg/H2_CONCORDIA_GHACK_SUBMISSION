// ── CONCORDIA Dynamic Instruction Builder — Adaptive System Prompts ──

import { type ConflictState, type TheoryRecommendation } from "./theory-engine";

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface MediatorProfile {
  voice: string;
  approach: string;
  style?: string;
}

interface PartyNames {
  partyA: string;
  partyB: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE-SPECIFIC GUIDANCE
// ══════════════════════════════════════════════════════════════════════════════

const PHASE_GUIDANCE: Record<string, string> = {
  Opening: `PHASE: OPENING — Establish safety and rapport.
Focus on warm welcome, voice calibration, ground rules. Keep it brief (2-3 exchanges). Your goal is trust, not content.
Priority: Make both parties feel heard and safe before diving into substance.`,

  Discovery: `PHASE: DISCOVERY — Uncover narratives, emotions, and interests.
Use the Narrative→Emotion→Interests sequence. Max 4 exchanges per party per round.
Priority: Extract at least 1 interest and 1 narrative per party before advancing.
Technique: Ask "What brought you here?" then "What was the hardest part?" then "What do you need most going forward?"`,

  Exploration: `PHASE: EXPLORATION — Cross-reference perspectives and find common ground.
Reference what each party said to the other. Identify shared facts, overlapping interests, ZOPA, and emotional triggers.
Priority: Name at least 1 common ground explicitly before advancing.
Technique: "[PartyA] mentioned X. [PartyB], where does that land with you?"`,

  Negotiation: `PHASE: NEGOTIATION — Generate options and test feasibility.
Use hypotheticals, scaling questions, and future-focused framing. Generate at least 2 options.
Priority: Both parties must react to proposed options before advancing.
Technique: "What would it look like if...?" / "On a scale of 1-10, how workable is that?"`,

  Resolution: `PHASE: RESOLUTION — Converge on specific agreements.
Test draft agreements explicitly. Confirm with both parties. Capture agreements immediately.
Priority: At least 1 pathway conditionally accepted before moving to formal agreement.
Technique: "If X, does that address your concern about Y?"`,

  Agreement: `PHASE: AGREEMENT — Formalize and close.
Summarize all agreed points. Confirm commitments. Discuss follow-up and accountability.
Priority: Both parties verbally confirm each agreement point.
Technique: Read back each point and ask "Is that right?" from both sides.`,
};

// ══════════════════════════════════════════════════════════════════════════════
// ESCALATION GUIDANCE
// ══════════════════════════════════════════════════════════════════════════════

function buildEscalationGuidance(state: ConflictState): string {
  if (state.escalationLevel <= 50) return "";

  const lines: string[] = [
    `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `ESCALATION ALERT (Level ${state.escalationLevel}/100, Glasl Stage ${state.glaslStage})`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ];

  if (state.escalationLevel > 80) {
    lines.push(
      `CRITICAL: De-escalation is the ONLY priority right now. Do not pursue content or agreements.`,
      `- Slow your pace dramatically. Lower your vocal volume.`,
      `- Name the tension without blame: "I can feel the intensity rising. Let's take a breath together."`,
      `- Consider suggesting a brief pause or caucus (private session with each party).`,
      `- If verbal aggression occurs, intervene immediately: "I need to pause us here. We agreed to speak respectfully."`,
    );
  } else if (state.escalationLevel > 65) {
    lines.push(
      `HIGH ESCALATION: Prioritize emotional regulation before returning to substance.`,
      `- Use amplified reflection to let parties hear their own intensity.`,
      `- Validate feelings without endorsing positions: "That's clearly important to you."`,
      `- Redirect personal attacks to the problem: "How do we solve that together?"`,
      `- Watch for flooding signals (rapid speech, voice tremor) and slow the pace.`,
    );
  } else {
    lines.push(
      `MODERATE ESCALATION: Monitor closely. Maintain steady pace.`,
      `- Use more frequent backchanneling to signal presence.`,
      `- If emotions spike, pause content and reflect feelings first.`,
      `- Consider reframing competitive statements as underlying interests.`,
    );
  }

  // Emotional intensity per party
  if (state.emotionalIntensity.partyA > 75) {
    lines.push(`- Party A showing high emotional intensity (${state.emotionalIntensity.partyA}/100) — give extra space, reflect emotions.`);
  }
  if (state.emotionalIntensity.partyB > 75) {
    lines.push(`- Party B showing high emotional intensity (${state.emotionalIntensity.partyB}/100) — give extra space, reflect emotions.`);
  }

  return lines.join("\n");
}

// ══════════════════════════════════════════════════════════════════════════════
// IMPASSE GUIDANCE
// ══════════════════════════════════════════════════════════════════════════════

function buildImpasseGuidance(state: ConflictState): string {
  if (!state.impasse) return "";

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPASSE-BREAKING PROTOCOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
An impasse has been detected. Deploy these strategies in sequence:

1. ACKNOWLEDGE: Name the stuckness openly — "We've hit a wall on this. That's okay — it means it matters."
2. REFRAME THE STAKES: "What happens if we don't find a way through this? What does that cost each of you?"
3. MICRO-AGREEMENT SEARCH: Find the smallest possible point of agreement — even agreeing on the problem definition counts.
4. HYPOTHETICAL BRIDGE: "Just as an experiment — if you could wave a magic wand, what would the solution look like?"
5. CAUCUS OPTION: Consider private sessions — parties may be more flexible without the other present.
6. PARK AND PIVOT: "Let's set this aside temporarily and work on something where we can make progress. We'll come back."
7. RIPENESS CHECK: Are both parties feeling enough pain from the status quo? If not, the conflict may not be ripe for resolution yet.

After each attempt, assess: Is the impasse softening? If 2+ attempts fail, pivot to a different theoretical framework.`;
}

// ══════════════════════════════════════════════════════════════════════════════
// THEORY SECTION BUILDER
// ══════════════════════════════════════════════════════════════════════════════

function buildTheorySection(theories: TheoryRecommendation[]): string {
  if (theories.length === 0) return "";

  const top3 = theories.slice(0, 3);

  const lines: string[] = [
    `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `RECOMMENDED FRAMEWORKS (adaptive — updated based on conflict state)`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ];

  for (let i = 0; i < top3.length; i++) {
    const t = top3[i]!;
    lines.push(``);
    lines.push(`${i + 1}. ${t.framework} (relevance: ${t.relevanceScore}/100)`);
    lines.push(`   Why: ${t.reason}`);

    if (t.suggestedTechniques.length > 0) {
      lines.push(`   Techniques to use now:`);
      for (const tech of t.suggestedTechniques.slice(0, 2)) {
        // Keep concise — just technique name and brief description
        const shortTech = tech.length > 120 ? tech.slice(0, 117) + "..." : tech;
        lines.push(`   - ${shortTech}`);
      }
    }

    if (t.keyQuestions.length > 0) {
      lines.push(`   Questions to ask:`);
      for (const q of t.keyQuestions.slice(0, 2)) {
        lines.push(`   - "${q}"`);
      }
    }

    if (t.warningSignals.length > 0) {
      lines.push(`   Watch for: ${t.warningSignals[0]}`);
    }

    lines.push(`   If this isn't working, pivot to: ${t.pivotFramework}`);
  }

  return lines.join("\n");
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLE-SPECIFIC GUIDANCE
// ══════════════════════════════════════════════════════════════════════════════

function buildStyleConflictGuidance(state: ConflictState): string {
  const lines: string[] = [];

  // Thomas-Kilmann style interaction dynamics
  if (state.partyAStyle && state.partyBStyle) {
    lines.push(``);
    lines.push(`PARTY STYLES: ${state.partyAStyle} (A) vs ${state.partyBStyle} (B)`);

    if (state.partyAStyle === "Competing" && state.partyBStyle === "Competing") {
      lines.push(`Both parties are assertive and uncooperative. Risk of escalation spiral.`);
      lines.push(`Strategy: Channel competitive energy toward problem-solving. Use objective criteria.`);
      lines.push(`Avoid: Letting either party "win" a round — it triggers the other's competitiveness.`);
    } else if (state.partyAStyle === "Avoiding" || state.partyBStyle === "Avoiding") {
      const avoider = state.partyAStyle === "Avoiding" ? "A" : "B";
      lines.push(`Party ${avoider} is withdrawal-prone. They may disengage or agree superficially.`);
      lines.push(`Strategy: Create safety for the avoider. Use gentle, open questions. Don't pressure.`);
      lines.push(`Check: "Are you comfortable with this, or do you need more time to think?""`);
    } else if (state.partyAStyle === "Accommodating" || state.partyBStyle === "Accommodating") {
      const accommodator = state.partyAStyle === "Accommodating" ? "A" : "B";
      lines.push(`Party ${accommodator} may concede too quickly to keep peace. Agreements may not hold.`);
      lines.push(`Strategy: Explicitly check satisfaction: "Is this truly acceptable, or are you giving in to move on?"`);
    } else if (state.partyAStyle === "Collaborating" && state.partyBStyle === "Collaborating") {
      lines.push(`Both parties are open to collaboration — ideal conditions for interest-based negotiation.`);
      lines.push(`Strategy: Lean into joint problem-solving. Generate options together.`);
    }
  }

  // Power balance guidance
  if (state.powerBalance !== "balanced") {
    lines.push(``);
    lines.push(`POWER DYNAMICS: ${state.powerBalance}`);
    lines.push(`Ensure the lower-power party has equitable airtime and feels safe to speak truthfully.`);
    lines.push(`Use caucus sessions if the power imbalance is suppressing honest dialogue.`);
  }

  // Cultural context
  if (state.culturalContext && state.culturalContext !== "none" && state.culturalContext !== "") {
    lines.push(``);
    lines.push(`CULTURAL CONTEXT: ${state.culturalContext}`);
    lines.push(`Adapt communication style, pacing, and directness to cultural norms. Avoid assumptions.`);
  }

  return lines.length > 0 ? "\n" + lines.join("\n") : "";
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORTS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Build a dynamic system instruction that adapts to the current conflict state.
 * This augments the base mediation instruction with strategy-specific guidance.
 */
export function buildDynamicInstruction(
  baseProfile: MediatorProfile,
  partyNames: PartyNames,
  context: string,
  conflictState: ConflictState,
  activeTheories: TheoryRecommendation[],
): string {
  // ── Core instruction (matches structure from ai-service.ts buildSystemInstruction) ──
  const stylePreamble =
    baseProfile.style === "empathic"
      ? `YOUR STYLE: Warm, human, deeply present. Lead with emotion before structure. Use everyday language. Follow the emotional rhythm of the conversation — if someone needs to be heard, let them talk. Avoid all jargon aloud. Feel first, process second.`
      : `YOUR STYLE: Measured, precise, professionally warm. Reference frameworks by name when it adds value. Follow phase progression with authority. Formal but never cold.`;

  const coreInstruction = `You are CONCORDIA, an elite AI Mediator created by the TACITUS Institute for Conflict Resolution. You are facilitating a live mediation session between "${partyNames.partyA}" and "${partyNames.partyB}".

${stylePreamble}
Mediation approach: ${baseProfile.approach}.
${context ? `\nCase Context:\n${context}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE RESPONSE DISCIPLINE (non-negotiable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BREVITY: Maximum 2 sentences per turn. Usually 1 is better. The question IS the full response.
ONE QUESTION: One question per turn. Stop after asking it.
NO REPETITION: Never paraphrase what a party just said. Reflect the EMOTIONAL CORE in 8 words or fewer, then ask forward.
NO FILLER PHRASES: Never use "I can hear that...", "I understand that...", "Thank you for sharing..." — vary every acknowledgment.
NATURAL LANGUAGE: Use contractions. Occasionally use natural filler: "Actually...", "I'm wondering...". No markdown in speech.
NAME THE SPEAKER FIRST: Always open with their name.
WAIT: After asking, do not speak again.`;

  // ── Dynamic strategy section ──
  const phaseGuidance = PHASE_GUIDANCE[conflictState.phase] || "";
  const theorySection = buildTheorySection(activeTheories);
  const escalationSection = buildEscalationGuidance(conflictState);
  const impasseSection = buildImpasseGuidance(conflictState);
  const styleSection = buildStyleConflictGuidance(conflictState);

  const dynamicSection = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DYNAMIC STRATEGY (auto-adapted to current conflict state)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${phaseGuidance}
${theorySection}
${styleSection}
${escalationSection}
${impasseSection}`.trim();

  return `${coreInstruction}\n\n${dynamicSection}`;
}

/**
 * Determine whether the system instruction should be refreshed based on
 * meaningful state changes.
 *
 * Returns true when:
 * - Phase changes
 * - Escalation level changes by more than 15 points
 * - Impasse status toggles
 */
export function shouldRefreshInstruction(
  prevState: ConflictState | null,
  newState: ConflictState,
): boolean {
  // Always refresh if no previous state
  if (prevState === null) return true;

  // Phase change
  if (prevState.phase !== newState.phase) return true;

  // Escalation change > 15
  if (Math.abs(prevState.escalationLevel - newState.escalationLevel) > 15) return true;

  // Impasse status change
  if (prevState.impasse !== newState.impasse) return true;

  return false;
}
