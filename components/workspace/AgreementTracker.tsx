"use client";

import { motion, AnimatePresence } from "motion/react";
import { Shield, CheckCircle2 } from "lucide-react";
import type { Agreement } from "@/lib/types";

interface Props {
  agreements: Agreement[];
}

export default function AgreementTracker({ agreements }: Props) {
  if (agreements.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--color-surface)] border border-emerald-500/30 rounded-xl p-4"
      >
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> Agreements ({agreements.length})
        </h3>
        <div className="space-y-2">
          {agreements.slice(-5).map((ag) => (
            <div
              key={ag.id}
              className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold text-emerald-300 flex-1 truncate">
                  {ag.topic}
                </span>
                <div className="flex gap-1">
                  <span
                    className={`text-[8px] px-1 rounded font-mono ${
                      ag.partyAAccepts
                        ? "text-emerald-400 bg-emerald-400/10"
                        : "text-gray-500 bg-gray-500/10"
                    }`}
                  >
                    A {ag.partyAAccepts ? "✓" : "?"}
                  </span>
                  <span
                    className={`text-[8px] px-1 rounded font-mono ${
                      ag.partyBAccepts
                        ? "text-emerald-400 bg-emerald-400/10"
                        : "text-gray-500 bg-gray-500/10"
                    }`}
                  >
                    B {ag.partyBAccepts ? "✓" : "?"}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-white leading-snug">{ag.terms}</p>
              {ag.conditions.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {ag.conditions.map((c, i) => (
                    <li key={i} className="text-[9px] text-emerald-200/60 flex items-start gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
