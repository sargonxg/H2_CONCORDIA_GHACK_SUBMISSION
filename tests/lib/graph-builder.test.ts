import { describe, it, expect } from 'vitest';
import { buildConflictGraph } from '../../lib/graph-builder';
import type { Actor, Primitive } from '../../lib/types';

const actors: Actor[] = [
  { id: 'a1', name: 'Alice', role: 'Manager' },
  { id: 'a2', name: 'Bob', role: 'Developer' },
];

const primitives: Primitive[] = [
  { id: 'p1', type: 'Claim', actorId: 'a1', description: 'Alice demands a formal apology' },
  { id: 'p2', type: 'Claim', actorId: 'a2', description: 'Bob refuses to apologize for the incident' },
  { id: 'p3', type: 'Interest', actorId: 'a1', description: 'Alice wants recognition and respect' },
  { id: 'p4', type: 'Interest', actorId: 'a2', description: 'Bob wants autonomy and respect' },
  { id: 'p5', type: 'Constraint', actorId: 'a1', description: 'Company policy requires formal review' },
  { id: 'p6', type: 'Commitment', actorId: 'a2', description: 'Bob agrees to attend mediation' },
];

describe('Graph Builder', () => {
  it('should create nodes from actors and primitives', () => {
    const graph = buildConflictGraph(actors, primitives);
    // Should have 2 actors + 6 primitives = 8 nodes
    expect(graph.nodes.length).toBe(8);
  });

  it('should create actor-to-primitive edges', () => {
    const graph = buildConflictGraph(actors, primitives);
    // Each primitive with a known actor should have an edge
    const actorEdges = graph.edges.filter(e => {
      const src = typeof e.source === 'string' ? e.source : e.source.id;
      return src === 'a1' || src === 'a2';
    });
    expect(actorEdges.length).toBeGreaterThan(0);
  });

  it('should infer MAKES edges from Actor to Claim', () => {
    const graph = buildConflictGraph(actors, primitives);
    const makesEdges = graph.edges.filter(e => e.type === 'MAKES');
    expect(makesEdges.length).toBeGreaterThan(0);
  });

  it('should include analytics in graph', () => {
    const graph = buildConflictGraph(actors, primitives);
    expect(graph.analytics).toBeDefined();
    expect(graph.analytics.centralityScores).toBeDefined();
    expect(graph.analytics.bridgingNodes).toBeDefined();
    expect(graph.analytics.isolatedNodes).toBeDefined();
  });

  it('should handle empty inputs', () => {
    const graph = buildConflictGraph([], []);
    expect(graph.nodes.length).toBe(0);
    expect(graph.edges.length).toBe(0);
  });

  it('should detect cross-actor edges between interests', () => {
    const graph = buildConflictGraph(actors, primitives);
    // Alice and Bob both mention "respect" — should have an alignment edge
    const crossEdges = graph.edges.filter(e =>
      e.type === 'ALIGNS_WITH' || e.type === 'CONFLICTS_WITH'
    );
    expect(crossEdges.length).toBeGreaterThan(0);
  });

  it('should compute centrality scores for nodes', () => {
    const graph = buildConflictGraph(actors, primitives);
    const scores = graph.analytics.centralityScores;
    expect(Object.keys(scores).length).toBeGreaterThan(0);
  });
});
