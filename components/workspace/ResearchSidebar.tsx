"use client";

import { useState, useCallback } from "react";
import {
  Search,
  ExternalLink,
  Pin,
  PinOff,
  ChevronDown,
  ChevronRight,
  Globe,
  BookOpen,
} from "lucide-react";

// ── Types ──

export type GroundingChunk = {
  web?: { uri: string; title: string };
  retrievedContext?: { uri: string; title: string };
};

export type GroundingSupport = {
  segment?: { text: string; startIndex?: number; endIndex?: number };
  groundingChunkIndices?: number[];
  confidenceScores?: number[];
};

export type GroundingUpdate = {
  queries?: string[];
  sources?: GroundingChunk[];
  supports?: GroundingSupport[];
};

export type PinnedFinding = {
  id: string;
  query: string;
  sourceTitle: string;
  sourceUrl: string;
  snippet: string;
  pinnedAt: string;
};

interface Props {
  groundingUpdates: GroundingUpdate[];
  onPin?: (finding: PinnedFinding) => void;
}

// ── Component ──

export default function ResearchSidebar({ groundingUpdates, onPin }: Props) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [pinnedFindings, setPinnedFindings] = useState<PinnedFinding[]>([]);
  const [showPinned, setShowPinned] = useState(false);

  const toggleCard = useCallback((index: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const pinFinding = useCallback(
    (query: string, source: GroundingChunk, snippet: string) => {
      const finding: PinnedFinding = {
        id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        query,
        sourceTitle: source.web?.title || source.retrievedContext?.title || "Unknown",
        sourceUrl: source.web?.uri || source.retrievedContext?.uri || "",
        snippet,
        pinnedAt: new Date().toISOString(),
      };
      setPinnedFindings((prev) => [...prev, finding]);
      onPin?.(finding);
    },
    [onPin],
  );

  const unpinFinding = useCallback((id: string) => {
    setPinnedFindings((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const isPinned = useCallback(
    (url: string) => pinnedFindings.some((f) => f.sourceUrl === url),
    [pinnedFindings],
  );

  if (groundingUpdates.length === 0 && pinnedFindings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-500">
        <Globe className="h-8 w-8 mb-2 text-zinc-600" />
        <p className="text-sm font-medium">Research</p>
        <p className="text-xs mt-1">
          Search results will appear here when the AI references external
          sources during mediation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header tabs */}
      <div className="flex border-b border-zinc-700 text-xs">
        <button
          onClick={() => setShowPinned(false)}
          className={`flex-1 px-3 py-2 font-medium transition-colors ${
            !showPinned
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          <Search className="inline h-3 w-3 mr-1" />
          Results ({groundingUpdates.length})
        </button>
        <button
          onClick={() => setShowPinned(true)}
          className={`flex-1 px-3 py-2 font-medium transition-colors ${
            showPinned
              ? "text-amber-400 border-b-2 border-amber-400"
              : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          <Pin className="inline h-3 w-3 mr-1" />
          Pinned ({pinnedFindings.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {showPinned ? (
          // Pinned findings
          pinnedFindings.length === 0 ? (
            <div className="text-center text-xs text-zinc-500 py-4">
              No pinned findings yet. Pin important results to save them.
            </div>
          ) : (
            pinnedFindings.map((finding) => (
              <div
                key={finding.id}
                className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-2.5"
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                    <BookOpen className="h-3 w-3 shrink-0" />
                    <span className="truncate">{finding.sourceTitle}</span>
                  </div>
                  <button
                    onClick={() => unpinFinding(finding.id)}
                    className="shrink-0 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Unpin"
                  >
                    <PinOff className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-300 mt-1 line-clamp-3">
                  {finding.snippet}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-zinc-500 truncate max-w-[70%]">
                    {finding.query}
                  </span>
                  {finding.sourceUrl && (
                    <a
                      href={finding.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                    >
                      Open <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )
        ) : (
          // Grounding updates
          groundingUpdates.map((update, idx) => {
            const isExpanded = expandedCards.has(idx);
            const queryText =
              update.queries?.join(", ") || "AI-initiated search";

            return (
              <div
                key={idx}
                className="rounded-lg border border-zinc-700 bg-zinc-800/60 overflow-hidden"
              >
                {/* Collapsed header */}
                <button
                  onClick={() => toggleCard(idx)}
                  className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-zinc-700/30 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-zinc-400 shrink-0" />
                  )}
                  <Search className="h-3 w-3 text-blue-400 shrink-0" />
                  <span className="text-xs text-zinc-300 truncate flex-1">
                    {queryText}
                  </span>
                  <span className="text-[10px] text-zinc-500 shrink-0">
                    {update.sources?.length ?? 0} source
                    {(update.sources?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-zinc-700/50 p-2 space-y-2">
                    {/* Supports / snippets */}
                    {update.supports && update.supports.length > 0 && (
                      <div className="space-y-1.5">
                        {update.supports.map((support, sIdx) => {
                          const text = support.segment?.text || "";
                          const chunkIdx =
                            support.groundingChunkIndices?.[0] ?? -1;
                          const source =
                            chunkIdx >= 0 ? update.sources?.[chunkIdx] : null;

                          return (
                            <div
                              key={sIdx}
                              className="text-[11px] text-zinc-300 bg-zinc-900/50 rounded p-2 border border-zinc-700/30"
                            >
                              <p className="line-clamp-3">{text}</p>
                              {source && (
                                <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-zinc-700/30">
                                  <span className="text-[10px] text-zinc-500 truncate max-w-[60%]">
                                    {source.web?.title ||
                                      source.retrievedContext?.title ||
                                      "Source"}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        pinFinding(queryText, source, text)
                                      }
                                      disabled={isPinned(
                                        source.web?.uri ||
                                          source.retrievedContext?.uri ||
                                          "",
                                      )}
                                      className={`text-[10px] flex items-center gap-0.5 transition-colors ${
                                        isPinned(
                                          source.web?.uri ||
                                            source.retrievedContext?.uri ||
                                            "",
                                        )
                                          ? "text-amber-500"
                                          : "text-zinc-500 hover:text-amber-400"
                                      }`}
                                    >
                                      <Pin className="h-2.5 w-2.5" />
                                      {isPinned(
                                        source.web?.uri ||
                                          source.retrievedContext?.uri ||
                                          "",
                                      )
                                        ? "Pinned"
                                        : "Pin"}
                                    </button>
                                    {(source.web?.uri ||
                                      source.retrievedContext?.uri) && (
                                      <a
                                        href={
                                          source.web?.uri ||
                                          source.retrievedContext?.uri
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                                      >
                                        <ExternalLink className="h-2.5 w-2.5" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Sources list (when no supports) */}
                    {(!update.supports || update.supports.length === 0) &&
                      update.sources &&
                      update.sources.length > 0 && (
                        <div className="space-y-1">
                          {update.sources.map((source, sIdx) => (
                            <div
                              key={sIdx}
                              className="flex items-center gap-2 text-[11px] text-zinc-400"
                            >
                              <Globe className="h-3 w-3 text-zinc-500 shrink-0" />
                              <span className="truncate flex-1">
                                {source.web?.title ||
                                  source.retrievedContext?.title ||
                                  "Source"}
                              </span>
                              {(source.web?.uri ||
                                source.retrievedContext?.uri) && (
                                <a
                                  href={
                                    source.web?.uri ||
                                    source.retrievedContext?.uri
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
