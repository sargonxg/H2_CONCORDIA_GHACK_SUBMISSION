"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Keyboard } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "Space", desc: "Start / Stop session", context: "When no input focused" },
  { key: "Ctrl+E", desc: "Run extraction (analyze transcript)", context: "Session not live" },
  { key: "Ctrl+Shift+S", desc: "Generate case summary", context: "Has transcript" },
  { key: "1–5", desc: "Switch tabs (Transcript → Timeline)", context: "" },
  { key: "Escape", desc: "Close modals / overlays", context: "" },
  { key: "?", desc: "Show this help panel", context: "No input focused" },
];

export default function KeyboardShortcutsHelp({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[var(--color-accent)]" />
                Keyboard Shortcuts
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded-lg text-[var(--color-text-muted)] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {SHORTCUTS.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between gap-4 py-2 border-b border-[var(--color-border)]/50 last:border-0"
                >
                  <div>
                    <p className="text-sm text-white">{s.desc}</p>
                    {s.context && (
                      <p className="text-[10px] text-[var(--color-text-muted)]">{s.context}</p>
                    )}
                  </div>
                  <kbd className="shrink-0 px-2.5 py-1 text-xs font-mono bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-accent)] whitespace-nowrap">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-4 text-center">
              Press <kbd className="px-1.5 py-0.5 text-[9px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded font-mono">?</kbd> anytime to reopen
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
