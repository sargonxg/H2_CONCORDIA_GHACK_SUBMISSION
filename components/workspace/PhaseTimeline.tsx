"use client";

import { CheckCircle2 } from "lucide-react";
import { phaseColor, cn } from "@/lib/design-system";

const PHASES = [
  "Opening",
  "Discovery",
  "Exploration",
  "Negotiation",
  "Resolution",
  "Agreement",
];

interface PhaseTimelineProps {
  currentPhase: string;
  phaseHistory?: Array<{ phase: string; startTime: string }>;
}

export default function PhaseTimeline({ currentPhase, phaseHistory }: PhaseTimelineProps) {
  const currentIdx = PHASES.indexOf(currentPhase);
  const completedPhases = new Set(phaseHistory?.map((h) => h.phase) ?? []);

  return (
    <div className="flex items-center gap-1 w-full">
      {PHASES.map((phase, idx) => {
        const isCurrent = phase === currentPhase;
        const isComplete = idx < currentIdx || (completedPhases.has(phase) && !isCurrent);
        const color = phaseColor(phase);

        return (
          <div key={phase} className="flex items-center flex-1 min-w-0">
            {/* Phase step */}
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap",
                isCurrent && "animate-phase-glow font-bold",
              )}
              style={{
                color: isCurrent || isComplete ? color : 'var(--color-text-muted)',
                backgroundColor: isCurrent ? `${color}15` : 'transparent',
                borderWidth: isCurrent ? 1 : 0,
                borderColor: isCurrent ? `${color}40` : 'transparent',
                boxShadow: isCurrent ? `0 0 12px ${color}20` : 'none',
              }}
            >
              {isComplete ? (
                <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color }} />
              ) : (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: isCurrent ? color : 'var(--color-border)',
                  }}
                />
              )}
              <span className="hidden sm:inline">{phase}</span>
            </div>

            {/* Connector line (except after last) */}
            {idx < PHASES.length - 1 && (
              <div
                className="flex-1 h-px mx-1"
                style={{
                  backgroundColor: idx < currentIdx ? color : 'var(--color-border)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
