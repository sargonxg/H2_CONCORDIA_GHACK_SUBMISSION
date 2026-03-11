"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Brain,
  BookOpen,
  Search,
  AlertTriangle,
  X,
  Clock,
  CheckCircle2,
  Activity,
  Circle,
  Zap,
} from "lucide-react";
import type { LiveMediationState, GapNotification, EscalationFlag } from "@/lib/types";

const PHASES = ["Opening", "Discovery", "Exploration", "Negotiation", "Resolution", "Agreement"];

interface Props {
  liveMediationState: LiveMediationState | null;
  gapNotifications: GapNotification[];
  setGapNotifications: (updater: (prev: GapNotification[]) => GapNotification[]) => void;
  status: string;
  isRecording: boolean;
  escalationBanner: EscalationFlag | null;
  setEscalationBanner: (v: EscalationFlag | null) => void;
  sessionToast: string | null;
  setSessionToast: (v: string | null) => void;
  healthScore: number;
  onOpenGraph: () => void;
  extractionNotice: boolean;
}

export default function LiveStatusBar({
  liveMediationState,
  gapNotifications,
  setGapNotifications,
  status,
  isRecording,
  escalationBanner,
  setEscalationBanner,
  sessionToast,
  setSessionToast,
  healthScore,
  onOpenGraph,
  extractionNotice,
}: Props) {
  const currentPhaseIdx = PHASES.indexOf(liveMediationState?.phase || "Opening");

  return (
    <div className="flex flex-col gap-2 overflow-y-auto p-3">
      {/* Phase progress bar */}
      {(isRecording || liveMediationState) && (
        <div className="flex items-center gap-1 shrink-0">
          {PHASES.map((phase, idx) => (
            <div key={phase} className="flex items-center flex-1">
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider transition-all ${
                  idx === currentPhaseIdx
                    ? "bg-[var(--color-accent)] text-white shadow-md"
                    : idx < currentPhaseIdx
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                }`}
              >
                {idx < currentPhaseIdx ? (
                  <CheckCircle2 className="w-2.5 h-2.5" />
                ) : idx === currentPhaseIdx ? (
                  <Activity className="w-2.5 h-2.5 animate-pulse" />
                ) : (
                  <Circle className="w-2.5 h-2.5" />
                )}
                <span className="hidden sm:inline">{phase}</span>
              </div>
              {idx < PHASES.length - 1 && (
                <div
                  className={`flex-1 h-px mx-0.5 ${
                    idx < currentPhaseIdx ? "bg-emerald-500/30" : "bg-[var(--color-border)]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mediator action banner */}
      <AnimatePresence>
        {isRecording && liveMediationState && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20 rounded-lg flex items-center gap-3"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center shrink-0">
              <Brain className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-mono uppercase text-[var(--color-accent)]">Focus</span>
                {liveMediationState.currentAction.match(/\[([^\]]+)\]/) && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 text-violet-400 font-mono">
                    <BookOpen className="w-2 h-2 inline mr-0.5" />
                    {liveMediationState.currentAction.match(/\[([^\]]+)\]/)?.[1]}
                  </span>
                )}
              </div>
              <p className="text-xs text-white truncate">
                {liveMediationState.currentAction.replace(/^\[[^\]]+\]\s*/, "")}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-[9px] text-[var(--color-text-muted)]">→ </span>
              <span className="text-xs font-bold text-white">{liveMediationState.targetActor}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Common ground + tension points */}
      {liveMediationState && (
        <div className="grid grid-cols-2 gap-2 shrink-0">
          {liveMediationState.commonGround.length > 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2">
              <div className="text-[9px] font-mono uppercase text-emerald-400 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Common Ground
              </div>
              {liveMediationState.commonGround.slice(0, 3).map((item, i) => (
                <p key={i} className="text-[10px] text-emerald-100 truncate">{item}</p>
              ))}
            </div>
          )}
          {liveMediationState.tensionPoints.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2">
              <div className="text-[9px] font-mono uppercase text-red-400 mb-1 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> Tensions
              </div>
              {liveMediationState.tensionPoints.slice(0, 3).map((item, i) => (
                <p key={i} className="text-[10px] text-red-100 truncate">{item}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gap notifications */}
      <AnimatePresence>
        {gapNotifications
          .filter((n) => !n.dismissed)
          .slice(0, 2)
          .map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-2.5 rounded-lg border flex items-start gap-2 shrink-0 ${
                notif.priority === "critical"
                  ? "bg-red-500/5 border-red-500/20"
                  : notif.priority === "important"
                  ? "bg-amber-500/5 border-amber-500/20"
                  : "bg-[var(--color-surface)] border-[var(--color-border)]"
              }`}
            >
              <Search
                className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                  notif.priority === "critical"
                    ? "text-red-400"
                    : notif.priority === "important"
                    ? "text-amber-400"
                    : "text-[var(--color-text-muted)]"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-white mb-0.5">{notif.description}</p>
                <p className="text-[10px] text-[var(--color-accent)] italic truncate">
                  &ldquo;{notif.suggestedQuestion}&rdquo;
                </p>
              </div>
              <button
                onClick={() =>
                  setGapNotifications((prev) =>
                    prev.map((n) => (n.id === notif.id ? { ...n, dismissed: true } : n)),
                  )
                }
                className="text-[var(--color-text-muted)] hover:text-white transition-colors shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Escalation banner */}
      <AnimatePresence>
        {escalationBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-2.5 rounded-lg border border-red-500/40 bg-red-500/10 flex items-start gap-2 shrink-0"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white mb-0.5">{escalationBanner.trigger}</p>
              <p className="text-[10px] text-emerald-400 italic">{escalationBanner.deEscalationTechnique}</p>
            </div>
            <button
              onClick={() => setEscalationBanner(null)}
              className="text-red-400/60 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session toast */}
      <AnimatePresence>
        {sessionToast && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xs text-indigo-200 shrink-0"
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {sessionToast}
            <button onClick={() => setSessionToast(null)} className="ml-auto text-indigo-400 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Low health warning */}
      {healthScore < 50 && healthScore > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-lg shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <p className="text-[10px] text-amber-200 flex-1">
            Ontology coverage {healthScore}% —{" "}
            <button className="underline font-semibold" onClick={onOpenGraph}>
              view graph
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
