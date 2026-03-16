"use client";

import { SkipForward, Pause, Play, User, Users, UserPlus, FastForward } from "lucide-react";

export type SessionMode = "two-party" | "solo" | "multi-party";

interface Props {
  isRecording: boolean;
  currentPhase: string;
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
  isRecording,
  currentPhase,
  sessionMode,
  onSetSessionMode,
  onSkipPhase,
  onPauseMediator,
  onResumeMediator,
  onSkipToQuestion,
  mediatorPaused,
  partyCount,
  onAddParty,
}: Props) {
  if (!isRecording) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
      {/* Session mode selector */}
      <div className="flex items-center gap-1 border-r border-[var(--color-border)] pr-2 mr-1">
        {[
          { mode: "solo" as SessionMode, icon: User, label: "Solo", tip: "Self-guided conflict resolution" },
          { mode: "two-party" as SessionMode, icon: Users, label: "2-Party", tip: "Standard mediation" },
          { mode: "multi-party" as SessionMode, icon: UserPlus, label: "Multi", tip: "3+ parties" },
        ].map(({ mode, icon: Icon, label, tip }) => (
          <button
            key={mode}
            onClick={() => onSetSessionMode(mode)}
            title={tip}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              sessionMode === mode
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-bg)]"
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
        {sessionMode === "multi-party" && (
          <button
            onClick={onAddParty}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
            title="Add another party"
          >
            <UserPlus className="w-3 h-3" />
            +Party ({partyCount})
          </button>
        )}
      </div>

      {/* Mediator pace controls */}
      <div className="flex items-center gap-1">
        {/* Pause/Resume mediator */}
        <button
          onClick={mediatorPaused ? onResumeMediator : onPauseMediator}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-bg)] transition-colors"
          title={mediatorPaused ? "Resume mediator" : "Pause mediator (mute AI, keep recording)"}
        >
          {mediatorPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          {mediatorPaused ? "Resume" : "Pause AI"}
        </button>

        {/* Skip to next phase */}
        <button
          onClick={onSkipPhase}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-bg)] transition-colors"
          title="Skip to next mediation phase"
        >
          <SkipForward className="w-3 h-3" />
          Skip phase
        </button>

        {/* Ask mediator to move to next question */}
        <button
          onClick={onSkipToQuestion}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-bg)] transition-colors"
          title="Ask mediator to move forward"
        >
          <FastForward className="w-3 h-3" />
          Next Q
        </button>
      </div>
    </div>
  );
}
