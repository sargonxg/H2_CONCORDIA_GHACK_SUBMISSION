"use client";

import { Mic, Square, MicOff } from "lucide-react";
import { cn } from "@/lib/design-system";

interface AudioControlsProps {
  isConnected: boolean;
  isMuted: boolean;
  isProcessing: boolean;
  isRecording: boolean;
  onToggleMute: () => void;
  onToggleSession: () => void;
  status: string;
}

export default function AudioControls({
  isConnected,
  isMuted,
  isProcessing,
  isRecording,
  onToggleMute,
  onToggleSession,
  status,
}: AudioControlsProps) {
  // Determine ring color based on state
  const ringColor = isConnected
    ? isProcessing
      ? "ring-amber-400"
      : "ring-emerald-400"
    : status === "ERROR"
      ? "ring-red-500"
      : "ring-[var(--color-border)]";

  const bgColor = isRecording
    ? "bg-red-500 hover:bg-red-600"
    : "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]";

  return (
    <div className="flex items-center gap-4">
      {/* Main mic / stop button */}
      <button
        onClick={onToggleSession}
        aria-label={isRecording ? "Stop session" : "Start session"}
        className={cn(
          "relative w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg",
          bgColor,
          isConnected && !isProcessing && "animate-mic-breathe",
          "ring-2 ring-offset-2 ring-offset-[var(--color-bg)]",
          ringColor,
        )}
      >
        {isRecording ? (
          <Square className="w-5 h-5 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Mute toggle — only shown when recording */}
      {isRecording && (
        <button
          onClick={onToggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors border",
            isMuted
              ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
              : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white hover:border-[var(--color-accent)]"
          )}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      )}

      {/* Status text */}
      <div className="text-xs text-[var(--color-text-muted)] font-mono">
        {status === "LIVE" && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        )}
        {status === "CONNECTING" && "Connecting..."}
        {status === "RECONNECTING" && "Reconnecting..."}
        {status === "DEMO" && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            DEMO
          </span>
        )}
        {status === "ANALYZING" && "Analyzing..."}
        {status === "ERROR" && <span className="text-red-400">Error</span>}
      </div>
    </div>
  );
}
