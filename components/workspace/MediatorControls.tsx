"use client";

import { SkipForward, Pause, Play, User, Users, UserPlus, FastForward } from "lucide-react";

export type SessionMode = "two-party" | "solo" | "multi-party";

interface Props {
  isRecording: boolean;
  sessionMode: SessionMode;
  onSetSessionMode: (mode: SessionMode) => void;
  onSkipPhase: () => void;
  onPauseMediator: () => void;
  onResumeMediator: () => void;
  onSkipToQuestion: () => void;
  mediatorPaused: boolean;
  partyCount: number;
  onAddParty: () => void;
}

export default function MediatorControls({
  isRecording, sessionMode, onSetSessionMode,
  onSkipPhase, onPauseMediator, onResumeMediator, onSkipToQuestion,
  mediatorPaused, partyCount, onAddParty,
}: Props) {
  if (!isRecording) return null;

  const modes: { mode: SessionMode; icon: any; label: string; tip: string }[] = [
    { mode: "solo", icon: User, label: "Solo", tip: "Self-guided conflict resolution" },
    { mode: "two-party", icon: Users, label: "2-Party", tip: "Standard mediation" },
    { mode: "multi-party", icon: UserPlus, label: "Multi", tip: "3+ parties" },
  ];

  const actions = [
    { onClick: mediatorPaused ? onResumeMediator : onPauseMediator, icon: mediatorPaused ? Play : Pause, label: mediatorPaused ? "Resume" : "Pause AI", tip: mediatorPaused ? "Resume mediator" : "Pause mediator (mute AI, keep recording)" },
    { onClick: onSkipPhase, icon: SkipForward, label: "Skip phase", tip: "Skip to next mediation phase" },
    { onClick: onSkipToQuestion, icon: FastForward, label: "Next Q", tip: "Ask mediator to move forward" },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Mode selector */}
      <div className="flex items-center gap-1 border border-[var(--color-border)] rounded-lg p-0.5">
        {modes.map(({ mode, icon: Icon, label, tip }) => (
          <button key={mode} onClick={() => onSetSessionMode(mode)} title={tip}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
              sessionMode === mode ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-muted)] hover:text-white"
            }`}>
            <Icon className="w-3 h-3" />{label}
          </button>
        ))}
      </div>

      {sessionMode === "multi-party" && (
        <button onClick={onAddParty} title="Add another party"
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-[var(--color-accent)] border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/10 transition-colors">
          <UserPlus className="w-3 h-3" />+Party ({partyCount})
        </button>
      )}

      <div className="w-px h-5 bg-[var(--color-border)]" />

      {/* Action buttons */}
      {actions.map(({ onClick, icon: Icon, label, tip }) => (
        <button key={label} onClick={onClick} title={tip}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface)] border border-transparent hover:border-[var(--color-border)] transition-colors">
          <Icon className="w-3 h-3" />{label}
        </button>
      ))}
    </div>
  );
}
