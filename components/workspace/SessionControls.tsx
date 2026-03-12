"use client";

import { Mic, Square, Activity, Settings2, Download, BookOpen, Timer } from "lucide-react";

interface MediatorProfile {
  voice: string;
  approach: string;
  style: "professional" | "empathic";
}

interface Props {
  isRecording: boolean;
  status: string;
  sessionDuration: number;
  demoMode: boolean;
  mediatorProfile: MediatorProfile;
  setMediatorProfile: (p: MediatorProfile) => void;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  showExport: boolean;
  setShowExport: (v: boolean) => void;
  onStart: () => void;
  onStop: () => void;
  onDemo: () => void;
  onExportMarkdown: () => void;
  onExportJSON: () => void;
  onExportTranscript: () => void;
  onGenerateSummary: () => void;
  hasTranscript: boolean;
  summaryLoading: boolean;
  hasSummaryData: boolean;
  onCopySummary: () => void;
  onCopyTranscript: () => void;
}

export default function SessionControls({
  isRecording,
  status,
  sessionDuration,
  demoMode,
  mediatorProfile,
  setMediatorProfile,
  showSettings,
  setShowSettings,
  showExport,
  setShowExport,
  onStart,
  onStop,
  onDemo,
  onExportMarkdown,
  onExportJSON,
  onExportTranscript,
  onGenerateSummary,
  hasTranscript,
  summaryLoading,
  hasSummaryData,
  onCopySummary,
  onCopyTranscript,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      {/* Summary */}
      <button
        onClick={onGenerateSummary}
        disabled={!hasTranscript || summaryLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white hover:border-[var(--color-accent)] transition-colors disabled:opacity-40"
        title="Generate Case Summary (Ctrl+Shift+S)"
      >
        <BookOpen className="w-4 h-4" />
        Summary
      </button>

      {/* Settings */}
      <div className="relative">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-[var(--color-surface-hover)] rounded-md text-[var(--color-text-muted)] hover:text-white transition-colors"
          title="Mediator Settings"
        >
          <Settings2 className="w-5 h-5" />
        </button>

        {showSettings && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl p-4 z-50">
            <h3 className="text-sm font-semibold mb-3">Mediator Profile</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Style</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["professional", "empathic"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        setMediatorProfile({
                          ...mediatorProfile,
                          style: s,
                          voice: s === "professional" ? "Zephyr" : "Kore",
                        })
                      }
                      className={`p-2 rounded-lg border text-left transition-all ${
                        mediatorProfile.style === s
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-white"
                          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/50"
                      }`}
                    >
                      <div className="text-xs font-semibold capitalize">{s}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Voice</label>
                <select
                  value={mediatorProfile.voice}
                  onChange={(e) =>
                    setMediatorProfile({ ...mediatorProfile, voice: e.target.value })
                  }
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-sm p-1.5 focus:outline-none focus:border-[var(--color-accent)]"
                >
                  <optgroup label="Mediation Contexts">
                    <option value="Zephyr">Zephyr — Calm, authoritative, measured</option>
                    <option value="Kore">Kore — Warm, gentle, emotionally present</option>
                    <option value="Orus">Orus — Direct, grounded, clear boundaries</option>
                    <option value="Aoede">Aoede — Encouraging, collaborative, light</option>
                  </optgroup>
                  <optgroup label="Additional Voices">
                    <option value="Puck">Puck — Direct, Clear</option>
                    <option value="Charon">Charon — Deep, Authoritative</option>
                    <option value="Fenrir">Fenrir — Steady, Measured</option>
                    <option value="Leda">Leda — Gentle, Patient</option>
                    <option value="Perseus">Perseus — Confident, Clear</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Approach</label>
                <select
                  value={mediatorProfile.approach}
                  onChange={(e) =>
                    setMediatorProfile({ ...mediatorProfile, approach: e.target.value })
                  }
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-sm p-1.5 focus:outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="Facilitative">Facilitative</option>
                  <option value="Evaluative">Evaluative</option>
                  <option value="Transformative">Transformative</option>
                  <option value="Narrative">Narrative</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export */}
      <div className="relative">
        <button
          onClick={() => setShowExport(!showExport)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white hover:border-[var(--color-accent)] transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
        {showExport && (
          <div className="absolute top-full right-0 mt-1 w-52 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl z-50 overflow-hidden">
            {[
              { label: "Export Markdown", action: onExportMarkdown },
              { label: "Export JSON", action: onExportJSON },
              { label: "Export Transcript", action: onExportTranscript },
              { label: "Copy Transcript", action: onCopyTranscript },
              { label: "Copy Summary", action: onCopySummary },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={() => { action(); setShowExport(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status chip */}
      <div className="flex items-center gap-2 text-sm font-mono bg-[var(--color-bg)] px-3 py-1.5 rounded-md border border-[var(--color-border)]">
        <span
          className={`w-2 h-2 rounded-full ${
            demoMode
              ? "bg-amber-500 animate-pulse"
              : status === "RECONNECTING"
              ? "bg-yellow-500 animate-pulse"
              : isRecording
              ? "bg-red-500 animate-pulse"
              : status === "ANALYZING"
              ? "bg-amber-500 animate-pulse"
              : "bg-gray-500"
          }`}
        />
        {status}
        {(isRecording || status === "LIVE") && sessionDuration > 0 && (
          <span className="text-[var(--color-text-muted)] ml-1 text-xs">
            <Timer className="w-3 h-3 inline mr-0.5" />
            {String(Math.floor(sessionDuration / 60)).padStart(2, "0")}:
            {String(sessionDuration % 60).padStart(2, "0")}
          </span>
        )}
      </div>

      {/* Start / Stop */}
      {isRecording ? (
        <button
          onClick={onStop}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all"
        >
          <Square className="w-4 h-4" />
          End Session
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={onStart}
            title="Start live session (Space)"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-lg shadow-[var(--color-accent)]/20 transition-all"
          >
            <Mic className="w-4 h-4" />
            Start Session
          </button>
          <button
            onClick={onDemo}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 text-sm transition-all"
          >
            <Activity className="w-4 h-4" />
            Demo
          </button>
        </div>
      )}
    </div>
  );
}
