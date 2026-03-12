"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Unlock, X, ChevronRight, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";

// ─── Pure algorithm (exported for testing) ────────────────────────────────────
export function calculateSettlement(
  aRange: [number, number],
  bRange: [number, number],
): { settled: boolean; amount?: number; gap?: number } {
  const overlapMin = Math.max(aRange[0], bRange[0]);
  const overlapMax = Math.min(aRange[1], bRange[1]);
  if (overlapMin <= overlapMax) {
    const aWidth = aRange[1] - aRange[0];
    const bWidth = bRange[1] - bRange[0];
    const total = aWidth + bWidth;
    const aWeight = total > 0 ? aWidth / total : 0.5;
    return {
      settled: true,
      amount:
        Math.round((overlapMin + (overlapMax - overlapMin) * aWeight) * 100) /
        100,
    };
  }
  return { settled: false, gap: Math.abs(overlapMin - overlapMax) };
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "setup" | "partyA" | "partyB" | "reveal";

interface BidSetup {
  issue: string;
  unit: string;
  rangeMin: number;
  rangeMax: number;
}

interface Bid {
  min: number;
  max: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  partyAName?: string;
  partyBName?: string;
  onSettlement?: (issue: string, amount: number, unit: string) => void;
}

// ─── Number Line Visualisation ────────────────────────────────────────────────
function NumberLine({
  rangeMin,
  rangeMax,
  bidA,
  bidB,
  revealed,
  unit,
  settlementAmount,
}: {
  rangeMin: number;
  rangeMax: number;
  bidA: Bid | null;
  bidB: Bid | null;
  revealed: boolean;
  unit: string;
  settlementAmount?: number;
}) {
  const span = rangeMax - rangeMin || 1;
  const pct = (v: number) => ((v - rangeMin) / span) * 100;

  return (
    <div className="relative h-16 mt-4">
      {/* Track */}
      <div className="absolute top-7 left-0 right-0 h-1.5 bg-slate-700 rounded-full" />
      {/* Min / Max labels */}
      <span className="absolute top-10 left-0 text-[10px] font-mono text-slate-500">
        {rangeMin}
        {unit}
      </span>
      <span className="absolute top-10 right-0 text-[10px] font-mono text-slate-500">
        {rangeMax}
        {unit}
      </span>

      {/* Party A range */}
      {bidA && revealed && (
        <>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute top-6 h-3 bg-blue-500/30 border-t border-b border-blue-500/60 rounded"
            style={{
              left: `${pct(bidA.min)}%`,
              width: `${pct(bidA.max) - pct(bidA.min)}%`,
              transformOrigin: "left",
            }}
          />
          <div
            className="absolute -top-0 text-[9px] font-mono text-blue-400 -translate-x-1/2"
            style={{ left: `${pct(bidA.min)}%` }}
          >
            A·min
          </div>
          <div
            className="absolute -top-0 text-[9px] font-mono text-blue-400 -translate-x-1/2"
            style={{ left: `${pct(bidA.max)}%` }}
          >
            A·max
          </div>
        </>
      )}

      {/* Party B range */}
      {bidB && revealed && (
        <>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute top-6 h-3 bg-violet-500/30 border-t border-b border-violet-500/60 rounded"
            style={{
              left: `${pct(bidB.min)}%`,
              width: `${pct(bidB.max) - pct(bidB.min)}%`,
              transformOrigin: "left",
            }}
          />
          <div
            className="absolute top-10 text-[9px] font-mono text-violet-400 -translate-x-1/2"
            style={{ left: `${pct(bidB.min)}%` }}
          >
            B·min
          </div>
          <div
            className="absolute top-10 text-[9px] font-mono text-violet-400 -translate-x-1/2"
            style={{ left: `${pct(bidB.max)}%` }}
          >
            B·max
          </div>
        </>
      )}

      {/* Overlap / Settlement marker */}
      {bidA && bidB && revealed && settlementAmount !== undefined && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
          className="absolute top-4 w-5 h-5 rounded-full bg-emerald-500 border-2 border-emerald-300 shadow-lg shadow-emerald-500/40 -translate-x-1/2 flex items-center justify-center"
          style={{ left: `${pct(settlementAmount)}%` }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </motion.div>
      )}

      {/* Lock icons when not yet revealed */}
      {bidA && !revealed && (
        <div
          className="absolute top-4 -translate-x-1/2"
          style={{ left: `${pct((bidA.min + bidA.max) / 2)}%` }}
        >
          <Lock className="w-4 h-4 text-blue-400/60" />
        </div>
      )}
      {bidB && !revealed && (
        <div
          className="absolute top-4 -translate-x-1/2"
          style={{ left: `${pct((bidB.min + bidB.max) / 2)}%` }}
        >
          <Lock className="w-4 h-4 text-violet-400/60" />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BlindBidding({
  open,
  onClose,
  partyAName = "Party A",
  partyBName = "Party B",
  onSettlement,
}: Props) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [setup, setSetup] = useState<BidSetup>({
    issue: "",
    unit: "$",
    rangeMin: 0,
    rangeMax: 100000,
  });
  const [bidA, setBidA] = useState<Bid>({ min: 0, max: 0 });
  const [bidB, setBidB] = useState<Bid>({ min: 0, max: 0 });
  const [result, setResult] = useState<ReturnType<typeof calculateSettlement> | null>(null);

  function reset() {
    setPhase("setup");
    setSetup({ issue: "", unit: "$", rangeMin: 0, rangeMax: 100000 });
    setBidA({ min: 0, max: 0 });
    setBidB({ min: 0, max: 0 });
    setResult(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleReveal() {
    const res = calculateSettlement(
      [bidA.min, bidA.max],
      [bidB.min, bidB.max],
    );
    setResult(res);
    setPhase("reveal");
    if (res.settled && res.amount !== undefined) {
      onSettlement?.(setup.issue, res.amount, setup.unit);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative w-full max-w-lg bg-[#111827] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-blue-400 mb-0.5">
              Smartsettle ONE · RCB Algorithm
            </div>
            <h2 className="text-base font-bold text-white">
              Blind Bidding
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close blind bidding"
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Phase stepper */}
        <div className="flex items-center gap-0 px-6 pt-4">
          {(["setup", "partyA", "partyB", "reveal"] as Phase[]).map((p, i) => {
            const labels = ["Setup", partyAName, partyBName, "Reveal"];
            const done =
              (phase === "partyA" && i === 0) ||
              (phase === "partyB" && i <= 1) ||
              (phase === "reveal" && i <= 2);
            const active = phase === p;
            return (
              <div key={p} className="flex items-center flex-1 last:flex-none">
                <div
                  className={`flex flex-col items-center gap-0.5 ${active ? "opacity-100" : done ? "opacity-80" : "opacity-30"}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      active
                        ? "bg-blue-500 text-white"
                        : done
                          ? "bg-emerald-500/40 text-emerald-300 border border-emerald-500/40"
                          : "bg-slate-700 text-slate-500"
                    }`}
                  >
                    {done && !active ? "✓" : i + 1}
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap max-w-[52px] text-center truncate">
                    {labels[i]}
                  </span>
                </div>
                {i < 3 && (
                  <div
                    className={`flex-1 h-px mx-1 mb-3 transition-all ${done ? "bg-emerald-500/40" : "bg-slate-700"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <AnimatePresence mode="wait">
            {/* ── SETUP ── */}
            {phase === "setup" && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <p className="text-xs text-slate-400 leading-relaxed">
                  Each party will privately submit their acceptable range. If
                  ranges overlap, a settlement is declared using the{" "}
                  <span className="text-blue-400 font-medium">
                    RCB algorithm
                  </span>{" "}
                  — rewarding the party who moved furthest toward center.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Issue name
                    </label>
                    <input
                      value={setup.issue}
                      onChange={(e) =>
                        setSetup((s) => ({ ...s, issue: e.target.value }))
                      }
                      placeholder="e.g. Settlement amount, delivery timeline…"
                      className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/70 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Unit
                      </label>
                      <select
                        value={setup.unit}
                        onChange={(e) =>
                          setSetup((s) => ({ ...s, unit: e.target.value }))
                        }
                        className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/70"
                      >
                        <option value="$">$ (USD)</option>
                        <option value="€">€ (EUR)</option>
                        <option value=" days"> days</option>
                        <option value="%">%</option>
                        <option value=" hrs"> hrs</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Range min
                      </label>
                      <input
                        type="number"
                        value={setup.rangeMin}
                        onChange={(e) =>
                          setSetup((s) => ({
                            ...s,
                            rangeMin: Number(e.target.value),
                          }))
                        }
                        className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/70"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Range max
                      </label>
                      <input
                        type="number"
                        value={setup.rangeMax}
                        onChange={(e) =>
                          setSetup((s) => ({
                            ...s,
                            rangeMax: Number(e.target.value),
                          }))
                        }
                        className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/70"
                      />
                    </div>
                  </div>
                </div>
                <NumberLine
                  rangeMin={setup.rangeMin}
                  rangeMax={setup.rangeMax}
                  bidA={null}
                  bidB={null}
                  revealed={false}
                  unit={setup.unit}
                />
              </motion.div>
            )}

            {/* ── PARTY A BID ── */}
            {phase === "partyA" && (
              <motion.div
                key="partyA"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <Lock className="w-4 h-4 text-blue-400 shrink-0" />
                  <p className="text-xs text-blue-200">
                    <span className="font-bold">{partyBName}</span> — please look
                    away. <span className="font-bold">{partyAName}</span> is
                    entering their private bid.
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  Issue: <span className="text-white font-medium">{setup.issue}</span>
                  {" "}· Range: {setup.rangeMin}–{setup.rangeMax}
                  {setup.unit}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Minimum acceptable ({setup.unit})
                    </label>
                    <input
                      type="number"
                      value={bidA.min || ""}
                      onChange={(e) =>
                        setBidA((b) => ({ ...b, min: Number(e.target.value) }))
                      }
                      placeholder={String(setup.rangeMin)}
                      min={setup.rangeMin}
                      max={setup.rangeMax}
                      className="w-full bg-blue-500/5 border border-blue-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/70 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Maximum acceptable ({setup.unit})
                    </label>
                    <input
                      type="number"
                      value={bidA.max || ""}
                      onChange={(e) =>
                        setBidA((b) => ({ ...b, max: Number(e.target.value) }))
                      }
                      placeholder={String(setup.rangeMax)}
                      min={setup.rangeMin}
                      max={setup.rangeMax}
                      className="w-full bg-blue-500/5 border border-blue-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/70 transition-colors"
                    />
                  </div>
                </div>
                <NumberLine
                  rangeMin={setup.rangeMin}
                  rangeMax={setup.rangeMax}
                  bidA={bidA}
                  bidB={null}
                  revealed={false}
                  unit={setup.unit}
                />
              </motion.div>
            )}

            {/* ── PARTY B BID ── */}
            {phase === "partyB" && (
              <motion.div
                key="partyB"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                  <Lock className="w-4 h-4 text-violet-400 shrink-0" />
                  <p className="text-xs text-violet-200">
                    <span className="font-bold">{partyAName}</span> — please look
                    away. <span className="font-bold">{partyBName}</span> is
                    entering their private bid.
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  Issue: <span className="text-white font-medium">{setup.issue}</span>
                  {" "}· Range: {setup.rangeMin}–{setup.rangeMax}
                  {setup.unit}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Minimum acceptable ({setup.unit})
                    </label>
                    <input
                      type="number"
                      value={bidB.min || ""}
                      onChange={(e) =>
                        setBidB((b) => ({ ...b, min: Number(e.target.value) }))
                      }
                      placeholder={String(setup.rangeMin)}
                      min={setup.rangeMin}
                      max={setup.rangeMax}
                      className="w-full bg-violet-500/5 border border-violet-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/70 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Maximum acceptable ({setup.unit})
                    </label>
                    <input
                      type="number"
                      value={bidB.max || ""}
                      onChange={(e) =>
                        setBidB((b) => ({ ...b, max: Number(e.target.value) }))
                      }
                      placeholder={String(setup.rangeMax)}
                      min={setup.rangeMin}
                      max={setup.rangeMax}
                      className="w-full bg-violet-500/5 border border-violet-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/70 transition-colors"
                    />
                  </div>
                </div>
                <NumberLine
                  rangeMin={setup.rangeMin}
                  rangeMax={setup.rangeMax}
                  bidA={null}
                  bidB={bidB}
                  revealed={false}
                  unit={setup.unit}
                />
              </motion.div>
            )}

            {/* ── REVEAL ── */}
            {phase === "reveal" && result && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {result.settled ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-1"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <div className="text-xl font-bold text-emerald-300">
                      Settlement Reached
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {result.amount}
                      {setup.unit}
                    </div>
                    <div className="text-xs text-emerald-200/70">
                      Ranges overlapped · RCB algorithm applied
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl text-center space-y-1"
                  >
                    <AlertCircle className="w-8 h-8 text-orange-400 mx-auto" />
                    <div className="text-lg font-bold text-orange-300">
                      No Overlap
                    </div>
                    <div className="text-2xl font-bold text-white">
                      Gap: {result.gap}
                      {setup.unit}
                    </div>
                    <div className="text-xs text-orange-200/70">
                      Parties must move closer — consider rebidding
                    </div>
                  </motion.div>
                )}

                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">
                    Both ranges revealed
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-blue-300 w-20 shrink-0 font-mono truncate">
                      {partyAName}
                    </span>
                    <div className="flex-1 h-7 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between px-3">
                      <span className="text-[11px] text-blue-200">
                        {bidA.min}
                        {setup.unit}
                      </span>
                      <span className="text-[9px] text-blue-400">→</span>
                      <span className="text-[11px] text-blue-200">
                        {bidA.max}
                        {setup.unit}
                      </span>
                    </div>
                    <Unlock className="w-3.5 h-3.5 text-blue-400/60 shrink-0" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-violet-300 w-20 shrink-0 font-mono truncate">
                      {partyBName}
                    </span>
                    <div className="flex-1 h-7 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-between px-3">
                      <span className="text-[11px] text-violet-200">
                        {bidB.min}
                        {setup.unit}
                      </span>
                      <span className="text-[9px] text-violet-400">→</span>
                      <span className="text-[11px] text-violet-200">
                        {bidB.max}
                        {setup.unit}
                      </span>
                    </div>
                    <Unlock className="w-3.5 h-3.5 text-violet-400/60 shrink-0" />
                  </div>
                </div>

                <NumberLine
                  rangeMin={setup.rangeMin}
                  rangeMax={setup.rangeMax}
                  bidA={bidA}
                  bidB={bidB}
                  revealed={true}
                  unit={setup.unit}
                  settlementAmount={result.settled ? result.amount : undefined}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/60 bg-slate-800/30">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <div className="flex gap-2">
            {phase === "setup" && (
              <button
                onClick={() => setPhase("partyA")}
                disabled={!setup.issue.trim() || setup.rangeMax <= setup.rangeMin}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Begin Bidding
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {phase === "partyA" && (
              <button
                onClick={() => setPhase("partyB")}
                disabled={!bidA.min && !bidA.max}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {partyAName} Locked In
                <Lock className="w-4 h-4" />
              </button>
            )}
            {phase === "partyB" && (
              <button
                onClick={handleReveal}
                disabled={!bidB.min && !bidB.max}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {partyBName} Locked In · Reveal
                <Unlock className="w-4 h-4" />
              </button>
            )}
            {phase === "reveal" && !result?.settled && (
              <button
                onClick={() => setPhase("partyA")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 text-sm font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Rebid
              </button>
            )}
            {phase === "reveal" && result?.settled && (
              <button
                onClick={handleClose}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Accept & Close
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
