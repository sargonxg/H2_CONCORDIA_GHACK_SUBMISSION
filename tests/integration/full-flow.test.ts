import { describe, it, expect } from 'vitest';
import { exportAsMarkdown, exportAsJSON } from '../../lib/export';
import type { Case, Actor, Primitive, Agreement, TimelineEntry, EmotionSnapshot } from '../../lib/types';

const mockActors: Actor[] = [
  { id: 'a1', name: 'Alice', role: 'Manager' },
  { id: 'a2', name: 'Bob', role: 'Developer' },
];

const mockPrimitives: Primitive[] = [
  { id: 'p1', type: 'Claim', actorId: 'a1', description: 'Wants formal acknowledgment' },
  { id: 'p2', type: 'Interest', actorId: 'a2', description: 'Needs autonomy in work process' },
  { id: 'p3', type: 'Constraint', actorId: 'a1', description: 'Company policy limits options' },
];

const mockAgreements: Agreement[] = [
  {
    id: 'ag1',
    topic: 'Communication protocol',
    terms: 'Weekly check-ins with structured agenda',
    conditions: ['Both parties attend', 'HR reviews after 30 days'],
    partyAAccepts: true,
    partyBAccepts: true,
    timestamp: '2024-01-15T10:00:00Z',
  },
];

const mockTimeline: TimelineEntry[] = [
  {
    id: 't1', timestamp: '2024-01-15T10:00:00Z', elapsedSeconds: 0,
    type: 'phase-change', content: 'Session started', phase: 'Opening',
  },
  {
    id: 't2', timestamp: '2024-01-15T10:05:00Z', elapsedSeconds: 300,
    type: 'utterance', content: 'Alice described the situation', actor: 'Alice', phase: 'Discovery',
  },
];

const mockEmotionTimeline: EmotionSnapshot[] = [
  {
    timestamp: '2024-01-15T10:00:00Z', elapsedSeconds: 0,
    partyA: { emotionalState: 'Tense', emotionalIntensity: 6, emotionalTrajectory: 'stable', conflictStyle: 'Competing', cooperativeness: 40, defensiveness: 60 },
    partyB: { emotionalState: 'Calm', emotionalIntensity: 3, emotionalTrajectory: 'stable', conflictStyle: 'Avoiding', cooperativeness: 50, defensiveness: 30 },
    phase: 'Opening', escalationScore: 35,
  },
];

function buildMockCase(overrides?: Partial<Case>): Case {
  return {
    id: 'test-case-1',
    title: 'Workplace Dispute: Alice vs Bob',
    updatedAt: '2024-01-15T10:00:00Z',
    transcript: 'Alice: I need acknowledgment.\nBob: I want freedom to work.',
    actors: mockActors,
    primitives: mockPrimitives,
    partyAName: 'Alice (Manager)',
    partyBName: 'Bob (Developer)',
    timeline: mockTimeline,
    emotionTimeline: mockEmotionTimeline,
    ...overrides,
  };
}

describe('Full Mediation Flow — Export Integration', () => {
  it('should export a complete case as Markdown', () => {
    const caseData = buildMockCase();
    const md = exportAsMarkdown(caseData);

    expect(md).toContain('Workplace Dispute');
    expect(md).toContain('Alice');
    expect(md).toContain('Bob');
    expect(md).toContain('Claim');
    expect(md).toContain('Interest');
  });

  it('should export a complete case as JSON', () => {
    const caseData = buildMockCase({
      partyAName: 'Alice',
      partyBName: 'Bob',
      transcript: 'Transcript content...',
    });
    const json = exportAsJSON(caseData);

    const parsed = JSON.parse(json);
    expect(parsed.case.title).toBe('Workplace Dispute: Alice vs Bob');
    expect(parsed.case.actors).toHaveLength(2);
    expect(parsed.case.primitives).toHaveLength(3);
  });

  it('should include timeline data in enhanced markdown export', () => {
    const caseData = buildMockCase();
    const md = exportAsMarkdown(caseData);

    // Enhanced export should include timeline/phase data
    expect(md).toContain('Opening');
  });

  it('should handle empty case data gracefully', () => {
    const emptyCase = buildMockCase({
      title: 'Empty Case',
      partyAName: 'A',
      partyBName: 'B',
      transcript: '',
      actors: [],
      primitives: [],
      timeline: [],
      emotionTimeline: [],
    });

    const md = exportAsMarkdown(emptyCase);
    expect(md).toContain('Empty Case');

    const json = exportAsJSON(emptyCase);
    const parsed = JSON.parse(json);
    expect(parsed.case.actors).toHaveLength(0);
    expect(parsed.case.primitives).toHaveLength(0);
  });
});

describe('Full Mediation Flow — Type Integrity', () => {
  it('should have consistent actor references in primitives', () => {
    const actorIds = new Set(mockActors.map(a => a.id));
    for (const p of mockPrimitives) {
      expect(actorIds.has(p.actorId)).toBe(true);
    }
  });

  it('should have valid agreement structure', () => {
    for (const a of mockAgreements) {
      expect(a.id).toBeDefined();
      expect(a.topic).toBeDefined();
      expect(a.terms).toBeDefined();
      expect(typeof a.partyAAccepts).toBe('boolean');
      expect(typeof a.partyBAccepts).toBe('boolean');
    }
  });

  it('should have valid timeline entries', () => {
    for (const t of mockTimeline) {
      expect(t.id).toBeDefined();
      expect(t.timestamp).toBeDefined();
      expect(typeof t.elapsedSeconds).toBe('number');
      expect(t.phase).toBeDefined();
    }
  });
});
