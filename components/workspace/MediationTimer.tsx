"use client";

import { Timer } from "lucide-react";
import { phaseColor } from "@/lib/design-system";

interface MediationTimerProps {
  startTime: number; // timestamp (Date.now())
  sessionDuration: number; // seconds elapsed
  currentPhase: string;
}

export default function MediationTimer({ startTime, sessionDuration, currentPhase }: MediationTimerProps) {
  const hours = Math.floor(sessionDuration / 3600);
  const minutes = Math.floor((sessionDuration % 3600) / 60);
  const seconds = sessionDuration % 60;

  const formatted = hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const color = phaseColor(currentPhase);

  return (
    <div className="flex items-center gap-2">
      <Timer className="w-4 h-4 text-[var(--color-text-muted)]" />
      <span className="text-sm font-mono font-bold text-white tabular-nums">
        {formatted}
      </span>
      <span
        className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md"
        style={{
          color,
          backgroundColor: `${color}15`,
          borderWidth: 1,
          borderColor: `${color}30`,
        }}
      >
        {currentPhase}
      </span>
    </div>
  );
}
