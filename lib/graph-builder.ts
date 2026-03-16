// ── Conflict Knowledge Graph Builder ──
// Constructs a ConflictKnowledgeGraph from actors and primitives using
// the TACITUS 8-Primitive ontology edge inference rules.

import type {
  Actor,
  Primitive,
  PrimitiveType,
  GraphNode,
  GraphEdge,
  PrimitiveCluster,
  EdgeType,
} from "./types";

// ── Exported Graph Types ──

export type GraphAnalytics = {
  centralityScores: Record<string, number>;
  bridgingNodes: string[];
  isolatedNodes: string[];
  tensionEdges: GraphEdge[];
  alignmentEdges: GraphEdge[];
  narrativeCoherence: { partyA: number; partyB: number };
};

export type ConflictKnowledgeGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: PrimitiveCluster[];
  analytics: GraphAnalytics;
};

// ── Edge Inference Helpers ──

/** Simple word-overlap similarity between two descriptions (0-1). */
function textSimilarity(a: string, b: string): number {
  const wordsA = new Set(
    a
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );
  const wordsB = new Set(
    b
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

/** Map primitive type to the edge type connecting an actor to that primitive. */
const ACTOR_EDGE_MAP: Partial<Record<PrimitiveType, EdgeType>> = {
  Claim: "MAKES",
  Interest: "HAS",
  Constraint: "FACES",
  Leverage: "WIELDS",
  Commitment: "GIVES",
  Narrative: "NARRATES",
  Event: "TRIGGERS",
};

// ── Centrality (degree-based approximation) ──

function computeDegrees(
  nodes: GraphNode[],
  edges: GraphEdge[],
): Record<string, number> {
  const degree: Record<string, number> = {};
  for (const n of nodes) degree[n.id] = 0;
  for (const e of edges) {
    const src = typeof e.source === "string" ? e.source : e.source.id;
    const tgt = typeof e.target === "string" ? e.target : e.target.id;
    degree[src] = (degree[src] ?? 0) + 1;
    degree[tgt] = (degree[tgt] ?? 0) + 1;
  }
  // Normalize to 0-1
  const maxDeg = Math.max(1, ...Object.values(degree));
  for (const id in degree) degree[id] = degree[id]! / maxDeg;
  return degree;
}

// ── Cluster Builder ──

function buildClusters(
  primitives: Primitive[],
  actors: Actor[],
): PrimitiveCluster[] {
  const clusters: PrimitiveCluster[] = [];
  // Cluster by actor + type
  const groups = new Map<string, Primitive[]>();
  for (const p of primitives) {
    const key = `${p.actorId}::${p.type}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  for (const [key, prims] of groups) {
    const [actorId, type] = key.split("::");
    const actor = actors.find((a) => a.id === actorId);
    clusters.push({
      id: `cluster-${key}`,
      label: `${actor?.name ?? actorId}'s ${type}s`,
      description: `${prims.length} ${type} primitive(s) belonging to ${actor?.name ?? actorId}`,
      primitiveIds: prims.map((p) => p.id),
      phase: "discovery",
      createdAt: new Date().toISOString(),
    });
  }
  return clusters;
}

// ── Narrative Coherence ──

function computeNarrativeCoherence(
  primitives: Primitive[],
  actors: Actor[],
): { partyA: number; partyB: number } {
  // Coherence = how many primitive types a party has covered (0-1)
  const allTypes: PrimitiveType[] = [
    "Claim",
    "Interest",
    "Constraint",
    "Leverage",
    "Commitment",
    "Event",
    "Narrative",
  ];

  const scoreFor = (actorId: string): number => {
    const covered = new Set(
      primitives.filter((p) => p.actorId === actorId).map((p) => p.type),
    );
    return covered.size / allTypes.length;
  };

  const partyAId = actors[0]?.id ?? "";
  const partyBId = actors[1]?.id ?? "";

  return {
    partyA: scoreFor(partyAId),
    partyB: scoreFor(partyBId),
  };
}

// ── Main Builder ──

export function buildConflictGraph(
  actors: Actor[],
  primitives: Primitive[],
): ConflictKnowledgeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();

  // Filter out malformed primitives
  const safePrimitives = primitives.filter(
    (p) => p && p.id && p.type && p.actorId,
  );

  // 1. Actor nodes
  for (const actor of actors) {
    if (!nodeIds.has(actor.id)) {
      nodes.push({
        id: actor.id,
        type: "Actor",
        label: actor.name ?? "Unknown",
        description: actor.role ?? "",
      });
      nodeIds.add(actor.id);
    }
  }

  // 2. Primitive nodes + Actor → Primitive edges
  for (const prim of safePrimitives) {
    const desc = prim.description ?? "";
    if (!nodeIds.has(prim.id)) {
      nodes.push({
        id: prim.id,
        type: prim.type,
        label: (desc || prim.type).slice(0, 40),
        description: desc,
        actorId: prim.actorId,
      });
      nodeIds.add(prim.id);
    }
    // Actor → Primitive edge
    if (prim.actorId && nodeIds.has(prim.actorId)) {
      const edgeType = ACTOR_EDGE_MAP[prim.type] ?? "MAKES";
      edges.push({ source: prim.actorId, target: prim.id, type: edgeType });
    }
  }

  // 3. Cross-primitive edge inference

  const byType = (t: PrimitiveType) =>
    safePrimitives.filter((p) => p.type === t);

  const claims = byType("Claim");
  const interests = byType("Interest");
  const constraints = byType("Constraint");
  const leverages = byType("Leverage");
  const commitments = byType("Commitment");
  const events = byType("Event");
  const narratives = byType("Narrative");

  // Claim ↔ Claim (different actors): OPPOSES or ALIGNS_WITH
  for (let i = 0; i < claims.length; i++) {
    for (let j = i + 1; j < claims.length; j++) {
      const a = claims[i]!;
      const b = claims[j]!;
      if (a.actorId !== b.actorId) {
        const sim = textSimilarity(a.description, b.description);
        edges.push({
          source: a.id,
          target: b.id,
          type: sim > 0.3 ? "ALIGNS_WITH" : "OPPOSES",
        });
      }
    }
  }

  // Interest ↔ Interest: OVERLAPS (ALIGNS_WITH) or CONFLICTS_WITH
  for (let i = 0; i < interests.length; i++) {
    for (let j = i + 1; j < interests.length; j++) {
      const a = interests[i]!;
      const b = interests[j]!;
      if (a.actorId !== b.actorId) {
        const sim = textSimilarity(a.description, b.description);
        edges.push({
          source: a.id,
          target: b.id,
          type: sim > 0.2 ? "ALIGNS_WITH" : "CONFLICTS_WITH",
        });
      }
    }
  }

  // Constraint → Interest: BLOCKS (constraint blocks opposite actor's interests)
  for (const constraint of constraints) {
    const oppositeInterests = interests.filter(
      (i) => i.actorId !== constraint.actorId,
    );
    for (const interest of oppositeInterests) {
      edges.push({
        source: constraint.id,
        target: interest.id,
        type: "BLOCKS",
      });
    }
  }

  // Leverage → Actor: WIELDS (already handled by actor→primitive edge)
  // Additionally, leverage supports claims of the same actor
  for (const leverage of leverages) {
    const actorClaims = claims.filter((c) => c.actorId === leverage.actorId);
    for (const claim of actorClaims) {
      edges.push({
        source: leverage.id,
        target: claim.id,
        type: "SUPPORTS",
      });
    }
  }

  // Event → Claim: TRIGGERS
  for (const event of events) {
    for (const claim of claims) {
      edges.push({
        source: event.id,
        target: claim.id,
        type: "TRIGGERS",
      });
    }
  }

  // Narrative → Claim: FRAMES (same actor's claims)
  for (const narrative of narratives) {
    const actorClaims = claims.filter((c) => c.actorId === narrative.actorId);
    for (const claim of actorClaims) {
      edges.push({
        source: narrative.id,
        target: claim.id,
        type: "FRAMES",
      });
    }
  }

  // Narrative ↔ Narrative (different actors): CONTRADICTS
  for (let i = 0; i < narratives.length; i++) {
    for (let j = i + 1; j < narratives.length; j++) {
      const a = narratives[i]!;
      const b = narratives[j]!;
      if (a.actorId !== b.actorId) {
        edges.push({
          source: a.id,
          target: b.id,
          type: "CONTRADICTS",
        });
      }
    }
  }

  // Commitment → Interest: ADDRESSES (opposite actor's interests)
  for (const commitment of commitments) {
    const oppositeInterests = interests.filter(
      (i) => i.actorId !== commitment.actorId,
    );
    for (const interest of oppositeInterests) {
      edges.push({
        source: commitment.id,
        target: interest.id,
        type: "ADDRESSES",
      });
    }
  }

  // 4. Analytics
  const centralityScores = computeDegrees(nodes, edges);

  // Isolated nodes: no edges
  const connectedIds = new Set<string>();
  for (const e of edges) {
    connectedIds.add(typeof e.source === "string" ? e.source : e.source.id);
    connectedIds.add(typeof e.target === "string" ? e.target : e.target.id);
  }
  const isolatedNodes = nodes
    .filter((n) => !connectedIds.has(n.id))
    .map((n) => n.id);

  // Bridging nodes: connected to primitives of both actors
  const partyAId = actors[0]?.id ?? "";
  const partyBId = actors[1]?.id ?? "";
  const bridgingNodes: string[] = [];
  for (const node of nodes) {
    if (node.type === "Actor") continue;
    // Check if this node connects to primitives belonging to both parties
    const neighborActors = new Set<string>();
    for (const e of edges) {
      const src = typeof e.source === "string" ? e.source : e.source.id;
      const tgt = typeof e.target === "string" ? e.target : e.target.id;
      if (src === node.id || tgt === node.id) {
        const otherId = src === node.id ? tgt : src;
        const otherNode = nodes.find((n) => n.id === otherId);
        if (otherNode?.actorId) neighborActors.add(otherNode.actorId);
        if (otherNode?.type === "Actor") neighborActors.add(otherNode.id);
      }
    }
    if (neighborActors.has(partyAId) && neighborActors.has(partyBId)) {
      bridgingNodes.push(node.id);
    }
  }

  // Tension & alignment edges
  const tensionEdges = edges.filter(
    (e) =>
      e.type === "OPPOSES" ||
      e.type === "CONFLICTS_WITH" ||
      e.type === "BLOCKS" ||
      e.type === "CONTRADICTS",
  );
  const alignmentEdges = edges.filter(
    (e) => e.type === "ALIGNS_WITH" || e.type === "ADDRESSES",
  );

  const narrativeCoherence = computeNarrativeCoherence(safePrimitives, actors);

  const clusters = buildClusters(safePrimitives, actors);

  return {
    nodes,
    edges,
    clusters,
    analytics: {
      centralityScores,
      bridgingNodes,
      isolatedNodes,
      tensionEdges,
      alignmentEdges,
      narrativeCoherence,
    },
  };
}
