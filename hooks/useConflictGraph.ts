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

    // Add actor nodes
    for (const actor of actors) {
      if (!nodeIds.has(actor.id)) {
        nodes.push({
          id: actor.id,
          type: "Actor",
          label: actor.name,
          description: actor.role,
        });
        nodeIds.add(actor.id);
      }
    }

    // Add primitive nodes + actor→primitive edges
    for (const prim of primitives) {
      if (!nodeIds.has(prim.id)) {
        nodes.push({
          id: prim.id,
          type: prim.type,
          label: prim.description.slice(0, 30),
          description: prim.description,
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
    const claims = primitives.filter((p) => p.type === "Claim");
    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < claims.length; j++) {
        if (claims[i].actorId !== claims[j].actorId) {
          edges.push({
            source: claims[i].id,
            target: claims[j].id,
            type: "OPPOSES",
          });
        }
      }
    }

    // Interests from different actors → ALIGNS_WITH (same actor = natural grouping; different actor = compare)
    const interests = primitives.filter((p) => p.type === "Interest");
    for (let i = 0; i < interests.length; i++) {
      for (let j = i + 1; j < interests.length; j++) {
        if (interests[i].actorId !== interests[j].actorId) {
          // Use common-ground data from live session to decide alignment vs. conflict
          const iDesc = interests[i].description.toLowerCase();
          const jDesc = interests[j].description.toLowerCase();
          const commonGroundWords = (liveMediationState?.commonGround ?? [])
            .join(" ")
            .toLowerCase();
          // Simple heuristic: if words overlap with common ground, it's alignment
          const sharedTokens = iDesc
            .split(" ")
            .filter((w) => w.length > 4 && jDesc.includes(w));
          const isAligned = sharedTokens.length > 0 || commonGroundWords.length > 0;
          edges.push({
            source: interests[i].id,
            target: interests[j].id,
            type: isAligned ? "ALIGNS_WITH" : "CONFLICTS_WITH",
          });
        }
      }
    }

    // Constraints → block interests of same actor (Constraint BLOCKS Interest)
    const constraints = primitives.filter((p) => p.type === "Constraint");
    for (const constraint of constraints) {
      const actorInterests = interests.filter(
        (i) => i.actorId !== constraint.actorId,
      );
      if (actorInterests.length > 0) {
        // Connect to first interest of the opposite actor
        edges.push({
          source: constraint.id,
          target: actorInterests[0].id,
          type: "BLOCKS",
        });
      }
    }

    // Leverage → supports claims of same actor
    const leverages = primitives.filter((p) => p.type === "Leverage");
    for (const leverage of leverages) {
      const actorClaims = claims.filter(
        (c) => c.actorId === leverage.actorId,
      );
      if (actorClaims.length > 0) {
        edges.push({
          source: leverage.id,
          target: actorClaims[0].id,
          type: "SUPPORTS",
        });
      }
    }

    // Commitments → address interests of opposite actor
    const commitments = primitives.filter((p) => p.type === "Commitment");
    for (const commitment of commitments) {
      const oppositeInterests = interests.filter(
        (i) => i.actorId !== commitment.actorId,
      );
      if (oppositeInterests.length > 0) {
        edges.push({
          source: commitment.id,
          target: oppositeInterests[0].id,
          type: "ADDRESSES",
        });
      }
    }

    // Narratives → frame claims of same actor
    const narratives = primitives.filter((p) => p.type === "Narrative");
    for (const narrative of narratives) {
      const actorClaims = claims.filter(
        (c) => c.actorId === narrative.actorId,
      );
      if (actorClaims.length > 0) {
        edges.push({
          source: narrative.id,
          target: actorClaims[0].id,
          type: "FRAMES",
        });
      }
    }

    // Narrative vs. Narrative from different actors → CONTRADICTS
    for (let i = 0; i < narratives.length; i++) {
      for (let j = i + 1; j < narratives.length; j++) {
        if (narratives[i].actorId !== narratives[j].actorId) {
          edges.push({
            source: narratives[i].id,
            target: narratives[j].id,
            type: "CONTRADICTS",
          });
        }
      }
    }

    // Events → trigger claims (first claim of opposite/any actor)
    const events = primitives.filter((p) => p.type === "Event");
    for (const event of events) {
      if (claims.length > 0) {
        edges.push({
          source: event.id,
          target: claims[0].id,
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
            : primitives.filter((p) => p.type === t).length;
        return acc;
      },
      {} as OntologyStats,
    );

    return { nodes, edges, stats };
  }, [actors, primitives, liveMediationState]);
}
