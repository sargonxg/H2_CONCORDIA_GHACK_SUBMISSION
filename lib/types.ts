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
  pinned?: boolean;
  resolved?: boolean;
};

export type PartyProfile = {
  emotionalState: string;
  engagementLevel: string;
  communicationStyle: string;
  cooperativeness: number;
  defensiveness: number;
  keyNeeds: string[];
  riskFactors: string[];
  // Enhanced profiling fields (Part A)
  conflictStyle?: string; // Thomas-Kilmann: Competing|Collaborating|Compromising|Avoiding|Accommodating
  emotionalIntensity?: number; // Plutchik 1-10
  emotionalTrajectory?: string; // escalating|stable|de-escalating
  trustTowardOther?: { ability: number; benevolence: number; integrity: number }; // Mayer/Davis/Schoorman 0-100 each
  riskAssessment?: { escalation: number; withdrawal: number; badFaith: number; impasse: number }; // 0-100 each
};

export type GapNotification = {
  id: string;
  gapType: string; // primitive_missing|imbalance|structural|emotional
  description: string;
  suggestedQuestion: string;
  priority: string; // critical|important|minor
  targetParty: string;
  dismissed: boolean;
};

export type DiscoveryProgress = {
  currentParty: string;         // "partyA" | "partyB"
  currentRound: string;         // "narrative" | "emotion" | "interests"
  partyARoundsComplete: string[];
  partyBRoundsComplete: string[];
};

export type Agreement = {
  id: string;
  topic: string;
  terms: string;
  conditions: string[];
  partyAAccepts: boolean;
  partyBAccepts: boolean;
  timestamp: string;
};

export type EscalationFlag = {
  id: string;
  trigger: string;
  category: string;
  severity: number;
  affectedParty: string;
  deEscalationTechnique: string;
  timestamp: string;
};

export type SolutionProposal = {
  id: string;
  title: string;
  description: string;
  framework?: string;
  addressesPartyANeeds: string[];
  addressesPartyBNeeds: string[];
  timestamp: string;
};

export type PowerDynamics = {
  dimensions: { dimension: string; score: number; evidence: string }[];
  overallBalance: 'balanced' | 'A-favored' | 'B-favored' | 'severely-imbalanced';
  rebalancingStrategy?: string;
  timestamp: string;
};

export type ImpasseEvent = {
  id: string;
  signals: string[];
  duration?: string;
  lastNewInformation?: string;
  suggestedBreaker: string;
  timestamp: string;
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
  discoveryProgress?: DiscoveryProgress;
};

export type PrimitiveCluster = {
  id: string;
  label: string;
  description: string;
  primitiveIds: string[];
  phase: string;
  createdAt: string;
};

export type TimelineEntry = {
  id: string;
  timestamp: string;       // ISO datetime
  elapsedSeconds: number;  // seconds since session start
  type: "utterance" | "extraction" | "phase-change" | "escalation" | "common-ground" | "reflection";
  content: string;
  actor?: string;
  phase: string;
};

export type EmotionSnapshot = {
  timestamp: string;          // ISO datetime
  elapsedSeconds: number;     // seconds since session start
  partyA: {
    emotionalState: string;
    emotionalIntensity: number;    // Plutchik 1-10
    emotionalTrajectory: string;   // escalating|stable|de-escalating
    conflictStyle: string;
    cooperativeness: number;
    defensiveness: number;
  };
  partyB: {
    emotionalState: string;
    emotionalIntensity: number;
    emotionalTrajectory: string;
    conflictStyle: string;
    cooperativeness: number;
    defensiveness: number;
  };
  phase: string;
  escalationScore: number;
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
  profilingEnabled?: boolean; // default true when undefined
  clusters?: PrimitiveCluster[];
  timeline?: TimelineEntry[];
  emotionTimeline?: EmotionSnapshot[];
};

// ── Pathway Analysis Result Types ──

export type PathwayCommonGround = {
  item: string;
  strength: "strong" | "moderate" | "weak";
  evidence: string;
};

export type PathwayCriticalQuestion = {
  question: string;
  target: string;
  purpose: string;
  framework: string;
};

export type ResolutionPathway = {
  title: string;
  description: string;
  framework: string;
  tradeoffsForA: string;
  tradeoffsForB: string;
  feasibility: "high" | "medium" | "low";
  prerequisites: string[];
  implementationSteps: string[];
};

export type ZopaAnalysis = {
  exists: boolean;
  description: string;
  partyARange: string;
  partyBRange: string;
  overlapArea: string;
};

export type FrameworkFit = {
  framework: string;
  score: number;
  rationale: string;
};

export type MomentumAssessment = {
  readinessToResolve: number;
  blockers: string[];
  catalysts: string[];
  recommendedNextMove: string;
};

export type PathwaysResult = {
  commonGround: PathwayCommonGround[];
  criticalQuestions: PathwayCriticalQuestion[];
  pathways: ResolutionPathway[];
  zopaAnalysis: ZopaAnalysis;
  frameworkFit: FrameworkFit[];
  psychologicalDynamics: string[];
  executiveSummary: string;
  momentumAssessment: MomentumAssessment;
};

// ── Case Summary Type ──

export type CaseSummary = {
  sessionOverview: string;
  keyClaimsPartyA: string[];
  keyClaimsPartyB: string[];
  coreInterestsPartyA: string[];
  coreInterestsPartyB: string[];
  areasOfAgreement: string[];
  unresolvedTensions: string[];
  recommendedNextSteps: string[];
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

// ── Cognitive Distortion Type (Argyris-inspired) ──

export type CognitiveDistortion = {
  name: string;
  description: string;
  indicator: string;
  intervention: string;
};

// ── Glasl Stage Assessment ──

export type GlaslAssessment = {
  stage: number;
  intervention: string;
  indicators: string[];
  timestamp: string;
};

// ── Intake Wizard Data ──

export type IntakeData = {
  caseTitle: string;
  caseType: string;
  mediatorStyle: 'professional' | 'empathic';
  language: string;
  languageCode?: string;
  partyALanguage?: string;
  partyALanguageCode?: string;
  partyBLanguage?: string;
  partyBLanguageCode?: string;
  partyA: { name: string; role?: string; relationship: string };
  partyB: { name: string; role?: string; relationship: string };
  powerBalance: 'yes' | 'no' | 'unsure';
  powerDetail?: string;
  description?: string;
  partyAGoal?: string;
  partyBGoal?: string;
  documentSummaries: string[];
  partyAStatement?: string;
  partyBStatement?: string;
  context: string;
  sessionMode?: 'solo' | 'two-party' | 'multi-party';
};

// ── Prompt 1: Core Conversation Engine Types ──

// Caucus Mode
export type CaucusState = {
  active: boolean;
  partyId: 'A' | 'B' | null;
  startedAt: string | null;
};

// Speaker tracking
export type SpeakerTurn = {
  speaker: string;
  startTime: number;
  endTime?: number;
  durationMs: number;
};

// Silence detection
export type SilenceEvent = {
  durationMs: number;
  afterQuestion: boolean;
  suggestedAction: string;
};

// Grounding metadata (for Prompt 5)
export type GroundingUpdate = {
  queries: string[];
  sources: { title: string; uri: string }[];
  supports: any[];
};

// Pre-session briefing (for Prompt 2)
export type PreSessionBriefing = {
  caseTimeline: { date: string; event: string; source: string }[];
  partyAProfile: { knownInterests: string[]; statedPositions: string[]; constraints: string[] };
  partyBProfile: { knownInterests: string[]; statedPositions: string[]; constraints: string[] };
  contradictions: { topic: string; partyAVersion: string; partyBVersion: string; source: string }[];
  keyQuestions: string[];
  ontologySnapshot: { actors: Actor[]; primitives: Primitive[] };
};

// Document metadata (for Prompt 2)
export type DocumentMetadata = {
  type: 'contract' | 'email' | 'complaint' | 'report' | 'other';
  date?: string;
  author?: string;
  recipients?: string[];
  filename: string;
};

// Theory engine (for Prompt 8)
export type TheoryRecommendation = {
  framework: string;
  relevanceScore: number;
  reason: string;
  suggestedTechniques: string[];
  keyQuestions: string[];
  warningSignals: string[];
  pivotFramework: string;
};

// Cognitive bias (for Prompt 8)
export type CognitiveBias = {
  party: string;
  bias: string;
  evidence: string;
  debiasingSuggestion: string;
  timestamp: string;
};

// Graph analytics (for Prompt 4)
export type ConflictKnowledgeGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: PrimitiveCluster[];
  analytics: GraphAnalytics;
};

export type GraphAnalytics = {
  centralityScores: Record<string, number>;
  bridgingNodes: string[];
  isolatedNodes: string[];
  tensionEdges: GraphEdge[];
  alignmentEdges: GraphEdge[];
  narrativeCoherence: { partyA: number; partyB: number };
};

// Session store (for Prompt 6)
export type AuditEntry = {
  timestamp: string;
  action: string;
  details: Record<string, any>;
  actor: 'system' | 'mediator' | 'partyA' | 'partyB' | 'concordia';
};

export type StoredSession = {
  id: string;
  caseId: string;
  intakeData: IntakeData;
  createdAt: string;
  updatedAt: string;
  duration: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  transcript: string;
  actors: Actor[];
  primitives: Primitive[];
  agreements: Agreement[];
  mediationState: LiveMediationState;
  timeline: TimelineEntry[];
  emotionTimeline: EmotionSnapshot[];
  preSessionBriefing?: PreSessionBriefing;
  auditTrail: AuditEntry[];
};

export type SessionSummary = {
  id: string;
  caseId: string;
  title: string;
  createdAt: string;
  duration: number;
  status: StoredSession['status'];
  phaseReached: string;
  agreementCount: number;
  partyAName: string;
  partyBName: string;
};
