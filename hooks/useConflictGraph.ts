"use client";

import { useMemo } from "react";
import type {
  Actor,
  Primitive,
  PrimitiveType,
  LiveMediationState,
  GraphNode,
  GraphEdge,
  EdgeType,
  OntologyStats,
} from "@/lib/types";

// Map primitive type → edge from actor to that primitive
const ACTOR_EDGE_MAP: Partial<Record<PrimitiveType, EdgeType>> = {
  Claim: "MAKES",
  Interest: "HAS",
  Constraint: "FACES",
  Leverage: "WIELDS",
  Commitment: "GIVES",
  Narrative: "NARRATES",
  Event: "TRIGGERS",
  Actor: "HAS",
};

export function useConflictGraph(
  actors: Actor[],
  primitives: Primitive[],
  liveMediationState: LiveMediationState | null,
) {
  return useMemo(() => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeIds = new Set<string>();

    // Drop any malformed primitives that lack required fields
    const safePrimitives = primitives.filter(
      (p) => p && p.id && p.type && p.actorId,
    );

    // Add actor nodes
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

    // Add primitive nodes + actor→primitive edges
    for (const prim of safePrimitives) {
      const desc = prim.description ?? "";
      if (!nodeIds.has(prim.id)) {
        nodes.push({
          id: prim.id,
          type: prim.type,
          label: (desc || prim.type).slice(0, 30),
          description: desc,
          actorId: prim.actorId,
        });
        nodeIds.add(prim.id);
      }

      // Actor → primitive edge
      if (prim.actorId && nodeIds.has(prim.actorId)) {
        const edgeType = ACTOR_EDGE_MAP[prim.type] ?? "MAKES";
        edges.push({ source: prim.actorId, target: prim.id, type: edgeType });
      }
    }

    // Infer cross-primitive edges

    // Claims from different actors → OPPOSES
    const claims = safePrimitives.filter((p) => p.type === "Claim");
    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < claims.length; j++) {
        const ci = claims[i];
        const cj = claims[j];
        if (ci && cj && ci.actorId !== cj.actorId) {
          edges.push({
            source: ci.id,
            target: cj.id,
            type: "OPPOSES",
          });
        }
      }
    }

    // Interests from different actors → ALIGNS_WITH (same actor = natural grouping; different actor = compare)
    const interests = safePrimitives.filter((p) => p.type === "Interest");
    for (let i = 0; i < interests.length; i++) {
      for (let j = i + 1; j < interests.length; j++) {
        const ii = interests[i];
        const ij = interests[j];
        if (ii && ij && ii.actorId !== ij.actorId) {
          // Use common-ground data from live session to decide alignment vs. conflict
          const iDesc = (ii.description ?? "").toLowerCase();
          const jDesc = (ij.description ?? "").toLowerCase();
          const commonGroundWords = (liveMediationState?.commonGround ?? [])
            .join(" ")
            .toLowerCase();
          // Simple heuristic: if words overlap with common ground, it's alignment
          const sharedTokens = iDesc
            .split(" ")
            .filter((w) => w.length > 4 && jDesc.includes(w));
          const isAligned = sharedTokens.length > 0 || commonGroundWords.length > 0;
          edges.push({
            source: ii.id,
            target: ij.id,
            type: isAligned ? "ALIGNS_WITH" : "CONFLICTS_WITH",
          });
        }
      }
    }

    // Constraints → block interests of same actor (Constraint BLOCKS Interest)
    const constraints = safePrimitives.filter((p) => p.type === "Constraint");
    for (const constraint of constraints) {
      const actorInterests = interests.filter(
        (i) => i.actorId !== constraint.actorId,
      );
      const firstInterest = actorInterests[0];
      if (firstInterest) {
        // Connect to first interest of the opposite actor
        edges.push({
          source: constraint.id,
          target: firstInterest.id,
          type: "BLOCKS",
        });
      }
    }

    // Leverage → supports claims of same actor
    const leverages = safePrimitives.filter((p) => p.type === "Leverage");
    for (const leverage of leverages) {
      const actorClaims = claims.filter(
        (c) => c.actorId === leverage.actorId,
      );
      const firstClaim = actorClaims[0];
      if (firstClaim) {
        edges.push({
          source: leverage.id,
          target: firstClaim.id,
          type: "SUPPORTS",
        });
      }
    }

    // Commitments → address interests of opposite actor
    const commitments = safePrimitives.filter((p) => p.type === "Commitment");
    for (const commitment of commitments) {
      const oppositeInterests = interests.filter(
        (i) => i.actorId !== commitment.actorId,
      );
      const firstOppositeInterest = oppositeInterests[0];
      if (firstOppositeInterest) {
        edges.push({
          source: commitment.id,
          target: firstOppositeInterest.id,
          type: "ADDRESSES",
        });
      }
    }

    // Narratives → frame claims of same actor
    const narratives = safePrimitives.filter((p) => p.type === "Narrative");
    for (const narrative of narratives) {
      const actorClaims = claims.filter(
        (c) => c.actorId === narrative.actorId,
      );
      const firstActorClaim = actorClaims[0];
      if (firstActorClaim) {
        edges.push({
          source: narrative.id,
          target: firstActorClaim.id,
          type: "FRAMES",
        });
      }
    }

    // Narrative vs. Narrative from different actors → CONTRADICTS
    for (let i = 0; i < narratives.length; i++) {
      for (let j = i + 1; j < narratives.length; j++) {
        const ni = narratives[i];
        const nj = narratives[j];
        if (ni && nj && ni.actorId !== nj.actorId) {
          edges.push({
            source: ni.id,
            target: nj.id,
            type: "CONTRADICTS",
          });
        }
      }
    }

    // Events → trigger claims (first claim of opposite/any actor)
    const events = safePrimitives.filter((p) => p.type === "Event");
    for (const event of events) {
      const firstClaim = claims[0];
      if (firstClaim) {
        edges.push({
          source: event.id,
          target: firstClaim.id,
          type: "TRIGGERS",
        });
      }
    }

    // Compute stats
    const ALL_TYPES: PrimitiveType[] = [
      "Actor",
      "Claim",
      "Interest",
      "Constraint",
      "Leverage",
      "Commitment",
      "Event",
      "Narrative",
    ];
    const stats = ALL_TYPES.reduce(
      (acc, t) => {
        acc[t] =
          t === "Actor"
            ? actors.length
            : safePrimitives.filter((p) => p.type === t).length;
        return acc;
      },
      {} as OntologyStats,
    );

    // Safety: remove any edges referencing non-existent nodes
    const validNodeIds = new Set(nodes.map((n) => n.id));
    const safeEdges = edges.filter(
      (e) =>
        validNodeIds.has(
          typeof e.source === "string" ? e.source : (e.source as GraphNode).id,
        ) &&
        validNodeIds.has(
          typeof e.target === "string" ? e.target : (e.target as GraphNode).id,
        ),
    );

    return { nodes, edges: safeEdges, stats };
  }, [actors, primitives, liveMediationState]);
}
