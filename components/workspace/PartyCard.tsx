"use client";

import { motion } from "motion/react";
import { Heart, AlertTriangle } from "lucide-react";
import { CONCORDIA_DESIGN, cn } from "@/lib/design-system";
import type { PartyProfile } from "@/lib/types";

const EMOTION_COLORS: Record<string, string> = {
  Calm: "text-emerald-400",
  Anxious: "text-amber-400",
  Defensive: "text-orange-400",
  Angry: "text-red-400",
  Frustrated: "text-orange-500",
  Hopeful: "text-sky-400",
  Resigned: "text-gray-400",
  Guarded: "text-yellow-500",
  Open: "text-emerald-300",
  Distressed: "text-red-500",
};

function GaugeBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-wider">
        <span className="text-[var(--color-text-muted)]">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 bg-[var(--color-bg)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

interface PartyCardProps {
  name: string;
  profile: PartyProfile | null;
  side: "A" | "B";
}

export default function PartyCard({ name, profile, side }: PartyCardProps) {
  const colors = side === "A" ? CONCORDIA_DESIGN.colors.partyA : CONCORDIA_DESIGN.colors.partyB;
  const emotionColor = profile
    ? EMOTION_COLORS[profile.emotionalState] || "text-gray-400"
    : "text-gray-500";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[var(--color-surface)] rounded-xl p-4 shadow-lg flex-1 min-w-0"
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        boxShadow: `0 0 12px ${colors.light}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: colors.base }}
        >
          {side}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white truncate">{name}</h3>
          {profile && (
            <span className={`text-[10px] font-mono uppercase ${emotionColor}`}>
              {profile.emotionalState} / {profile.communicationStyle}
            </span>
          )}
        </div>
      </div>

      {profile ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <GaugeBar value={profile.cooperativeness} color="#10b981" label="Cooperativeness" />
            <GaugeBar value={profile.defensiveness} color="#ef4444" label="Defensiveness" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
              Engagement:
            </span>
            <span
              className={`text-[10px] font-bold ${
                profile.engagementLevel === "High"
                  ? "text-emerald-400"
                  : profile.engagementLevel === "Medium"
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            >
              {profile.engagementLevel}
            </span>
          </div>

          {profile.conflictStyle && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                Style:
              </span>
              <span className="text-[10px] font-bold text-white">
                {profile.conflictStyle}
              </span>
            </div>
          )}

          {profile.keyNeeds.length > 0 && (
            <div>
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Heart className="w-3 h-3" /> Underlying Needs
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.keyNeeds.map((need, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-white"
                  >
                    {need}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.riskFactors.length > 0 && (
            <div>
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" /> Risk Factors
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.riskFactors.map((risk, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-400"
                  >
                    {risk}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-[11px] text-[var(--color-text-muted)] italic py-4 text-center">
          Awaiting session data...
        </div>
      )}
    </motion.div>
  );
}
