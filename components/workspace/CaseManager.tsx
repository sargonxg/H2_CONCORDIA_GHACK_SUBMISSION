"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, FolderOpen, Users, Network, X, FileText } from "lucide-react";
import type { Case, Actor } from "@/lib/types";

// ── Case templates ──────────────────────────────────────────────────────────

interface CaseTemplate {
  name: string;
  partyAName: string;
  partyBName: string;
  actors: Actor[];
  suggestedContext: string;
  icon: string;
}

export const CASE_TEMPLATES: CaseTemplate[] = [
  {
    name: "Workplace Conflict",
    partyAName: "Employee",
    partyBName: "Manager",
    icon: "💼",
    actors: [
      { id: "a1", name: "Employee", role: "Disputant" },
      { id: "a2", name: "Manager", role: "Disputant" },
      { id: "a3", name: "HR Representative", role: "Observer" },
    ],
    suggestedContext:
      "Workplace dispute involving performance expectations, communication breakdown, or interpersonal conflict.",
  },
  {
    name: "Commercial Dispute",
    partyAName: "Buyer",
    partyBName: "Seller",
    icon: "📋",
    actors: [
      { id: "a1", name: "Buyer", role: "Disputant" },
      { id: "a2", name: "Seller", role: "Disputant" },
    ],
    suggestedContext:
      "Contract or transaction dispute over terms, delivery, quality, or payment.",
  },
  {
    name: "Family Mediation",
    partyAName: "Party A",
    partyBName: "Party B",
    icon: "🏠",
    actors: [
      { id: "a1", name: "Party A", role: "Family Member" },
      { id: "a2", name: "Party B", role: "Family Member" },
    ],
    suggestedContext: "Family or relationship dispute involving shared resources, inheritance, or relationship breakdown.",
  },
  {
    name: "Neighbor Dispute",
    partyAName: "Neighbor A",
    partyBName: "Neighbor B",
    icon: "🏘️",
    actors: [
      { id: "a1", name: "Neighbor A", role: "Disputant" },
      { id: "a2", name: "Neighbor B", role: "Disputant" },
    ],
    suggestedContext: "Property, noise, boundary, or shared-space dispute between neighbors.",
  },
  {
    name: "Community Conflict",
    partyAName: "Community Group A",
    partyBName: "Community Group B",
    icon: "🤝",
    actors: [
      { id: "a1", name: "Community Group A", role: "Disputant" },
      { id: "a2", name: "Community Group B", role: "Disputant" },
      { id: "a3", name: "Facilitator", role: "Observer" },
    ],
    suggestedContext:
      "Inter-group or community-level conflict over resources, identity, or shared space.",
  },
  {
    name: "Blank Case",
    partyAName: "Party A",
    partyBName: "Party B",
    icon: "📄",
    actors: [
      { id: "a1", name: "Party A", role: "Disputant" },
      { id: "a2", name: "Party B", role: "Disputant" },
    ],
    suggestedContext: "",
  },
];

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  cases: Case[];
  activeCaseId: string | null;
  onSelect: (id: string) => void;
  onCreate: (template: CaseTemplate) => void;
  onDelete: (id: string) => void;
}

// ── Template picker modal ────────────────────────────────────────────────────

function TemplateModal({
  onSelect,
  onClose,
}: {
  onSelect: (t: CaseTemplate) => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
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
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--color-accent)]" />
              New Mediation Case
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded-lg text-[var(--color-text-muted)] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Choose a template to pre-configure actors and context, or start blank.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {CASE_TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => { onSelect(t); onClose(); }}
                className="flex flex-col items-start gap-2 p-4 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5 transition-all text-left group"
              >
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-[var(--color-accent)] transition-colors">
                    {t.name}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                    {t.partyAName} vs {t.partyBName}
                  </p>
                  {t.actors.length > 2 && (
                    <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5">
                      +{t.actors.length - 2} additional actor{t.actors.length - 2 > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function CaseManager({ cases, activeCaseId, onSelect, onCreate, onDelete }: Props) {
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] border-r border-[var(--color-border)]">
      {/* Header */}
      <div className="px-3 py-3 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
            Cases
          </span>
          <button
            onClick={() => setShowTemplates(true)}
            className="w-6 h-6 rounded-md bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
            title="New Case"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Case list */}
      <div className="flex-1 overflow-y-auto py-1">
        {cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] px-3 text-center">
            <FolderOpen className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs">No cases yet</p>
            <button
              onClick={() => setShowTemplates(true)}
              className="text-[10px] text-[var(--color-accent)] mt-2 hover:underline"
            >
              Create one →
            </button>
          </div>
        ) : (
          cases.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`group relative cursor-pointer px-3 py-2.5 border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)] transition-colors ${
                c.id === activeCaseId ? "bg-[var(--color-accent)]/5 border-l-2 border-l-[var(--color-accent)]" : ""
              }`}
            >
              <p className={`text-xs font-medium truncate ${c.id === activeCaseId ? "text-[var(--color-accent)]" : "text-white"}`}>
                {c.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-[var(--color-text-muted)] flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" />
                  {c.partyAName} vs {c.partyBName}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] text-[var(--color-text-muted)] flex items-center gap-1">
                  <Network className="w-2.5 h-2.5" />
                  {c.primitives.length}p
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)]">
                  · {new Date(c.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {showTemplates && (
        <TemplateModal onSelect={onCreate} onClose={() => setShowTemplates(false)} />
      )}
    </div>
  );
}
