"use client";

import { motion } from "motion/react";
import { BookOpen, HelpCircle, Target, Lightbulb } from "lucide-react";
import { getRelevantFrameworks } from "@/lib/mediation-library";
import type { DiscoveryProgress, GapNotification } from "@/lib/types";

interface Props {
  phase: string;
  discoveryProgress?: DiscoveryProgress;
  gapNotifications: GapNotification[];
  missingPrimitives?: string[];
}

const PHASE_TIPS: Record<string, string[]> = {
  Opening: [
    "Set ground rules: confidentiality, mutual respect, one speaker at a time",
    "Introduce yourself, the process, and your role as mediator",
    "Invite both parties to confirm their willingness to engage",
  ],
  Discovery: [
    "Ask each party to tell their story without interruption",
    "Use open questions: 'What happened?', 'How did that affect you?'",
    "Listen for interests behind positions — ask 'why?' three times",
    "Acknowledge emotions before addressing content",
  ],
  Exploration: [
    "Reframe positions into interests: 'It sounds like what you need is...'",
    "Identify shared concerns and underlying needs",
    "Use the 'What if...' opener to test options without commitment",
    "Build a list of issues to address — separate them from people",
  ],
  Negotiation: [
    "Invite option generation: 'What would help move this forward?'",
    "Apply objective criteria to evaluate options",
    "Look for package deals — trade across multiple issues",
    "Test feasibility: 'Could you live with that if they did X?'",
  ],
  Resolution: [
    "Draft agreement language using parties' own words",
    "Check each term against both parties' key interests",
    "Address implementation: who, what, when, how verified?",
    "Build in review mechanisms for complex agreements",
  ],
  Agreement: [
    "Read back the full agreement for confirmation",
    "Thank both parties for their engagement",
    "Arrange follow-up or monitoring if needed",
    "Summarize next steps clearly",
  ],
};

export default function MediatorPlaybook({
  phase,
  discoveryProgress,
  gapNotifications,
  missingPrimitives,
}: Props) {
  const tips = PHASE_TIPS[phase] || PHASE_TIPS["Opening"];
  const relevantFrameworks = getRelevantFrameworks({
    phase,
    missingPrimitives,
  }).slice(0, 3);

  const activeGaps = gapNotifications.filter((n) => !n.dismissed).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Phase tips */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-accent)] mb-3 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" /> {phase} Phase — Mediator Focus
        </h3>
        <ul className="space-y-2">
          {tips.map((tip, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-2 text-xs text-white"
            >
              <span className="text-[var(--color-accent)] mt-0.5 shrink-0">▸</span>
              {tip}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Discovery progress */}
      {discoveryProgress && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-sky-400 mb-3 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" /> Discovery Progress
          </h3>
          {(["partyA", "partyB"] as const).map((party) => {
            const complete =
              party === "partyA"
                ? discoveryProgress.partyARoundsComplete
                : discoveryProgress.partyBRoundsComplete;
            const rounds = ["narrative", "emotion", "interests"];
            return (
              <div key={party} className="mb-2">
                <div className="text-[10px] text-[var(--color-text-muted)] mb-1 capitalize">
                  {party === "partyA" ? "Party A" : "Party B"}
                </div>
                <div className="flex gap-1">
                  {rounds.map((r) => (
                    <span
                      key={r}
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        complete.includes(r)
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Relevant frameworks */}
      {relevantFrameworks.length > 0 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-violet-400 mb-3 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Recommended Frameworks
          </h3>
          <div className="space-y-2">
            {relevantFrameworks.map((fw) => (
              <div key={fw.id} className="border border-[var(--color-border)] rounded-lg p-2.5">
                <p className="text-xs font-semibold text-white mb-1">{fw.shortName}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] leading-snug">
                  {fw.corePrinciples[0]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested questions from gaps */}
      {activeGaps.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> Suggested Questions
          </h3>
          <ul className="space-y-2">
            {activeGaps.map((gap) => (
              <li key={gap.id} className="text-xs text-amber-100 italic">
                &ldquo;{gap.suggestedQuestion}&rdquo;
                <span className="block text-[9px] text-amber-400/60 not-italic mt-0.5">
                  → {gap.targetParty}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
