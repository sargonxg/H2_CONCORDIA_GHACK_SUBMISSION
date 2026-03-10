"use client";

import { motion } from "motion/react";
import { getProtocolForEscalation } from "@/lib/de-escalation";

interface Props {
  escalationScore: number; // 0-100
}

// ── Convert score (0-100) to needle angle on semicircle ──
// Semicircle goes from -180° (left) to 0° (right), needle starts at -180° for score=0.
// We map 0→-180deg, 100→0deg.
function scoreToAngle(score: number): number {
  return -180 + (score / 100) * 180;
}

// ── Color gradient stops ──
function scoreToColor(score: number): string {
  if (score < 30) return "#10b981"; // emerald
  if (score < 55) return "#f59e0b"; // amber
  if (score < 75) return "#f97316"; // orange
  return "#ef4444";                 // red
}

export default function EscalationMeter({ escalationScore }: Props) {
  const clampedScore = Math.max(0, Math.min(100, escalationScore));
  const angle = scoreToAngle(clampedScore);
  const color = scoreToColor(clampedScore);
  const protocol = getProtocolForEscalation(clampedScore);

  // Needle endpoint (from center of semicircle)
  const cx = 60; const cy = 55; // center of SVG
  const r = 42;
  const rad = (angle * Math.PI) / 180;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
          Escalation Risk
        </h3>
        <span className="text-sm font-bold font-mono" style={{ color }}>
          {clampedScore}
        </span>
      </div>

      {/* ── SVG Semicircular Gauge ── */}
      <svg viewBox="0 0 120 65" className="w-full" style={{ overflow: "visible" }}>
        {/* Gradient arc background — 4 colored segments */}
        {/* Emerald: -180 to -126 (30%) */}
        <path
          d="M 18 55 A 42 42 0 0 1 39.5 21.5"
          fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" opacity="0.3"
        />
        {/* Amber: -126 to -81 (55%) */}
        <path
          d="M 39.5 21.5 A 42 42 0 0 1 68.4 13.6"
          fill="none" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" opacity="0.3"
        />
        {/* Orange: -81 to -45 (75%) */}
        <path
          d="M 68.4 13.6 A 42 42 0 0 1 89.7 24.7"
          fill="none" stroke="#f97316" strokeWidth="6" strokeLinecap="round" opacity="0.3"
        />
        {/* Red: -45 to 0 (100%) */}
        <path
          d="M 89.7 24.7 A 42 42 0 0 1 102 55"
          fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" opacity="0.3"
        />

        {/* Filled arc to current score */}
        <motion.path
          d={`M 18 55 A 42 42 0 ${clampedScore > 50 ? 1 : 0} 1 ${nx.toFixed(2)} ${ny.toFixed(2)}`}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const a = ((-180 + (tick / 100) * 180) * Math.PI) / 180;
          const x1 = cx + 36 * Math.cos(a); const y1 = cy + 36 * Math.sin(a);
          const x2 = cx + 42 * Math.cos(a); const y2 = cy + 42 * Math.sin(a);
          return <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#374151" strokeWidth="1.5" />;
        })}

        {/* Needle */}
        <motion.line
          x1={cx} y1={cy}
          x2={nx} y2={ny}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ x2: nx, y2: ny }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <circle cx={cx} cy={cy} r="3" fill="white" />

        {/* Labels */}
        <text x="15" y="68" fontSize="7" fill="#6b7280" textAnchor="middle">0</text>
        <text x="60" y="12" fontSize="7" fill="#6b7280" textAnchor="middle">50</text>
        <text x="105" y="68" fontSize="7" fill="#6b7280" textAnchor="middle">100</text>
      </svg>

      {/* ── Protocol level ── */}
      {protocol && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-2 rounded-lg border"
          style={{ borderColor: color + "40", backgroundColor: color + "08" }}
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color }}>
              Level {protocol.level} — {protocol.name}
            </span>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
            {protocol.description}
          </p>
        </motion.div>
      )}

      {clampedScore < 30 && (
        <p className="text-[10px] text-emerald-400 mt-2 text-center">Stable — no escalation detected</p>
      )}
    </div>
  );
}
