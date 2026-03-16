"use client";

import { useState, useMemo } from "react";
import { Star, CheckCircle2, Trash2, Filter, Plus } from "lucide-react";
import { cn } from "@/lib/design-system";
import type { Primitive, PrimitiveType, Actor } from "@/lib/types";

const PRIMITIVE_TYPES: PrimitiveType[] = [
  "Actor", "Claim", "Interest", "Constraint", "Leverage", "Commitment", "Event", "Narrative",
];

const TYPE_COLORS: Record<string, string> = {
  Actor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Claim: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Interest: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Constraint: "bg-red-500/20 text-red-300 border-red-500/30",
  Leverage: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Commitment: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Event: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Narrative: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

interface PrimitivesListProps {
  primitives: Primitive[];
  actors: Actor[];
  onPin?: (id: string) => void;
  onResolve?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUpdateType?: (id: string, type: PrimitiveType) => void;
  onUpdateDescription?: (id: string, description: string) => void;
  onAddPrimitive?: (actorId: string) => void;
}

export default function PrimitivesList({
  primitives,
  actors,
  onPin,
  onResolve,
  onDelete,
  onUpdateType,
  onUpdateDescription,
  onAddPrimitive,
}: PrimitivesListProps) {
  const [groupBy, setGroupBy] = useState<"actor" | "type">("actor");
  const [filterType, setFilterType] = useState<PrimitiveType | "all">("all");

  const actorMap = useMemo(() => {
    const m: Record<string, string> = {};
    actors.forEach((a) => { m[a.id] = a.name; });
    return m;
  }, [actors]);

  const filtered = useMemo(() => {
    let result = [...primitives];
    if (filterType !== "all") {
      result = result.filter((p) => p.type === filterType);
    }
    // Pinned first
    result.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return result;
  }, [primitives, filterType]);

  const grouped = useMemo(() => {
    const groups: Record<string, Primitive[]> = {};
    for (const p of filtered) {
      const key = groupBy === "actor" ? (actorMap[p.actorId] || "Unknown") : p.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    return groups;
  }, [filtered, groupBy, actorMap]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-1 text-[10px]">
          <Filter className="w-3 h-3 text-[var(--color-text-muted)]" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as PrimitiveType | "all")}
            className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2 py-1 text-[10px] text-[var(--color-text-muted)] focus:outline-none"
          >
            <option value="all">All types</option>
            {PRIMITIVE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-[var(--color-text-muted)]">Group:</span>
          <button
            onClick={() => setGroupBy("actor")}
            className={cn(
              "px-2 py-0.5 rounded text-[10px]",
              groupBy === "actor" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-muted)] hover:text-white"
            )}
          >
            Actor
          </button>
          <button
            onClick={() => setGroupBy("type")}
            className={cn(
              "px-2 py-0.5 rounded text-[10px]",
              groupBy === "type" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-muted)] hover:text-white"
            )}
          >
            Type
          </button>
        </div>
        <span className="text-[10px] text-[var(--color-text-muted)] ml-auto">
          {filtered.length} primitive{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3">
            <h4 className="text-xs font-semibold text-white mb-2">{group}</h4>
            <div className="space-y-1.5 pl-3 border-l-2 border-[var(--color-surface-hover)]">
              {items.map((prim) => (
                <div
                  key={prim.id}
                  className={cn(
                    "flex items-start gap-2 group rounded-lg px-2 py-1 transition-colors",
                    prim.resolved && "opacity-50",
                    prim.pinned && "bg-amber-500/5 border border-amber-500/20",
                  )}
                >
                  {/* Type badge */}
                  {onUpdateType ? (
                    <select
                      value={prim.type}
                      onChange={(e) => onUpdateType(prim.id, e.target.value as PrimitiveType)}
                      className="bg-[var(--color-surface)] text-xs font-mono p-1 rounded border border-[var(--color-border)] text-[var(--color-accent)] focus:outline-none cursor-pointer"
                    >
                      {PRIMITIVE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-mono shrink-0", TYPE_COLORS[prim.type])}>
                      {prim.type}
                    </span>
                  )}

                  {/* Description */}
                  {onUpdateDescription ? (
                    <input
                      value={prim.description}
                      onChange={(e) => onUpdateDescription(prim.id, e.target.value)}
                      className={cn(
                        "bg-transparent text-sm flex-1 focus:outline-none border-b border-transparent focus:border-[var(--color-accent)] px-1",
                        prim.resolved ? "line-through text-[var(--color-text-muted)]" : "text-white",
                      )}
                      placeholder="Description..."
                    />
                  ) : (
                    <p className={cn("text-sm flex-1", prim.resolved ? "line-through text-[var(--color-text-muted)]" : "text-white")}>
                      {prim.description}
                    </p>
                  )}

                  {/* Actions */}
                  {onPin && (
                    <button
                      onClick={() => onPin(prim.id)}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 p-1 transition-opacity",
                        prim.pinned ? "text-amber-400 opacity-100" : "text-[var(--color-text-muted)] hover:text-amber-400",
                      )}
                      title={prim.pinned ? "Unpin" : "Pin"}
                    >
                      <Star className="w-3 h-3" />
                    </button>
                  )}
                  {onResolve && (
                    <button
                      onClick={() => onResolve(prim.id)}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 p-1 transition-opacity",
                        prim.resolved ? "text-emerald-400 opacity-100" : "text-[var(--color-text-muted)] hover:text-emerald-400",
                      )}
                      title={prim.resolved ? "Reopen" : "Mark resolved"}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(prim.id)}
                      className="opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] p-1 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {onAddPrimitive && groupBy === "actor" && (
                <button
                  onClick={() => {
                    const actor = actors.find((a) => a.name === group);
                    if (actor) onAddPrimitive(actor.id);
                  }}
                  className="text-xs text-[var(--color-text-muted)] hover:text-white flex items-center gap-1 mt-2 py-1 px-2 rounded hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Primitive
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">No primitives extracted yet</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 opacity-60">
              Start a session or run extraction to populate
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
