"use client";

import React from "react";
import { AlertTriangle, Shield, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { EscalationFlag } from "@/lib/types";

type SeverityLevel = "low" | "medium" | "high" | "crisis";

const SEVERITY_CONFIG: Record<
  SeverityLevel,
  { color: string; bg: string; border: string; label: string }
> = {
  low: {
    color: "#FBBF24",
    bg: "rgba(251,191,36,0.1)",
    border: "rgba(251,191,36,0.25)",
    label: "Low",
  },
  medium: {
    color: "#F97316",
    bg: "rgba(249,115,22,0.1)",
    border: "rgba(249,115,22,0.25)",
    label: "Medium",
  },
  high: {
    color: "#EF4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.25)",
    label: "High",
  },
  crisis: {
    color: "#DC2626",
    bg: "rgba(220,38,38,0.1)",
    border: "rgba(220,38,38,0.25)",
    label: "Crisis",
  },
};

function getSeverityLevel(severity: number): SeverityLevel {
  if (severity <= 3) return "low";
  if (severity <= 5) return "medium";
  if (severity <= 7) return "high";
  return "crisis";
}

function parseGlaslStage(category: string): string | null {
  const match = category.match(/[Gg]lasl\s*(?:stage\s*)?(\d+)/i);
  if (match) return `Glasl Stage ${match[1]}`;
  const stageMatch = category.match(/[Ss]tage\s*(\d+)/);
  if (stageMatch) return `Glasl Stage ${stageMatch[1]}`;
  return null;
}

interface EscalationAlertProps {
  flag: EscalationFlag | null;
  onDismiss: () => void;
  onDeEscalate: () => void;
}

function EscalationAlert({ flag, onDismiss, onDeEscalate }: EscalationAlertProps) {
  return (
    <AnimatePresence>
      {flag && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="rounded-xl p-3"
          style={{
            backgroundColor: SEVERITY_CONFIG[getSeverityLevel(flag.severity)].bg,
            border: `1px solid ${SEVERITY_CONFIG[getSeverityLevel(flag.severity)].border}`,
          }}
        >
          {(() => {
            const level = getSeverityLevel(flag.severity);
            const config = SEVERITY_CONFIG[level];
            const glaslStage = parseGlaslStage(flag.category);

            return (
              <div className="flex items-start gap-2.5">
                {/* Icon */}
                <AlertTriangle
                  className="w-5 h-5 shrink-0 mt-0.5"
                  style={{ color: config.color }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Header: severity badge + Glasl pill */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        color: config.color,
                        backgroundColor: config.bg,
                        border: `1px solid ${config.border}`,
                      }}
                    >
                      {config.label}
                    </span>
                    {glaslStage && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-[var(--color-text-muted)] bg-[var(--color-surface-hover)] border border-[var(--color-border)]">
                        {glaslStage}
                      </span>
                    )}
                  </div>

                  {/* Trigger text */}
                  <p className="text-sm text-[var(--color-text)] leading-snug">
                    {flag.trigger}
                  </p>

                  {/* Suggested technique */}
                  {flag.deEscalationTechnique && (
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                      <span className="font-medium text-[var(--color-text-secondary)]">
                        Suggested:{" "}
                      </span>
                      {flag.deEscalationTechnique}
                    </p>
                  )}

                  {/* De-escalate button */}
                  <button
                    onClick={onDeEscalate}
                    className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    De-escalate
                  </button>
                </div>

                {/* Dismiss X */}
                <button
                  onClick={onDismiss}
                  className="shrink-0 p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default React.memo(EscalationAlert);
