"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import type { EmotionSnapshot } from "@/lib/types";

// Phase background color bands (Recharts ReferenceArea is not imported here;
// we use a custom background layer drawn via SVG defs in the chart margin area,
// so instead we mark phase boundaries with thin vertical ReferenceLines).
const PHASE_COLORS: Record<string, string> = {
  Opening: "#64748b",     // slate
  Discovery: "#0ea5e9",   // sky
  Exploration: "#f59e0b", // amber
  Negotiation: "#10b981", // emerald
  Resolution: "#8b5cf6",  // violet
  Agreement: "#22c55e",   // green
};

const TRAJECTORY_ICONS: Record<string, string> = {
  escalating: "↑",
  stable: "→",
  "de-escalating": "↓",
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type ChartPoint = {
  elapsedSeconds: number;
  label: string;
  partyAIntensity: number;
  partyBIntensity: number;
  escalationScore: number;
  phase: string;
  partyAState: string;
  partyBState: string;
  partyATrajectory: string;
  partyBTrajectory: string;
  partyAStyle: string;
  partyBStyle: string;
  partyACoop: number;
  partyBCoop: number;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  partyAName: string;
  partyBName: string;
}

function CustomTooltip({ active, payload, label, partyAName, partyBName }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  // Find the data point from any payload entry
  const point: ChartPoint | undefined = payload[0]?.payload;
  if (!point) return null;

  const phaseColor = PHASE_COLORS[point.phase] ?? "#94a3b8";

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-slate-400">{label}</span>
        <span
          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: phaseColor + "33", color: phaseColor }}
        >
          {point.phase}
        </span>
      </div>

      {/* Party A */}
      <div className="mb-2 pb-2 border-b border-slate-700/60">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sky-400">{partyAName}</span>
          <span className="text-slate-300 font-mono">
            {TRAJECTORY_ICONS[point.partyATrajectory] ?? "→"} {point.partyAIntensity}/10
          </span>
        </div>
        <div className="text-slate-300">{point.partyAState}</div>
        {point.partyAStyle && (
          <div className="text-slate-500 mt-0.5">Style: {point.partyAStyle}</div>
        )}
        <div className="text-slate-500 mt-0.5">
          Coop: {point.partyACoop}%
        </div>
      </div>

      {/* Party B */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-violet-400">{partyBName}</span>
          <span className="text-slate-300 font-mono">
            {TRAJECTORY_ICONS[point.partyBTrajectory] ?? "→"} {point.partyBIntensity}/10
          </span>
        </div>
        <div className="text-slate-300">{point.partyBState}</div>
        {point.partyBStyle && (
          <div className="text-slate-500 mt-0.5">Style: {point.partyBStyle}</div>
        )}
        <div className="text-slate-500 mt-0.5">
          Coop: {point.partyBCoop}%
        </div>
      </div>

      {/* Escalation */}
      <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between">
        <span className="text-red-400">Escalation</span>
        <span className="font-mono text-red-300">{point.escalationScore}</span>
      </div>
    </div>
  );
}

interface Props {
  timeline: EmotionSnapshot[];
  partyAName: string;
  partyBName: string;
}

export default function EmotionTimeline({ timeline, partyAName, partyBName }: Props) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-sm">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-3">
          <span className="text-lg">📈</span>
        </div>
        <p>Emotion data will appear here once the session begins.</p>
        <p className="text-xs mt-1 text-slate-600">
          Snapshots are captured automatically each time the AI updates party profiles.
        </p>
      </div>
    );
  }

  // Build chart data
  const data: ChartPoint[] = timeline.map((snap) => ({
    elapsedSeconds: snap.elapsedSeconds,
    label: formatElapsed(snap.elapsedSeconds),
    partyAIntensity: snap.partyA.emotionalIntensity,
    partyBIntensity: snap.partyB.emotionalIntensity,
    escalationScore: Math.round((snap.escalationScore / 100) * 10), // normalise to 1-10 scale
    phase: snap.phase,
    partyAState: snap.partyA.emotionalState,
    partyBState: snap.partyB.emotionalState,
    partyATrajectory: snap.partyA.emotionalTrajectory,
    partyBTrajectory: snap.partyB.emotionalTrajectory,
    partyAStyle: snap.partyA.conflictStyle,
    partyBStyle: snap.partyB.conflictStyle,
    partyACoop: snap.partyA.cooperativeness,
    partyBCoop: snap.partyB.cooperativeness,
  }));

  // Detect phase transition points for reference lines
  const phaseLines: { x: number; phase: string }[] = [];
  let lastPhase = "";
  for (const d of data) {
    if (d.phase !== lastPhase) {
      phaseLines.push({ x: d.elapsedSeconds, phase: d.phase });
      lastPhase = d.phase;
    }
  }

  // Summary stats
  const latestA = timeline[timeline.length - 1].partyA;
  const latestB = timeline[timeline.length - 1].partyB;
  const peakEscalation = Math.max(...timeline.map((s) => s.escalationScore));

  return (
    <div className="space-y-4">
      {/* Header + quick stats */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Emotion Timeline
          <span className="font-mono text-slate-600 font-normal normal-case tracking-normal">
            — {timeline.length} snapshots
          </span>
        </h3>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-red-400">
            Peak escalation: <span className="font-mono font-bold">{peakEscalation}</span>
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#64748b", fontFamily: "monospace" }}
              axisLine={{ stroke: "#334155" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              width={24}
              ticks={[0, 2, 4, 6, 8, 10]}
            />
            <Tooltip
              content={
                <CustomTooltip partyAName={partyAName} partyBName={partyBName} />
              }
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
              formatter={(value) => (
                <span style={{ color: value === partyAName ? "#38bdf8" : value === partyBName ? "#a78bfa" : "#f87171" }}>
                  {value}
                </span>
              )}
            />

            {/* Phase transition reference lines */}
            {phaseLines.map((pl, i) => (
              <ReferenceLine
                key={i}
                x={formatElapsed(pl.x)}
                stroke={PHASE_COLORS[pl.phase] ?? "#475569"}
                strokeDasharray="4 3"
                strokeWidth={1}
                label={{
                  value: pl.phase,
                  position: "insideTopLeft",
                  fontSize: 9,
                  fill: PHASE_COLORS[pl.phase] ?? "#475569",
                  offset: 2,
                }}
              />
            ))}

            {/* Escalation score as a thin red area (normalised 0-10) */}
            <Area
              type="monotone"
              dataKey="escalationScore"
              name="Escalation"
              fill="#ef444422"
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="3 2"
              dot={false}
              activeDot={false}
              legendType="none"
            />

            {/* Party A — blue */}
            <Line
              type="monotone"
              dataKey="partyAIntensity"
              name={partyAName}
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#38bdf8", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#38bdf8" }}
              connectNulls
            />

            {/* Party B — violet */}
            <Line
              type="monotone"
              dataKey="partyBIntensity"
              name={partyBName}
              stroke="#a78bfa"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#a78bfa", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#a78bfa" }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Current state strip */}
      <div className="grid grid-cols-2 gap-2">
        {/* Party A current state */}
        <div className="bg-sky-500/5 border border-sky-500/20 rounded-lg p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
              {partyAName}
            </span>
            <span className="font-mono text-[10px] text-sky-300">
              {TRAJECTORY_ICONS[latestA.emotionalTrajectory] ?? "→"}{" "}
              {latestA.emotionalIntensity}/10
            </span>
          </div>
          <div className="text-[11px] text-white">{latestA.emotionalState}</div>
          {latestA.conflictStyle && (
            <div className="text-[10px] text-slate-400">{latestA.conflictStyle}</div>
          )}
          {/* Cooperativeness mini-bar */}
          <div className="mt-1">
            <div className="flex justify-between text-[9px] text-slate-500 mb-0.5">
              <span>Coop</span>
              <span>{latestA.cooperativeness}%</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full"
                style={{ width: `${latestA.cooperativeness}%` }}
              />
            </div>
          </div>
        </div>

        {/* Party B current state */}
        <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">
              {partyBName}
            </span>
            <span className="font-mono text-[10px] text-violet-300">
              {TRAJECTORY_ICONS[latestB.emotionalTrajectory] ?? "→"}{" "}
              {latestB.emotionalIntensity}/10
            </span>
          </div>
          <div className="text-[11px] text-white">{latestB.emotionalState}</div>
          {latestB.conflictStyle && (
            <div className="text-[10px] text-slate-400">{latestB.conflictStyle}</div>
          )}
          {/* Cooperativeness mini-bar */}
          <div className="mt-1">
            <div className="flex justify-between text-[9px] text-slate-500 mb-0.5">
              <span>Coop</span>
              <span>{latestB.cooperativeness}%</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full"
                style={{ width: `${latestB.cooperativeness}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Phase legend */}
      <div className="flex flex-wrap gap-2 mt-1">
        {Object.entries(PHASE_COLORS).map(([phase, color]) => (
          <span
            key={phase}
            className="flex items-center gap-1 text-[10px] text-slate-500"
          >
            <span
              className="inline-block w-2.5 h-px border-t-2 border-dashed"
              style={{ borderColor: color }}
            />
            {phase}
          </span>
        ))}
      </div>
    </div>
  );
}
