"use client";

import { useRef, useEffect, useState, RefObject } from "react";
import { Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/design-system";
import { CONCORDIA_DESIGN } from "@/lib/design-system";

export interface TranscriptEntry {
  speaker: string; // "Concordia" | partyAName | partyBName | "Speaker"
  text: string;
  timestamp: string; // e.g. "[02:15]"
}

interface LiveTranscriptProps {
  entries: TranscriptEntry[];
  partyAName: string;
  partyBName: string;
  autoScrollEnabled: boolean;
  onToggleAutoScroll: () => void;
  transcriptEndRef?: RefObject<HTMLDivElement | null>;
}

function speakerColor(speaker: string, partyAName: string, partyBName: string): string {
  const lower = speaker.toLowerCase();
  if (lower === "concordia") return CONCORDIA_DESIGN.colors.accent.primary;
  if (lower === partyAName.toLowerCase() || lower === "speaker") return CONCORDIA_DESIGN.colors.partyA.base;
  if (lower === partyBName.toLowerCase()) return CONCORDIA_DESIGN.colors.partyB.base;
  return CONCORDIA_DESIGN.colors.text.secondary;
}

function speakerLabel(speaker: string, partyAName: string, partyBName: string): string {
  const lower = speaker.toLowerCase();
  if (lower === "concordia") return "CONCORDIA";
  if (lower === "speaker") return partyAName;
  return speaker;
}

export default function LiveTranscript({
  entries,
  partyAName,
  partyBName,
  autoScrollEnabled,
  onToggleAutoScroll,
  transcriptEndRef,
}: LiveTranscriptProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border-subtle)] shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">
          Live Transcript
        </span>
        <button
          onClick={onToggleAutoScroll}
          className={cn(
            "flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md transition-colors",
            autoScrollEnabled
              ? "text-[var(--color-success)] bg-[var(--color-success)]/10"
              : "text-[var(--color-text-muted)] hover:text-white"
          )}
          title={autoScrollEnabled ? "Auto-scroll ON" : "Auto-scroll OFF"}
        >
          {autoScrollEnabled ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          {autoScrollEnabled ? "Scroll locked" : "Scroll unlocked"}
        </button>
      </div>

      {/* Transcript entries */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-sm italic">
            Waiting for conversation...
          </div>
        ) : (
          entries.map((entry, idx) => {
            const color = speakerColor(entry.speaker, partyAName, partyBName);
            const label = speakerLabel(entry.speaker, partyAName, partyBName);
            return (
              <div key={idx} className="flex gap-3 group">
                {/* Timestamp */}
                <span className="text-[10px] font-mono text-[var(--color-text-muted)] mt-1 shrink-0 w-12 opacity-60 group-hover:opacity-100 transition-opacity">
                  {entry.timestamp}
                </span>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span
                    className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-0.5"
                    style={{ color }}
                  >
                    {label}
                  </span>
                  <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                    {entry.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={transcriptEndRef} />
      </div>
    </div>
  );
}

/**
 * Parse a raw transcript string into structured entries.
 * Expected format: "[MM:SS] [SpeakerName]: Text content"
 */
export function parseTranscript(raw: string): TranscriptEntry[] {
  if (!raw.trim()) return [];
  const blocks = raw.split(/\n\n+/);
  const entries: TranscriptEntry[] = [];

  for (const block of blocks) {
    const match = block.match(/^\[(\d{2}:\d{2})\]\s*\[([^\]]+)\]:\s*(.*)/s);
    if (match) {
      entries.push({
        timestamp: match[1]!,
        speaker: match[2]!,
        text: match[3]!.trim(),
      });
    } else {
      // Fallback: treat as a raw utterance
      const simpleMatch = block.match(/^\[([^\]]+)\]:\s*(.*)/s);
      if (simpleMatch) {
        entries.push({
          timestamp: "",
          speaker: simpleMatch[1]!,
          text: simpleMatch[2]!.trim(),
        });
      } else if (block.trim()) {
        entries.push({
          timestamp: "",
          speaker: "System",
          text: block.trim(),
        });
      }
    }
  }

  return entries;
}
