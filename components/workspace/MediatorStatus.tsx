"use client";

import { motion } from "motion/react";
import { Volume2, Mic, Clock, Loader2, MicOff } from "lucide-react";

export type MediatorState = "speaking" | "listening" | "waiting" | "processing" | "idle";

interface Props {
  state: MediatorState;
  targetParty: string;
  secondsWaiting?: number;
}

const STATE_CONFIG: Record<MediatorState, { icon: any; getLabel: (party: string) => string; color: string; pulse: boolean }> = {
  speaking: {
    icon: Volume2,
    getLabel: () => "CONCORDIA is speaking",
    color: "#5B8AF5",
    pulse: true,
  },
  listening: {
    icon: Mic,
    getLabel: (p) => `Listening to ${p}`,
    color: "#4ECDC4",
    pulse: true,
  },
  waiting: {
    icon: Clock,
    getLabel: (p) => `Waiting for ${p} to respond`,
    color: "#FBBF24",
    pulse: true,
  },
  processing: {
    icon: Loader2,
    getLabel: () => "Analyzing",
    color: "#A78BFA",
    pulse: false,
  },
  idle: {
    icon: MicOff,
    getLabel: () => "Ready to connect",
    color: "#6E6B68",
    pulse: false,
  },
};

export default function MediatorStatus({ state, targetParty, secondsWaiting = 0 }: Props) {
  const cfg = STATE_CONFIG[state];
  const Icon = cfg.icon;
  const label = cfg.getLabel(targetParty);

  return (
    <div className="flex items-center justify-center py-2">
      <motion.div
        className="flex items-center gap-2.5 px-4 py-2 rounded-full border"
        style={{ borderColor: cfg.color + "35", backgroundColor: cfg.color + "08" }}
        animate={cfg.pulse ? { boxShadow: [`0 0 0 0px ${cfg.color}00`, `0 0 0 6px ${cfg.color}15`, `0 0 0 0px ${cfg.color}00`] } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Pulsing dot for active states */}
        {cfg.pulse && (
          <motion.div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: cfg.color }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: cfg.color }} />
        <span className="text-xs font-medium" style={{ color: cfg.color }}>
          {label}
        </span>
        {state === "waiting" && secondsWaiting >= 5 && (
          <span className="text-[10px] tabular-nums" style={{ color: cfg.color + "80" }}>
            {secondsWaiting}s
          </span>
        )}
      </motion.div>
    </div>
  );
}
