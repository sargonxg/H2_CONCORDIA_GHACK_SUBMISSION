"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type PowerDimension = {
  dimension: string;
  score: number; // -5 (Party A dominant) to +5 (Party B dominant)
  evidence: string;
};

type PowerMapProps = {
  dimensions: PowerDimension[];
  overallBalance: string;
  rebalancingStrategy?: string;
  partyAName: string;
  partyBName: string;
};

const BALANCE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  balanced:              { label: "Balanced",            color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  "A-favored":           { label: "Favors ",             color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30"    },
  "B-favored":           { label: "Favors ",             color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/30"  },
  "severely-imbalanced": { label: "Severely Imbalanced", color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30"     },
};

export default function PowerMap({
  dimensions,
  overallBalance,
  rebalancingStrategy,
  partyAName,
  partyBName,
}: PowerMapProps) {
  const cfg = BALANCE_CONFIG[overallBalance] ?? BALANCE_CONFIG["balanced"];
  const balanceLabel =
    overallBalance === "A-favored"
      ? cfg.label + partyAName
      : overallBalance === "B-favored"
      ? cfg.label + partyBName
      : cfg.label;

  // Use stable keys "partyA"/"partyB" — dynamic keys cause Recharts SVG errors
  // when values are undefined. Radar needs ≥3 data points to compute polygon coords.
  const chartData = dimensions.map((d) => ({
    subject: d.dimension.charAt(0).toUpperCase() + d.dimension.slice(1),
    partyA: parseFloat(Math.max(0, -d.score).toFixed(1)),
    partyB: parseFloat(Math.max(0, d.score).toFixed(1)),
    fullMark: 5,
  }));

  const canRenderChart = chartData.length >= 3;

  return (
    <div className="space-y-4">
      {/* Balance badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
          Power Map
        </h3>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}
        >
          {balanceLabel}
        </span>
      </div>

      {/* Radar chart — requires ≥3 axes to avoid SVG coordinate errors */}
      {canRenderChart ? (
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#9ca3af", fontSize: 9, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 5]}
              tick={{ fill: "#6b7280", fontSize: 8 }}
              tickCount={4}
            />
            <Radar
              name={partyAName}
              dataKey="partyA"
              stroke="#60a5fa"
              fill="#60a5fa"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Radar
              name={partyBName}
              dataKey="partyB"
              stroke="#a78bfa"
              fill="#a78bfa"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "11px",
                color: "var(--color-text)",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-32 text-sm text-[var(--color-text-muted)]">
          {dimensions.length === 0
            ? "Awaiting power assessment…"
            : "Gathering more dimensions…"}
        </div>
      )}

      {/* Dimension evidence list */}
      {dimensions.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {dimensions.map((d) => {
            const dominant = d.score < 0 ? partyAName : d.score > 0 ? partyBName : null;
            const abs = Math.abs(d.score);
            return (
              <div
                key={d.dimension}
                className="flex items-start gap-2 text-xs rounded-lg px-2.5 py-1.5 bg-[var(--color-surface-hover)]"
              >
                <span
                  className={`shrink-0 font-mono font-bold w-4 text-center ${
                    d.score < -1
                      ? "text-blue-400"
                      : d.score > 1
                      ? "text-violet-400"
                      : "text-emerald-400"
                  }`}
                >
                  {d.score > 0 ? "+" : ""}{d.score}
                </span>
                <div className="min-w-0">
                  <span className="font-semibold capitalize text-white/80">{d.dimension}</span>
                  {dominant && abs > 0 && (
                    <span className="text-[var(--color-text-muted)]"> · {dominant} +{abs}</span>
                  )}
                  {d.evidence && (
                    <p className="text-[var(--color-text-muted)] mt-0.5 leading-tight truncate">
                      {d.evidence}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rebalancing strategy */}
      {rebalancingStrategy && (
        <div className="text-xs rounded-lg px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 leading-relaxed">
          <span className="font-semibold">Rebalancing: </span>
          {rebalancingStrategy}
        </div>
      )}
    </div>
  );
}
