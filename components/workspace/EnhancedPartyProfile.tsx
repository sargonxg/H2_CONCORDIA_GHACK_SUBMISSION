"use client";

import { motion } from "motion/react";
import {
  Heart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { PartyProfile } from "@/lib/types";

// ── Thomas-Kilmann conflict style colors and descriptions ──
const CONFLICT_STYLE_CONFIG: Record<string, { color: string; bg: string; description: string }> = {
  Competing:      { color: "#ef4444", bg: "bg-red-500/10 border-red-500/30",    description: "High assertive, low cooperative" },
  Collaborating:  { color: "#10b981", bg: "bg-emerald-500/10 border-emerald-500/30", description: "High assertive, high cooperative" },
  Compromising:   { color: "#f59e0b", bg: "bg-amber-500/10 border-amber-500/30",  description: "Moderate on both axes" },
  Avoiding:       { color: "#6b7280", bg: "bg-gray-500/10 border-gray-500/30",   description: "Low assertive, low cooperative" },
  Accommodating:  { color: "#3b82f6", bg: "bg-blue-500/10 border-blue-500/30",   description: "Low assertive, high cooperative" },
};

const EMOTION_COLORS: Record<string, string> = {
  Calm: "text-emerald-400", Anxious: "text-amber-400", Defensive: "text-orange-400",
  Angry: "text-red-400", Frustrated: "text-orange-500", Hopeful: "text-sky-400",
  Resigned: "text-gray-400", Guarded: "text-yellow-500", Open: "text-emerald-300",
  Distressed: "text-red-500",
};

function GaugeBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-wider">
        <span className="text-[var(--color-text-muted)]">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>{value}%</span>
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

function MiniRiskGauge({ value, label }: { value: number; label: string }) {
  const color = value < 30 ? "#10b981" : value < 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-8 h-8">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#1f2937" strokeWidth="4" />
          <circle
            cx="18" cy="18" r="14"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={`${(value / 100) * 87.96} 87.96`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <span className="text-[8px] text-[var(--color-text-muted)] text-center leading-tight">{label}</span>
    </div>
  );
}

function TrajectoryArrow({ trajectory }: { trajectory: string }) {
  if (trajectory === "escalating") return <TrendingUp className="w-3.5 h-3.5 text-red-400" />;
  if (trajectory === "de-escalating") return <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />;
  return <Minus className="w-3.5 h-3.5 text-gray-400" />;
}

interface Props {
  name: string;
  profile: PartyProfile | null;
  side: "A" | "B";
}

export default function EnhancedPartyProfile({ name, profile, side }: Props) {
  const borderColor = side === "A" ? "border-sky-500/40 shadow-sky-500/5" : "border-violet-500/40 shadow-violet-500/5";
  const accentColor = side === "A" ? "#0ea5e9" : "#8b5cf6";
  const bgGlow = side === "A" ? "from-sky-500/5 to-transparent" : "from-violet-500/5 to-transparent";
  const emotionColor = profile ? EMOTION_COLORS[profile.emotionalState] || "text-gray-400" : "text-gray-500";
  const conflictStyleCfg = profile?.conflictStyle ? CONFLICT_STYLE_CONFIG[profile.conflictStyle] : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-b ${bgGlow} bg-[var(--color-surface)] border ${borderColor} rounded-xl p-4 shadow-lg flex-1 min-w-0`}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          {side}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-white truncate">{name}</h3>
          {profile && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-mono uppercase ${emotionColor}`}>
                {profile.emotionalState}
              </span>
              {profile.emotionalIntensity !== undefined && (
                <span className="text-[9px] text-[var(--color-text-muted)]">
                  ({profile.emotionalIntensity}/10)
                </span>
              )}
              {profile.emotionalTrajectory && (
                <TrajectoryArrow trajectory={profile.emotionalTrajectory} />
              )}
            </div>
          )}
        </div>
      </div>

      {profile ? (
        <div className="space-y-3">
          {/* ── Conflict style badge ── */}
          {conflictStyleCfg && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-mono ${conflictStyleCfg.bg}`}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: conflictStyleCfg.color }} />
              <span style={{ color: conflictStyleCfg.color }}>{profile.conflictStyle}</span>
              <span className="text-[var(--color-text-muted)] ml-auto">{conflictStyleCfg.description}</span>
            </div>
          )}

          {/* ── Cooperativeness / Defensiveness gauges ── */}
          <div className="grid grid-cols-2 gap-2">
            <GaugeBar value={profile.cooperativeness} color="#10b981" label="Cooperative" />
            <GaugeBar value={profile.defensiveness} color="#ef4444" label="Defensive" />
          </div>

          {/* ── Engagement level ── */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Engagement:</span>
            <span className={`text-[10px] font-bold ${
              profile.engagementLevel === "High" ? "text-emerald-400" :
              profile.engagementLevel === "Medium" ? "text-amber-400" : "text-red-400"
            }`}>
              {profile.engagementLevel}
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] ml-auto">{profile.communicationStyle}</span>
          </div>

          {/* ── Trust bars (Mayer/Davis/Schoorman) ── */}
          {profile.trustTowardOther && (
            <div>
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                Trust toward other party
              </div>
              <div className="space-y-1">
                <GaugeBar value={profile.trustTowardOther.ability} color="#3b82f6" label="Ability" />
                <GaugeBar value={profile.trustTowardOther.benevolence} color="#8b5cf6" label="Benevolence" />
                <GaugeBar value={profile.trustTowardOther.integrity} color="#06b6d4" label="Integrity" />
              </div>
            </div>
          )}

          {/* ── Risk dashboard ── */}
          {profile.riskAssessment && (
            <div>
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Risk Dashboard
              </div>
              <div className="grid grid-cols-4 gap-1">
                <MiniRiskGauge value={profile.riskAssessment.escalation} label="Escal." />
                <MiniRiskGauge value={profile.riskAssessment.withdrawal} label="Wthdr." />
                <MiniRiskGauge value={profile.riskAssessment.badFaith} label="B.Faith" />
                <MiniRiskGauge value={profile.riskAssessment.impasse} label="Impasse" />
              </div>
            </div>
          )}

          {/* ── Key needs ── */}
          {profile.keyNeeds.length > 0 && (
            <div>
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Heart className="w-3 h-3" /> Underlying Needs
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.keyNeeds.map((need, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-white">
                    {need}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Risk factors ── */}
          {profile.riskFactors.length > 0 && (
            <div>
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" /> Risk Factors
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.riskFactors.map((risk, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-400">
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
