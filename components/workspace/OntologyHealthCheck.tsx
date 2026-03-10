"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { AlertTriangle, Circle, CheckCircle2 } from "lucide-react";
import type { OntologyStats, PrimitiveType } from "@/lib/types";

const ALL_TYPES: PrimitiveType[] = [
  "Actor",
  "Claim",
  "Interest",
  "Constraint",
  "Leverage",
  "Commitment",
  "Event",
  "Narrative",
];

// Maximum counts to normalize against (reasonable upper bound)
const TYPE_MAX: Record<PrimitiveType, number> = {
  Actor: 4,
  Claim: 6,
  Interest: 6,
  Constraint: 4,
  Leverage: 4,
  Commitment: 4,
  Event: 4,
  Narrative: 4,
};

function radarColor(score: number): string {
  if (score < 30) return "#ef4444";
  if (score < 60) return "#f59e0b";
  return "#10b981";
}

interface Flag {
  label: string;
  prompt: string;
  ok: boolean;
}

interface Props {
  stats: OntologyStats;
  partyAName: string;
  partyBName: string;
  partyAClaims: number;
  partyBClaims: number;
}

export default function OntologyHealthCheck({
  stats,
  partyAName,
  partyBName,
  partyAClaims,
  partyBClaims,
}: Props) {
  // Build normalized radar data (0-100 per axis)
  const data = ALL_TYPES.map((type) => {
    const count = stats[type] ?? 0;
    const max = TYPE_MAX[type];
    const value = Math.min(100, Math.round((count / max) * 100));
    return { type, value, count };
  });

  // Overall health score = average across all axes
  const overallScore = Math.round(
    data.reduce((sum, d) => sum + d.value, 0) / data.length,
  );

  const fillColor = radarColor(overallScore);

  // Structural flags checklist
  const flags: Flag[] = [
    {
      label: "Actors identified",
      prompt: "Who are the key parties involved in this dispute?",
      ok: (stats.Actor ?? 0) >= 2,
    },
    {
      label: "Claims captured from both parties",
      prompt: "What specific claims or positions does each party hold?",
      ok: partyAClaims >= 1 && partyBClaims >= 1,
    },
    {
      label: "Interests explored",
      prompt: "What underlying needs or interests drive each party's position?",
      ok: (stats.Interest ?? 0) >= 2,
    },
    {
      label: "Constraints documented",
      prompt: "What legal, financial, or practical constraints limit the options?",
      ok: (stats.Constraint ?? 0) >= 1,
    },
    {
      label: "Leverage points identified",
      prompt: "What resources, rights, or alternatives strengthen each party's position?",
      ok: (stats.Leverage ?? 0) >= 1,
    },
    {
      label: "Narratives captured",
      prompt:
        "Ask about the story of the conflict — how each party describes what happened and why.",
      ok: (stats.Narrative ?? 0) >= 1,
    },
    {
      label: "Commitment opportunities noted",
      prompt: "What concessions or commitments is each party willing to make?",
      ok: (stats.Commitment ?? 0) >= 1,
    },
    {
      label: "Key events documented",
      prompt: "What specific incidents or turning points triggered the conflict?",
      ok: (stats.Event ?? 0) >= 1,
    },
  ];

  // Imbalance flag
  const imbalanceDiff = Math.abs(partyAClaims - partyBClaims);
  const hasImbalance = imbalanceDiff >= 3;
  const weakerParty = partyAClaims < partyBClaims ? partyAName : partyBName;
  if (hasImbalance) {
    flags.push({
      label: `Claim imbalance: ${partyAName} (${partyAClaims}) vs ${partyBName} (${partyBClaims})`,
      prompt: `Probe ${weakerParty} more — ask what positions they hold and what they want from this process.`,
      ok: false,
    });
  }

  const pendingFlags = flags.filter((f) => !f.ok);

  return (
    <div className="flex flex-col gap-4">
      {/* Radar chart */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
            Ontology Coverage Radar
          </h3>
          <span
            className="text-sm font-bold font-mono"
            style={{ color: fillColor }}
          >
            {overallScore}%
          </span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={data}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis
              dataKey="type"
              tick={{ fill: "#9ca3af", fontSize: 9 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "#6b7280", fontSize: 8 }}
              tickCount={3}
            />
            <Radar
              name="Coverage"
              dataKey="value"
              stroke={fillColor}
              fill={fillColor}
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "11px",
              }}
              formatter={(value: number, _name: string, props: any) => [
                `${value}% (${props.payload.count} captured)`,
                props.payload.type,
              ]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Structural flags */}
      {pendingFlags.length > 0 && (
        <div className="bg-[var(--color-surface)] border border-amber-500/20 rounded-xl p-4">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Still Needed (
            {pendingFlags.length})
          </h3>
          <ul className="space-y-2">
            {pendingFlags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2">
                <Circle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-amber-100">
                    {flag.label}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 italic leading-relaxed">
                    "{flag.prompt}"
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All good */}
      {pendingFlags.length === 0 && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-300">
            Full ontology coverage achieved — all 8 primitives captured.
          </p>
        </div>
      )}
    </div>
  );
}
