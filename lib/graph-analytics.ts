// ── Graph Analytics Engine ──
// Algorithms that run after each graph update to produce actionable insights
// for the mediator: centrality, communities, bridges, imbalances, and resolution progress.

import type { GraphNode, GraphEdge } from "./types";

// ── Adjacency helpers ──

type AdjMap = Map<string, Set<string>>;

function buildAdjacency(nodes: GraphNode[], edges: GraphEdge[]): AdjMap {
  const adj: AdjMap = new Map();
  for (const n of nodes) adj.set(n.id, new Set());
  for (const e of edges) {
    const src = typeof e.source === "string" ? e.source : e.source.id;
    const tgt = typeof e.target === "string" ? e.target : e.target.id;
    adj.get(src)?.add(tgt);
    adj.get(tgt)?.add(src);
  }
  return adj;
}

// ── Betweenness Centrality ──
// Brandes' algorithm (O(V*E)) — identifies the most central issues in the conflict graph.

export function computeCentrality(
  nodes: GraphNode[],
  edges: GraphEdge[],
): Record<string, number> {
  const adj = buildAdjacency(nodes, edges);
  const ids = nodes.map((n) => n.id);
  const cb: Record<string, number> = {};
  for (const id of ids) cb[id] = 0;

  for (const s of ids) {
    // BFS from s
    const stack: string[] = [];
    const pred: Record<string, string[]> = {};
    const sigma: Record<string, number> = {};
    const dist: Record<string, number> = {};
    const delta: Record<string, number> = {};

    for (const v of ids) {
      pred[v] = [];
      sigma[v] = 0;
      dist[v] = -1;
      delta[v] = 0;
    }
    sigma[s] = 1;
    dist[s] = 0;

    const queue: string[] = [s];
    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      const neighbors = adj.get(v) ?? new Set<string>();
      for (const w of neighbors) {
        // w found for the first time?
        if (dist[w]! < 0) {
          queue.push(w);
          dist[w] = dist[v]! + 1;
        }
        // shortest path to w via v?
        if (dist[w] === dist[v]! + 1) {
          sigma[w] = sigma[w]! + sigma[v]!;
          pred[w]!.push(v);
        }
      }
    }

    // Accumulation
    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of pred[w]!) {
        delta[v] = delta[v]! + (sigma[v]! / sigma[w]!) * (1 + delta[w]!);
      }
      if (w !== s) {
        cb[w] = cb[w]! + delta[w]!;
      }
    }
  }

  // Normalize to 0-1
  const n = ids.length;
  const norm = n > 2 ? (n - 1) * (n - 2) : 1;
  for (const id of ids) {
    cb[id] = cb[id]! / norm;
  }

  return cb;
}

// ── Community Detection ──
// Label propagation — lightweight community detection that groups related primitives.

export function detectCommunities(
  nodes: GraphNode[],
  edges: GraphEdge[],
): { id: string; nodeIds: string[] }[] {
  const adj = buildAdjacency(nodes, edges);
  const labels: Record<string, string> = {};

  // Initialize each node with its own label
  for (const n of nodes) labels[n.id] = n.id;

  // Iterate until convergence (max 20 iterations)
  for (let iter = 0; iter < 20; iter++) {
    let changed = false;
    // Shuffle node order for better convergence
    const shuffled = [...nodes].sort(() => Math.random() - 0.5);

    for (const node of shuffled) {
      const neighbors = adj.get(node.id);
      if (!neighbors || neighbors.size === 0) continue;

      // Count neighbor labels
      const labelCounts: Record<string, number> = {};
      for (const nId of neighbors) {
        const lbl = labels[nId]!;
        labelCounts[lbl] = (labelCounts[lbl] ?? 0) + 1;
      }

      // Pick the most frequent label
      let maxCount = 0;
      let bestLabel = labels[node.id]!;
      for (const [lbl, count] of Object.entries(labelCounts)) {
        if (count > maxCount) {
          maxCount = count;
          bestLabel = lbl;
        }
      }

      if (labels[node.id] !== bestLabel) {
        labels[node.id] = bestLabel;
        changed = true;
      }
    }

    if (!changed) break;
  }

  // Group nodes by label
  const communities = new Map<string, string[]>();
  for (const [nodeId, label] of Object.entries(labels)) {
    if (!communities.has(label)) communities.set(label, []);
    communities.get(label)!.push(nodeId);
  }

  return Array.from(communities.entries()).map(([label, nodeIds]) => ({
    id: `community-${label}`,
    nodeIds,
  }));
}

// ── Bridge Detection ──
// Find nodes that connect partyA's subgraph to partyB's subgraph.

export function findBridgeNodes(
  nodes: GraphNode[],
  edges: GraphEdge[],
  partyAActorId: string,
  partyBActorId: string,
): string[] {
  const adj = buildAdjacency(nodes, edges);
  const bridges: string[] = [];

  // Classify each non-actor node: does it have neighbors belonging to both parties?
  for (const node of nodes) {
    if (node.type === "Actor") continue;

    const neighbors = adj.get(node.id);
    if (!neighbors || neighbors.size < 2) continue;

    let touchesA = false;
    let touchesB = false;

    for (const nId of neighbors) {
      const neighbor = nodes.find((n) => n.id === nId);
      if (!neighbor) continue;
      // Direct actor connection
      if (nId === partyAActorId || neighbor.actorId === partyAActorId)
        touchesA = true;
      if (nId === partyBActorId || neighbor.actorId === partyBActorId)
        touchesB = true;
    }

    if (touchesA && touchesB) bridges.push(node.id);
  }

  return bridges;
}

// ── Imbalance Detection ──
// Compare primitive counts per actor to detect information gaps.

export function detectImbalances(
  nodes: GraphNode[],
  edges: GraphEdge[],
): { actorId: string; type: string; count: number }[] {
  // Group non-actor nodes by actorId and type
  const counts = new Map<string, Map<string, number>>();

  for (const node of nodes) {
    if (node.type === "Actor" || !node.actorId) continue;
    if (!counts.has(node.actorId)) counts.set(node.actorId, new Map());
    const actorMap = counts.get(node.actorId)!;
    actorMap.set(node.type, (actorMap.get(node.type) ?? 0) + 1);
  }

  const actorIds = Array.from(counts.keys());
  if (actorIds.length < 2) return [];

  const allTypes = new Set<string>();
  for (const actorMap of counts.values()) {
    for (const type of actorMap.keys()) allTypes.add(type);
  }

  const imbalances: { actorId: string; type: string; count: number }[] = [];

  for (const type of allTypes) {
    const countValues = actorIds.map(
      (aid) => counts.get(aid)?.get(type) ?? 0,
    );
    const max = Math.max(...countValues);
    for (let i = 0; i < actorIds.length; i++) {
      const count = countValues[i]!;
      // Flag if an actor has significantly fewer than the other (or zero)
      if (count === 0 || (max > 1 && count < max * 0.5)) {
        imbalances.push({ actorId: actorIds[i]!, type, count });
      }
    }
  }

  return imbalances;
}

// ── Resolution Progress Score ──
// Ratio of resolved primitives and agreements to total, weighted.

export function calculateResolutionProgress(
  primitives: { resolved?: boolean }[],
  agreements: { id: string }[],
): number {
  if (primitives.length === 0 && agreements.length === 0) return 0;

  const resolvedCount = primitives.filter((p) => p.resolved).length;
  const totalPrimitives = primitives.length;

  // Primitive resolution contributes 60%, agreements 40%
  const primitiveScore =
    totalPrimitives > 0 ? resolvedCount / totalPrimitives : 0;
  // Each agreement is worth ~10% (cap at 100%)
  const agreementScore = Math.min(agreements.length * 0.1, 1);

  return Math.min(primitiveScore * 0.6 + agreementScore * 0.4, 1);
}
