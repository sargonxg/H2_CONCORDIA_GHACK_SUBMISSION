"use client";

import React, { useState } from "react";
import { Users, Brain, Network, BarChart3, Handshake } from "lucide-react";
import type {
  Primitive,
  Actor,
  PrimitiveType,
  LiveMediationState,
  OntologyStats,
  GapNotification,
  Agreement,
  EscalationFlag,
  SolutionProposal,
  PowerDynamics,
  EmotionSnapshot,
} from "@/lib/types";
import type { ConflictKnowledgeGraph } from "@/lib/graph-builder";
import type { GroundingUpdate } from "@/components/workspace/ResearchSidebar";

import EnhancedPartyProfile from "@/components/workspace/EnhancedPartyProfile";
import EscalationMeter from "@/components/workspace/EscalationMeter";
import EmotionTimeline from "@/components/workspace/EmotionTimeline";
import OntologyHealthCheck from "@/components/workspace/OntologyHealthCheck";
import PrimitivesList from "@/components/workspace/PrimitivesList";
import OntologyInsights from "@/components/workspace/OntologyInsights";
import ConflictGraph from "@/components/workspace/ConflictGraph";
import PowerMap from "@/components/workspace/PowerMap";
import IntelligencePanel from "@/components/workspace/IntelligencePanel";
import MediatorPlaybook from "@/components/workspace/MediatorPlaybook";
import ResearchSidebar from "@/components/workspace/ResearchSidebar";
import AgreementTracker from "@/components/workspace/AgreementTracker";
import BlindBidding from "@/components/workspace/BlindBidding";

type TabId = "parties" | "ontology" | "graph" | "analysis" | "agreements";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
  { id: "parties", label: "Parties", icon: Users },
  { id: "ontology", label: "Ontology", icon: Brain },
  { id: "graph", label: "Graph", icon: Network },
  { id: "analysis", label: "Analysis", icon: BarChart3 },
  { id: "agreements", label: "Agreements", icon: Handshake },
];

interface IntelligenceSidebarProps {
  // Party data
  partyAName: string;
  partyBName: string;
  partyAProfile: any | null;
  partyBProfile: any | null;
  // Escalation
  escalationScore: number;
  // Emotion timeline
  emotionTimeline: EmotionSnapshot[];
  // Ontology
  ontologyStats: OntologyStats;
  partyAClaims: number;
  partyBClaims: number;
  primitives: Primitive[];
  actors: Actor[];
  graph: ConflictKnowledgeGraph;
  onPinPrimitive?: (id: string) => void;
  onResolvePrimitive?: (id: string) => void;
  onDeletePrimitive?: (id: string) => void;
  onUpdatePrimitiveType?: (id: string, type: PrimitiveType) => void;
  onUpdatePrimitiveDescription?: (id: string, description: string) => void;
  onAddPrimitive?: (actorId: string) => void;
  // Graph
  graphNodes: any[];
  graphEdges: any[];
  highlightActorId: string | null;
  // Power map
  powerDynamics: PowerDynamics | null;
  // Analysis
  mediationState: LiveMediationState | null;
  escalationFlags: EscalationFlag[];
  agreements: Agreement[];
  solutions: SolutionProposal[];
  mediatorThought: string;
  groundingResults: GroundingUpdate[];
  gapNotifications: GapNotification[];
  missingPrimitives: PrimitiveType[];
  phase: string;
  // Blind bidding
  showBlindBidding: boolean;
  onCloseBlindBidding: () => void;
  onSettlement?: (issue: string, amount: number, unit: string) => void;
}

function IntelligenceSidebar(props: IntelligenceSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>("parties");

  const primitivesCount = props.primitives.length;
  const agreementsCount = props.agreements.length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badgeCount =
            tab.id === "ontology"
              ? primitivesCount
              : tab.id === "agreements"
                ? agreementsCount
                : 0;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-medium transition-colors relative ${
                isActive
                  ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[var(--color-accent)] text-white text-[9px] font-bold leading-none">
                    {badgeCount}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === "parties" && (
          <>
            <EnhancedPartyProfile
              name={props.partyAName}
              profile={props.partyAProfile}
              side="A"
            />
            <EnhancedPartyProfile
              name={props.partyBName}
              profile={props.partyBProfile}
              side="B"
            />
            <EscalationMeter escalationScore={props.escalationScore} />
            {props.emotionTimeline.length > 0 && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3">
                <EmotionTimeline
                  timeline={props.emotionTimeline}
                  partyAName={props.partyAName}
                  partyBName={props.partyBName}
                />
              </div>
            )}
          </>
        )}

        {activeTab === "ontology" && (
          <>
            <OntologyHealthCheck
              stats={props.ontologyStats}
              partyAName={props.partyAName}
              partyBName={props.partyBName}
              partyAClaims={props.partyAClaims}
              partyBClaims={props.partyBClaims}
            />
            <PrimitivesList
              primitives={props.primitives}
              actors={props.actors}
              onPin={props.onPinPrimitive}
              onResolve={props.onResolvePrimitive}
              onDelete={props.onDeletePrimitive}
              onUpdateType={props.onUpdatePrimitiveType}
              onUpdateDescription={props.onUpdatePrimitiveDescription}
              onAddPrimitive={props.onAddPrimitive}
            />
            <OntologyInsights
              graph={props.graph}
              actors={props.actors}
              primitives={props.primitives}
              partyAName={props.partyAName}
              partyBName={props.partyBName}
            />
          </>
        )}

        {activeTab === "graph" && (
          <>
            <div className="h-[350px]">
              <ConflictGraph
                nodes={props.graphNodes}
                edges={props.graphEdges}
                highlightActorId={props.highlightActorId}
              />
            </div>
            {props.powerDynamics && (
              <PowerMap
                dimensions={props.powerDynamics.dimensions}
                overallBalance={props.powerDynamics.overallBalance}
                rebalancingStrategy={props.powerDynamics.rebalancingStrategy}
                partyAName={props.partyAName}
                partyBName={props.partyBName}
              />
            )}
          </>
        )}

        {activeTab === "analysis" && (
          <>
            <IntelligencePanel
              emotionTimeline={props.emotionTimeline}
              mediationState={props.mediationState}
              escalationFlags={props.escalationFlags}
              agreements={props.agreements}
              solutions={props.solutions}
              mediatorThought={props.mediatorThought}
              groundingResults={props.groundingResults}
              partyAName={props.partyAName}
              partyBName={props.partyBName}
            />
            <MediatorPlaybook
              phase={props.phase}
              gapNotifications={props.gapNotifications}
              missingPrimitives={props.missingPrimitives}
            />
            <ResearchSidebar groundingUpdates={props.groundingResults} />
          </>
        )}

        {activeTab === "agreements" && (
          <>
            <AgreementTracker agreements={props.agreements} />
            <BlindBidding
              open={props.showBlindBidding}
              onClose={props.onCloseBlindBidding}
              partyAName={props.partyAName}
              partyBName={props.partyBName}
              onSettlement={props.onSettlement}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default React.memo(IntelligenceSidebar);
