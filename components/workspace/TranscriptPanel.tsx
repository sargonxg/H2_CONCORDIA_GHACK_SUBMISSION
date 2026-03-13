"use client";

import { RefObject } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, ChevronDown, Database, Activity, Target } from "lucide-react";

interface TranscriptTurn {
  timestamp: string;
  speaker: string;
  text: string;
}

export function parseTranscript(raw: string): TranscriptTurn[] {
  return raw
    .split("\n\n")
    .filter(Boolean)
    .map((block) => {
      const match = block.match(/^\[(\d{2}:\d{2})\]\s*\[([^\]]+)\]:\s*(.*)/s);
      if (match) return { timestamp: match[1] ?? "", speaker: match[2] ?? "", text: match[3] ?? "" };
      return { timestamp: "", speaker: "System", text: block };
    });
}

interface Props {
  transcript: string;
  isLive: boolean;
  isRecording: boolean;
  transcriptEndRef: RefObject<HTMLDivElement | null>;
  autoScrollEnabled: boolean;
  setAutoScrollEnabled: (v: boolean) => void;
  extractionNotice: boolean;
  partyAName?: string;
  partyBName?: string;
  onTranscriptChange: (val: string) => void;
  onScrollToLatest: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export default function TranscriptPanel({
  transcript,
  isLive,
  isRecording,
  transcriptEndRef,
  autoScrollEnabled,
  setAutoScrollEnabled,
  extractionNotice,
  partyAName = "Party A",
  partyBName = "Party B",
  onTranscriptChange,
  onScrollToLatest,
  onAnalyze,
  isAnalyzing,
}: Props) {
  const turns = parseTranscript(transcript);

  function getSpeakerStyle(speaker: string) {
    if (speaker === "Concordia") {
      return {
        containerClass: "items-start",
        bubbleClass:
          "bg-[var(--color-surface)] border-l-2 border-amber-500/60 rounded-r-xl rounded-bl-xl",
        nameClass: "text-amber-400",
        isPulsing: isRecording,
      };
    }
    if (speaker === "Speaker" || speaker === partyAName || speaker === partyBName) {
      return {
        containerClass: "items-end",
        bubbleClass:
          "bg-sky-500/10 border-r-2 border-sky-500/50 rounded-l-xl rounded-br-xl",
        nameClass: "text-sky-400",
        isPulsing: false,
      };
    }
    return {
      containerClass: "items-start",
      bubbleClass: "bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl",
      nameClass: "text-[var(--color-text-muted)]",
      isPulsing: false,
    };
  }

  return (
    <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">
            {turns.length} turn{turns.length !== 1 ? "s" : ""}
          </span>
          <AnimatePresence>
            {extractionNotice && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400"
              >
                <Database className="w-2.5 h-2.5" />
                Extracting primitives…
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {isLive && (
          <button
            onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors ${
              autoScrollEnabled
                ? "border-[var(--color-accent)]/30 text-[var(--color-accent)] bg-[var(--color-accent)]/5"
                : "border-[var(--color-border)] text-[var(--color-text-muted)]"
            }`}
            title="Toggle auto-scroll"
          >
            <ChevronDown className="w-3 h-3" />
            Auto-scroll
          </button>
        )}
      </div>

      {/* Transcript body */}
      {isLive ? (
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
          onScroll={(e) => {
            const el = e.currentTarget;
            const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
            setAutoScrollEnabled(atBottom);
          }}
        >
          {transcript ? (
            turns.map((turn, i) => {
              const style = getSpeakerStyle(turn.speaker);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className={`flex flex-col gap-1 ${style.containerClass}`}
                >
                  <div className="flex items-center gap-2">
                    {style.isPulsing && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                    <span className={`text-[10px] font-semibold ${style.nameClass}`}>
                      {turn.speaker}
                    </span>
                    {turn.timestamp && (
                      <span className="text-[9px] font-mono text-[var(--color-text-muted)]">
                        {turn.timestamp}
                      </span>
                    )}
                  </div>
                  <div className={`max-w-[85%] px-3 py-2 ${style.bubbleClass}`}>
                    <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">
                      {turn.text}
                    </p>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] py-12">
              <Mic className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">Waiting for conversation…</p>
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>
      ) : (
        /* Editable textarea when not live */
        <textarea
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder={`Enter initial context here, or start the Live Session to begin mediation between ${partyAName} and ${partyBName}...`}
          className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-sm leading-relaxed text-white placeholder-[var(--color-text-muted)] font-mono p-4"
        />
      )}

      {/* Footer bar */}
      <div className="mt-auto pt-3 px-4 pb-3 border-t border-[var(--color-border)] flex items-center justify-between shrink-0">
        {isLive && !autoScrollEnabled && (
          <button
            onClick={onScrollToLatest}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <Activity className="w-3 h-3" />
            Scroll to latest
          </button>
        )}
        <div className="ml-auto">
          <button
            onClick={onAnalyze}
            disabled={!transcript || isAnalyzing || isRecording}
            className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-[var(--color-accent)]/20"
          >
            <Target className="w-4 h-4" />
            Analyze &amp; Find Pathways
          </button>
        </div>
      </div>
    </div>
  );
}
