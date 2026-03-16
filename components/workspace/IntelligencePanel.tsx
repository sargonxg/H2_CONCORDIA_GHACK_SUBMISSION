"use client";

import { useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Brain,
  Heart,
  Search,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import type {
  EmotionSnapshot,
  LiveMediationState,
  EscalationFlag,
  Agreement,
  SolutionProposal,
} from "@/lib/types";

// ── Constants ──
const PARTY_A_COLOR = "#4ECDC4"; // teal
const PARTY_B_COLOR = "#A78BFA"; // violet

type Tab = "emotions" | "insights" | "research" | "agreements";

interface IntelligencePanelProps {
  emotionTimeline: EmotionSnapshot[];
  mediationState: LiveMediationState | null;
  escalationFlags: EscalationFlag[];
  agreements: Agreement[];
  solutions: SolutionProposal[];
  mediatorThought: string;
  groundingResults: any[];
  partyAName: string;
  partyBName: string;
}

const TAB_CONFIG: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "emotions", label: "Emotions", icon: <Heart size={14} /> },
  { id: "insights", label: "Insights", icon: <Brain size={14} /> },
  { id: "research", label: "Research", icon: <Search size={14} /> },
  { id: "agreements", label: "Agreements", icon: <CheckCircle2 size={14} /> },
];

export default function IntelligencePanel({
  emotionTimeline,
  mediationState,
  escalationFlags,
  agreements,
  solutions,
  mediatorThought,
  groundingResults,
  partyAName,
  partyBName,
}: IntelligencePanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("emotions");

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
        }}
      >
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "8px 4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? "var(--color-text)" : "var(--color-text-muted)",
              background: activeTab === tab.id ? "rgba(255,255,255,0.05)" : "transparent",
              borderBottom: activeTab === tab.id ? "2px solid #4ECDC4" : "2px solid transparent",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {activeTab === "emotions" && (
          <EmotionsTab
            emotionTimeline={emotionTimeline}
            mediationState={mediationState}
            escalationFlags={escalationFlags}
            partyAName={partyAName}
            partyBName={partyBName}
          />
        )}
        {activeTab === "insights" && (
          <InsightsTab
            mediationState={mediationState}
            solutions={solutions}
            mediatorThought={mediatorThought}
          />
        )}
        {activeTab === "research" && (
          <ResearchTab groundingResults={groundingResults} />
        )}
        {activeTab === "agreements" && (
          <AgreementsTab
            agreements={agreements}
            partyAName={partyAName}
            partyBName={partyBName}
          />
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Emotions Tab
// ════════════════════════════════════════════════════════════════════════════

function EmotionsTab({
  emotionTimeline,
  mediationState,
  escalationFlags,
  partyAName,
  partyBName,
}: {
  emotionTimeline: EmotionSnapshot[];
  mediationState: LiveMediationState | null;
  escalationFlags: EscalationFlag[];
  partyAName: string;
  partyBName: string;
}) {
  const chartData = emotionTimeline.map((snap) => ({
    time: snap.elapsedSeconds
      ? `${Math.floor(snap.elapsedSeconds / 60)}:${String(snap.elapsedSeconds % 60).padStart(2, "0")}`
      : snap.timestamp?.substring(11, 16) || "",
    partyA: snap.partyA?.emotionalIntensity ?? 0,
    partyB: snap.partyB?.emotionalIntensity ?? 0,
    escalation: snap.escalationScore ?? 0,
  }));

  const partyA = mediationState?.partyProfiles?.partyA;
  const partyB = mediationState?.partyProfiles?.partyB;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Emotion intensity chart */}
      {chartData.length > 0 ? (
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--color-text-muted)" }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: "var(--color-text-muted)" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  fontSize: 11,
                }}
              />
              <ReferenceLine y={7} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Escalation", fontSize: 9, fill: "#ef4444" }} />
              <Area
                type="monotone"
                dataKey="partyA"
                fill={PARTY_A_COLOR}
                fillOpacity={0.15}
                stroke={PARTY_A_COLOR}
                strokeWidth={2}
                name={partyAName}
              />
              <Area
                type="monotone"
                dataKey="partyB"
                fill={PARTY_B_COLOR}
                fillOpacity={0.15}
                stroke={PARTY_B_COLOR}
                strokeWidth={2}
                name={partyBName}
              />
              <Line
                type="monotone"
                dataKey="escalation"
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Escalation"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ color: "var(--color-text-muted)", fontSize: 11, textAlign: "center", padding: 20 }}>
          Emotion data will appear as the conversation progresses...
        </div>
      )}

      {/* Current emotional state cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <EmotionCard
          name={partyAName}
          color={PARTY_A_COLOR}
          profile={partyA}
        />
        <EmotionCard
          name={partyBName}
          color={PARTY_B_COLOR}
          profile={partyB}
        />
      </div>

      {/* Escalation flags */}
      {escalationFlags.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#ef4444", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <AlertTriangle size={12} /> Escalation Flags
          </div>
          {escalationFlags.slice(-3).map((flag) => (
            <div
              key={flag.id}
              style={{
                fontSize: 10,
                padding: "4px 8px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 4,
                marginBottom: 4,
                color: "var(--color-text)",
              }}
            >
              <span style={{ fontWeight: 600 }}>{flag.trigger}</span>
              <span style={{ color: "var(--color-text-muted)" }}> — {flag.deEscalationTechnique}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmotionCard({
  name,
  color,
  profile,
}: {
  name: string;
  color: string;
  profile: any;
}) {
  return (
    <div
      style={{
        padding: 8,
        borderRadius: 6,
        border: `1px solid ${color}33`,
        background: `${color}0A`,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 600, color, marginBottom: 4 }}>{name}</div>
      {profile ? (
        <>
          <div style={{ fontSize: 10, color: "var(--color-text)" }}>
            {profile.emotionalState || "—"}
          </div>
          <div style={{ fontSize: 9, color: "var(--color-text-muted)", marginTop: 2 }}>
            Intensity: {profile.emotionalIntensity ?? "—"}/10
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <MiniBar label="Coop" value={profile.cooperativeness ?? 0} color="#10b981" />
            <MiniBar label="Def" value={profile.defensiveness ?? 0} color="#f59e0b" />
          </div>
        </>
      ) : (
        <div style={{ fontSize: 9, color: "var(--color-text-muted)" }}>Awaiting data...</div>
      )}
    </div>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 8, color: "var(--color-text-muted)", marginBottom: 2 }}>{label}</div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(value, 100)}%`, background: color, borderRadius: 2 }} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Insights Tab
// ════════════════════════════════════════════════════════════════════════════

function InsightsTab({
  mediationState,
  solutions,
  mediatorThought,
}: {
  mediationState: LiveMediationState | null;
  solutions: SolutionProposal[];
  mediatorThought: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Current strategy */}
      {mediationState?.currentAction && (
        <Section title="Current Strategy" icon={<Brain size={12} />}>
          <div style={{ fontSize: 11, color: "var(--color-text)" }}>{mediationState.currentAction}</div>
        </Section>
      )}

      {/* Mediator thought */}
      {mediatorThought && (
        <Section title="Mediator Reasoning" icon={<TrendingUp size={12} />}>
          <div style={{ fontSize: 10, color: "var(--color-text-muted)", fontStyle: "italic" }}>
            {mediatorThought.substring(0, 300)}
            {mediatorThought.length > 300 && "..."}
          </div>
        </Section>
      )}

      {/* Information gaps */}
      {mediationState?.missingItems && mediationState.missingItems.length > 0 && (
        <Section title="Information Gaps" icon={<AlertTriangle size={12} />}>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: "var(--color-text-muted)" }}>
            {mediationState.missingItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Common ground */}
      {mediationState?.commonGround && mediationState.commonGround.length > 0 && (
        <Section title="Common Ground" icon={<CheckCircle2 size={12} />}>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: "#10b981" }}>
            {mediationState.commonGround.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Tension points */}
      {mediationState?.tensionPoints && mediationState.tensionPoints.length > 0 && (
        <Section title="Tension Points" icon={<AlertTriangle size={12} />}>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: "#f59e0b" }}>
            {mediationState.tensionPoints.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Proposed solutions */}
      {solutions.length > 0 && (
        <Section title="Proposed Solutions" icon={<TrendingUp size={12} />}>
          {solutions.slice(-3).map((sol) => (
            <div
              key={sol.id}
              style={{
                fontSize: 10,
                padding: "4px 8px",
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: 4,
                marginBottom: 4,
              }}
            >
              <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{sol.title}</div>
              <div style={{ color: "var(--color-text-muted)", marginTop: 2 }}>{sol.description}</div>
              {sol.framework && (
                <div style={{ color: "#A78BFA", fontSize: 9, marginTop: 2 }}>Framework: {sol.framework}</div>
              )}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Research Tab
// ════════════════════════════════════════════════════════════════════════════

function ResearchTab({ groundingResults }: { groundingResults: any[] }) {
  if (groundingResults.length === 0) {
    return (
      <div style={{ color: "var(--color-text-muted)", fontSize: 11, textAlign: "center", padding: 20 }}>
        Google Search grounding results will appear when the mediator verifies factual claims...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {groundingResults.slice().reverse().map((result, i) => (
        <div
          key={i}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid var(--color-border)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {/* Search queries */}
          {result.queries && result.queries.length > 0 && (
            <div style={{ fontSize: 10, color: "var(--color-text)", marginBottom: 4 }}>
              <Search size={10} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
              {result.queries.join(" | ")}
            </div>
          )}

          {/* Sources */}
          {result.sources && result.sources.length > 0 && (
            <div style={{ fontSize: 9, color: "var(--color-text-muted)" }}>
              {result.sources.slice(0, 3).map((source: any, j: number) => (
                <div key={j} style={{ marginTop: 2 }}>
                  {source.web?.title || source.web?.uri || "Source"}
                  {source.web?.uri && (
                    <span style={{ color: "#4ECDC4", marginLeft: 4 }}>
                      [{new URL(source.web.uri).hostname}]
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Timestamp */}
          {result.timestamp && (
            <div style={{ fontSize: 8, color: "var(--color-text-muted)", marginTop: 4 }}>
              {new Date(result.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Agreements Tab
// ════════════════════════════════════════════════════════════════════════════

function AgreementsTab({
  agreements,
  partyAName,
  partyBName,
}: {
  agreements: Agreement[];
  partyAName: string;
  partyBName: string;
}) {
  if (agreements.length === 0) {
    return (
      <div style={{ color: "var(--color-text-muted)", fontSize: 11, textAlign: "center", padding: 20 }}>
        Agreements will be captured as parties reach consensus...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {agreements.map((ag) => (
        <div
          key={ag.id}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid var(--color-border)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>
            {ag.topic}
          </div>
          <div style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{ag.terms}</div>
          {ag.conditions && ag.conditions.length > 0 && (
            <div style={{ fontSize: 9, color: "var(--color-text-muted)", marginTop: 4 }}>
              Conditions: {ag.conditions.join("; ")}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <AcceptBadge name={partyAName} accepted={ag.partyAAccepts} color={PARTY_A_COLOR} />
            <AcceptBadge name={partyBName} accepted={ag.partyBAccepts} color={PARTY_B_COLOR} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AcceptBadge({ name, accepted, color }: { name: string; accepted: boolean; color: string }) {
  return (
    <div
      style={{
        fontSize: 9,
        padding: "2px 6px",
        borderRadius: 4,
        background: accepted ? `${color}22` : "rgba(255,255,255,0.05)",
        border: `1px solid ${accepted ? `${color}44` : "var(--color-border)"}`,
        color: accepted ? color : "var(--color-text-muted)",
      }}
    >
      {accepted ? "✓" : "○"} {name}
    </div>
  );
}

// ── Shared section component ──

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "var(--color-text-muted)",
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          gap: 4,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
