// ── CONCORDIA Theory Engine — Adaptive Framework Selection & Resolution Intelligence ──

import { FRAMEWORKS, type FrameworkEntry } from "./mediation-library";

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface TheoryRecommendation {
  framework: string;
  relevanceScore: number; // 0-100
  reason: string;
  suggestedTechniques: string[];
  keyQuestions: string[];
  warningSignals: string[];
  pivotFramework: string;
}

export interface ConflictState {
  phase: string;
  escalationLevel: number; // 0-100
  glaslStage: number; // 1-9
  conflictType: string; // workplace, commercial, family, community, international, etc.
  partyAStyle: string; // Thomas-Kilmann: Competing, Collaborating, Compromising, Avoiding, Accommodating
  partyBStyle: string;
  powerBalance: string; // "balanced", "A-dominant", "B-dominant", "high-imbalance"
  culturalContext: string;
  impasse: boolean;
  emotionalIntensity: { partyA: number; partyB: number }; // 0-100
}

// ══════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ══════════════════════════════════════════════════════════════════════════════

/** Map framework shortNames / ids to their entry for fast lookup */
function findFramework(nameOrId: string): FrameworkEntry | undefined {
  return FRAMEWORKS.find(
    (fw) =>
      fw.id === nameOrId ||
      fw.shortName === nameOrId ||
      fw.name.toLowerCase().includes(nameOrId.toLowerCase()),
  );
}

/** Parse a glaslStages field into a numeric range { min, max } */
function parseGlaslRange(stages: string | number[]): { min: number; max: number } {
  if (Array.isArray(stages)) {
    return { min: Math.min(...stages), max: Math.max(...stages) };
  }
  if (stages === "all") return { min: 1, max: 9 };
  const parts = stages.split("-").map(Number);
  if (parts.length === 2) return { min: parts[0] ?? 1, max: parts[1] ?? 9 };
  if (parts.length === 1 && !isNaN(parts[0] ?? NaN)) return { min: parts[0] ?? 1, max: parts[0] ?? 9 };
  return { min: 1, max: 9 };
}

/** Check whether a framework's glasl range covers the given stage */
function glaslCovers(fw: FrameworkEntry, stage: number): boolean {
  const { min, max } = parseGlaslRange(fw.glaslStages);
  return stage >= min && stage <= max;
}

/** Determine a pivot framework — the best alternative if the primary isn't working */
function pickPivot(primary: FrameworkEntry, state: ConflictState): string {
  // Pivot to a framework in a different category that still covers the glasl stage
  const candidates = FRAMEWORKS.filter(
    (fw) =>
      fw.id !== primary.id &&
      fw.category !== primary.category &&
      glaslCovers(fw, state.glaslStage),
  );
  if (candidates.length === 0) return "moore"; // Moore's comprehensive model as fallback
  // Prefer transformative pivots for high escalation, negotiation pivots for low
  if (state.escalationLevel > 60) {
    const transformative = candidates.find((c) => c.category === "transformation");
    if (transformative) return transformative.shortName;
  }
  return candidates[0]?.shortName ?? "Fisher & Ury";
}

/** Generate warning signals for a given framework and conflict state */
function deriveWarningSignals(fw: FrameworkEntry, state: ConflictState): string[] {
  const signals: string[] = [];

  if (state.escalationLevel > 70) {
    signals.push("Escalation critically high — monitor for verbal aggression or walkout threats");
  }
  if (state.impasse) {
    signals.push("Active impasse detected — current approach may need pivoting");
  }
  if (state.emotionalIntensity.partyA > 80 || state.emotionalIntensity.partyB > 80) {
    signals.push("Extreme emotional intensity — prioritize de-escalation before content");
  }
  if (state.partyAStyle === "Competing" && state.partyBStyle === "Competing") {
    signals.push("Both parties in competitive mode — risk of mutual destruction spiral");
  }
  if (
    state.powerBalance === "high-imbalance" ||
    state.powerBalance === "A-dominant" ||
    state.powerBalance === "B-dominant"
  ) {
    signals.push("Power imbalance may suppress weaker party's voice — ensure equitable airtime");
  }

  // Add framework-specific limitations as warning signals
  if (fw.limitations.length > 0) {
    signals.push(fw.limitations[0]!);
  }

  return signals;
}

// ══════════════════════════════════════════════════════════════════════════════
// FRAMEWORK IDS BY CATEGORY (for rule matching)
// ══════════════════════════════════════════════════════════════════════════════

const FRAMEWORK_RULES: {
  condition: (state: ConflictState) => boolean;
  frameworkIds: string[];
  baseScore: number;
  reason: string;
}[] = [
  // ── Glasl Stage 1-3: Interest-based & Solution-Focused ──
  {
    condition: (s) => s.glaslStage >= 1 && s.glaslStage <= 3,
    frameworkIds: ["fisher-ury", "solution-focused"],
    baseScore: 90,
    reason: "Early-stage conflict (Glasl 1-3) — interest-based and solution-focused approaches are most effective",
  },
  // ── Glasl Stage 4-6: Transformative, Narrative, Double-Loop ──
  {
    condition: (s) => s.glaslStage >= 4 && s.glaslStage <= 6,
    frameworkIds: ["bush-folger", "winslade-monk", "argyris"],
    baseScore: 90,
    reason: "Mid-stage escalation (Glasl 4-6) — transformative, narrative, and reflective approaches needed",
  },
  // ── Glasl Stage 7-9: Ripeness & Structural Violence ──
  {
    condition: (s) => s.glaslStage >= 7 && s.glaslStage <= 9,
    frameworkIds: ["zartman", "galtung"],
    baseScore: 90,
    reason: "Severe escalation (Glasl 7-9) — ripeness theory and structural peace-building required",
  },
  // ── High power imbalance ──
  {
    condition: (s) =>
      s.powerBalance === "high-imbalance" ||
      s.powerBalance === "A-dominant" ||
      s.powerBalance === "B-dominant",
    frameworkIds: ["follett-integration", "shapiro-identity"],
    baseScore: 20, // boost amount
    reason: "Power imbalance detected — integrative and identity-based approaches help level the field",
  },
  // ── Commercial / contractual ──
  {
    condition: (s) =>
      s.conflictType === "commercial" || s.conflictType === "contractual",
    frameworkIds: ["fisher-ury", "mnookin-beyond-winning"],
    baseScore: 15, // boost
    reason: "Commercial/contractual dispute — principled negotiation and tension management frameworks are well-suited",
  },
  // ── Family ──
  {
    condition: (s) => s.conflictType === "family",
    frameworkIds: ["bush-folger", "rosenberg-nvc", "stone-difficult-conversations"],
    baseScore: 15, // boost
    reason: "Family conflict — transformative, NVC, and difficult conversations approaches address relational depth",
  },
  // ── Impasse ──
  {
    condition: (s) => s.impasse,
    frameworkIds: ["coleman", "zartman", "solution-focused"],
    baseScore: 25, // boost
    reason: "Impasse detected — intractable conflict theory, ripeness, and solution-focused approaches for breakthrough",
  },
  // ── Both parties Competing ──
  {
    condition: (s) => s.partyAStyle === "Competing" && s.partyBStyle === "Competing",
    frameworkIds: ["deutsch", "ury-brett-goldberg"],
    baseScore: 20, // boost
    reason: "Both parties in competitive mode — cooperation theory and dispute systems design needed",
  },
  // ── One Avoiding + one Competing ──
  {
    condition: (s) =>
      (s.partyAStyle === "Avoiding" && s.partyBStyle === "Competing") ||
      (s.partyAStyle === "Competing" && s.partyBStyle === "Avoiding"),
    frameworkIds: ["pruitt-kim"],
    baseScore: 20, // boost
    reason: "Competing-Avoiding dynamic — Dual Concern model maps asymmetric styles to productive strategies",
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORTS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Select the most relevant conflict resolution frameworks based on current conflict state.
 * Returns top 3-5 recommendations sorted by relevance score.
 */
export function selectFrameworks(conflictState: ConflictState): TheoryRecommendation[] {
  // Accumulate scores per framework id
  const scores = new Map<string, { score: number; reasons: string[] }>();

  // Initialize all frameworks with a base Glasl-coverage score
  for (const fw of FRAMEWORKS) {
    const glaslMatch = glaslCovers(fw, conflictState.glaslStage);
    scores.set(fw.id, {
      score: glaslMatch ? 30 : 0,
      reasons: glaslMatch ? [`Covers Glasl stage ${conflictState.glaslStage}`] : [],
    });
  }

  // Apply rule-based scoring
  for (const rule of FRAMEWORK_RULES) {
    if (!rule.condition(conflictState)) continue;

    for (const fwId of rule.frameworkIds) {
      const entry = scores.get(fwId);
      if (!entry) continue;

      // Glasl stage rules (1-3, 4-6, 7-9) set high base scores
      // Other rules act as boosts
      const isGlaslRule =
        rule.reason.includes("Glasl 1-3") ||
        rule.reason.includes("Glasl 4-6") ||
        rule.reason.includes("Glasl 7-9");

      if (isGlaslRule) {
        entry.score = Math.max(entry.score, rule.baseScore);
      } else {
        entry.score += rule.baseScore;
      }
      entry.reasons.push(rule.reason);
    }
  }

  // Phase affinity bonus
  const phaseBonus: Record<string, string[]> = {
    Opening: ["active-listening", "moore"],
    Discovery: ["fisher-ury", "rosenberg-nvc", "active-listening", "mayer"],
    Exploration: ["bush-folger", "winslade-monk", "reframing", "deutsch"],
    Negotiation: ["fisher-ury", "mnookin-beyond-winning", "batna-protocol", "schelling"],
    Resolution: ["solution-focused", "collaborative-law", "interest-based-relational"],
    Agreement: ["fisher-ury", "collaborative-law"],
  };
  const phaseIds = phaseBonus[conflictState.phase] || [];
  for (const fwId of phaseIds) {
    const entry = scores.get(fwId);
    if (entry) {
      entry.score += 10;
      entry.reasons.push(`Well-suited for ${conflictState.phase} phase`);
    }
  }

  // High emotional intensity bonus for emotion-oriented frameworks
  const avgEmotion =
    (conflictState.emotionalIntensity.partyA + conflictState.emotionalIntensity.partyB) / 2;
  if (avgEmotion > 60) {
    const emotionFws = ["rosenberg-nvc", "gottman", "shapiro-identity", "de-escalation"];
    for (const fwId of emotionFws) {
      const entry = scores.get(fwId);
      if (entry) {
        entry.score += 10;
        entry.reasons.push("High emotional intensity — emotion-aware framework valuable");
      }
    }
  }

  // Build sorted list and take top 5
  const sorted = Array.from(scores.entries())
    .map(([id, { score, reasons }]) => ({ id, score: Math.min(score, 100), reasons }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Filter to only those with score > 0 and ensure at least 3
  const filtered = sorted.filter((s) => s.score > 0);
  const results = filtered.length >= 3 ? filtered : sorted.slice(0, 3);

  // Build recommendations
  return results.map(({ id, score, reasons }) => {
    const fw = FRAMEWORKS.find((f) => f.id === id);
    if (!fw) {
      // Shouldn't happen, but handle gracefully
      return {
        framework: id,
        relevanceScore: score,
        reason: reasons.join("; "),
        suggestedTechniques: [],
        keyQuestions: [],
        warningSignals: [],
        pivotFramework: "moore",
      };
    }

    return {
      framework: fw.shortName,
      relevanceScore: score,
      reason: reasons.join("; "),
      suggestedTechniques: fw.keyTechniques.slice(0, 3).map((t) => `${t.name}: ${t.description}`),
      keyQuestions: fw.diagnosticQuestions.slice(0, 3),
      warningSignals: deriveWarningSignals(fw, conflictState),
      pivotFramework: pickPivot(fw, conflictState),
    };
  });
}

/**
 * Calculate the probability (0-100) that the current mediation will reach resolution,
 * based on observable session metrics.
 */
export function calculateResolutionProbability(state: {
  commonGroundCount: number;
  tensionPointCount: number;
  agreementCount: number;
  escalationLevel: number;
  cooperativenessA: number;
  cooperativenessB: number;
  phase: string;
  impasses: number;
  changeTalkCount: number;
  sustainTalkCount: number;
}): number {
  let probability = 50;

  // Common ground: +5 per item, capped at +25
  probability += Math.min(state.commonGroundCount * 5, 25);

  // Tension points: -3 per item, capped at -20
  probability -= Math.min(state.tensionPointCount * 3, 20);

  // Agreements: +10 per item, capped at +30
  probability += Math.min(state.agreementCount * 10, 30);

  // Escalation penalty: -(escalationLevel / 10) * 15
  probability -= (state.escalationLevel / 10) * 15;

  // Cooperativeness bonus: average of both / 4
  probability += (state.cooperativenessA + state.cooperativenessB) / 4;

  // Phase bonuses
  const phaseBonuses: Record<string, number> = {
    Agreement: 15,
    Resolution: 10,
    Negotiation: 5,
  };
  probability += phaseBonuses[state.phase] || 0;

  // Impasse penalty: -8 per impasse
  probability -= state.impasses * 8;

  // Change talk vs sustain talk: +2 per net change talk
  probability += (state.changeTalkCount - state.sustainTalkCount) * 2;

  // Clamp to 0-100
  return Math.round(Math.max(0, Math.min(100, probability)));
}
