"use client";

import { motion, AnimatePresence } from "motion/react";
import { Volume2, Mic, Clock, Loader2, MicOff } from "lucide-react";

export type MediatorState = "speaking" | "listening" | "waiting" | "processing" | "idle";

interface Props {
  state: MediatorState;
  targetParty: string;
  secondsWaiting?: number;
}

const CONFIG: Record<MediatorState, {
  icon: any; getLabel: (p: string) => string; hint?: (p: string, s: number) => string | null;
  color: string; bgClass: string;
}> = {
  speaking: {
    icon: Volume2,
    getLabel: () => "CONCORDIA is speaking",
    color: "#5B8AF5",
    bgClass: "bg-blue-500/8 border-blue-500/25",
  },
  listening: {
    icon: Mic,
    getLabel: (p) => `Listening to ${p}`,
    hint: () => "Speak naturally — the mediator is listening",
    color: "#4ECDC4",
    bgClass: "bg-teal-500/8 border-teal-500/25",
  },
  waiting: {
    icon: Clock,
    getLabel: (p) => `Your turn, ${p}`,
    hint: (p, s) => {
      if (s < 5) return "Take your time — speak whenever you're ready";
      if (s < 15) return `The mediator is patiently waiting for ${p}`;
      if (s < 30) return "No rush — you can also type your response below";
      return "Still here whenever you're ready. Take all the time you need.";
    },
    color: "#FBBF24",
    bgClass: "bg-amber-500/8 border-amber-500/25",
  },
  processing: {
    icon: Loader2,
    getLabel: () => "Analyzing what was said",
    color: "#A78BFA",
    bgClass: "bg-purple-500/8 border-purple-500/25",
  },
  idle: {
    icon: MicOff,
    getLabel: () => "Ready to connect",
    color: "#6E6B68",
    bgClass: "bg-neutral-500/8 border-neutral-500/25",
  },
};

export default function MediatorStatus({ state, targetParty, secondsWaiting = 0 }: Props) {
  const cfg = CONFIG[state];
  const Icon = cfg.icon;
  const label = cfg.getLabel(targetParty);
  const hint = cfg.hint?.(targetParty, secondsWaiting);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        className={`flex items-center gap-3 px-4 py-2.5 mx-3 my-1.5 rounded-lg border ${cfg.bgClass}`}
      >
        {/* Pulsing indicator */}
        <div className="relative shrink-0">
          <Icon
            className={`w-5 h-5 ${state === "processing" ? "animate-spin" : ""}`}
            style={{ color: cfg.color }}
          />
          {(state === "speaking" || state === "listening" || state === "waiting") && (
            <motion.div
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: cfg.color }}
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>

        {/* Label + hint */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: cfg.color }}>
              {label}
            </span>
            {state === "waiting" && secondsWaiting >= 3 && (
              <span className="text-xs tabular-nums px-1.5 py-0.5 rounded-full" style={{ color: cfg.color, backgroundColor: cfg.color + "15" }}>
                {secondsWaiting}s
              </span>
            )}
          </div>
          {hint && (
            <p className="text-[11px] mt-0.5" style={{ color: cfg.color + "99" }}>
              {hint}
            </p>
          )}
        </div>

        {/* Waveform animation for speaking/listening */}
        {(state === "speaking" || state === "listening") && (
          <div className="flex items-center gap-0.5 shrink-0">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-0.5 rounded-full"
                style={{ backgroundColor: cfg.color }}
                animate={{ height: [4, 12 + Math.random() * 8, 4] }}
                transition={{ duration: 0.6 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
