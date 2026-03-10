// ── TACITUS Conflict Ontology — Full 8-Primitive Grammar ──

export type ActorNodeType = "individual" | "group" | "organization" | "state";

export type ActorData = {
  name: string;
  type: ActorNodeType;
  stance: string;
  powerLevel: 1 | 2 | 3 | 4 | 5;
};

export type ClaimData = {
  content: string;
  type: "position" | "demand" | "assertion" | "accusation";
  status: "active" | "withdrawn" | "acknowledged" | "disputed";
  confidence: number; // 0-1
};

export type InterestData = {
  content: string;
  type: "substantive" | "procedural" | "psychological" | "relational";
  priority: "critical" | "important" | "desirable";
  visibility: "stated" | "implicit" | "hidden";
};

export type ConstraintData = {
  content: string;
  type: "legal" | "financial" | "temporal" | "organizational" | "cultural" | "emotional";
  rigidity: "hard" | "soft" | "negotiable";
};

export type LeverageData = {
  content: string;
  type: "coercive" | "reward" | "legitimate" | "expert" | "referent" | "informational";
  strength: 1 | 2 | 3 | 4 | 5;
};

export type CommitmentData = {
  content: string;
  type: "promise" | "agreement" | "concession" | "threat" | "ultimatum";
  status: "proposed" | "accepted" | "rejected" | "conditional" | "fulfilled" | "broken";
  bindingness: "moral" | "legal" | "social";
};

export type EventData = {
  content: string;
  type: "trigger" | "escalation" | "de-escalation" | "turning-point" | "deadline" | "milestone";
  timestamp?: string;
  impact: "high" | "medium" | "low";
};

export type NarrativeData = {
  content: string;
  type:
    | "origin-story"
    | "grievance"
    | "justification"
    | "aspiration"
    | "identity-claim"
    | "counter-narrative";
  framing: "victim" | "hero" | "villain" | "mediator" | "neutral";
  emotionalTone: string;
};

export type PrimitiveType =
  | "Actor"
  | "Claim"
  | "Interest"
  | "Constraint"
  | "Leverage"
  | "Commitment"
  | "Event"
  | "Narrative";

export type PrimitiveData =
  | ActorData
  | ClaimData
  | InterestData
  | ConstraintData
  | LeverageData
  | CommitmentData
  | EventData
  | NarrativeData;

export type Actor = {
  id: string;
  name: string;
  role: string;
  data?: ActorData;
};

export type Primitive = {
  id: string;
  type: PrimitiveType;
  actorId: string;
  description: string;
  data?: PrimitiveData;
};

export type PartyProfile = {
  emotionalState: string;
  engagementLevel: string;
  communicationStyle: string;
  cooperativeness: number;
  defensiveness: number;
  keyNeeds: string[];
  riskFactors: string[];
};

export type LiveMediationState = {
  phase: string;
  targetActor: string;
  currentAction: string;
  missingItems: string[];
  structuredItems: { topic: string; summary: string; actor: string }[];
  partyProfiles: {
    partyA: PartyProfile | null;
    partyB: PartyProfile | null;
  };
  commonGround: string[];
  tensionPoints: string[];
};

export type Case = {
  id: string;
  title: string;
  updatedAt: string;
  transcript: string;
  actors: Actor[];
  primitives: Primitive[];
  partyAName: string;
  partyBName: string;
};

// ── Graph / Edge Types ──

export type EdgeType =
  // Actor → Primitive
  | "MAKES"
  | "HAS"
  | "FACES"
  | "WIELDS"
  | "GIVES"
  | "NARRATES"
  // Cross-primitive
  | "OPPOSES"
  | "ALIGNS_WITH"
  | "CONFLICTS_WITH"
  | "BLOCKS"
  | "SUPPORTS"
  | "ADDRESSES"
  | "TRIGGERS"
  | "FRAMES"
  | "CONTRADICTS";

export type GraphNode = {
  id: string;
  type: PrimitiveType | "Actor";
  label: string;
  actorId?: string;
  description?: string;
  isNew?: boolean;
  // D3 simulation fields (mutable)
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
};

export type GraphEdge = {
  source: string | GraphNode;
  target: string | GraphNode;
  type: EdgeType;
};

export type OntologyStats = Record<PrimitiveType, number>;
