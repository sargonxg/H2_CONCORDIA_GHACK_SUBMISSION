import { describe, it, expect } from 'vitest';
import type {
  Case,
  Primitive,
  Actor,
  PrimitiveType,
  Agreement,
  EscalationFlag,
  PowerDynamics,
  ImpasseEvent,
} from '@/lib/types';

describe('Type contracts', () => {
  it('Case structure is valid', () => {
    const testCase: Case = {
      id: '1',
      title: 'Test',
      updatedAt: '2026-01-01T00:00:00Z',
      transcript: '',
      actors: [],
      primitives: [],
      partyAName: 'A',
      partyBName: 'B',
    };
    expect(testCase.id).toBe('1');
    expect(testCase.actors).toEqual([]);
    expect(testCase.primitives).toEqual([]);
  });

  it('PrimitiveType covers all 8 types', () => {
    const types: PrimitiveType[] = [
      'Actor', 'Claim', 'Interest', 'Constraint',
      'Leverage', 'Commitment', 'Event', 'Narrative',
    ];
    expect(types.length).toBe(8);
  });

  it('Actor structure is valid', () => {
    const actor: Actor = { id: 'a1', name: 'Alice', role: 'Disputant' };
    expect(actor.id).toBe('a1');
    expect(actor.name).toBe('Alice');
  });

  it('Primitive structure is valid', () => {
    const prim: Primitive = {
      id: 'p1',
      type: 'Claim',
      actorId: 'a1',
      description: 'Wants refund',
    };
    expect(prim.type).toBe('Claim');
    expect(prim.description).toBe('Wants refund');
  });

  it('Agreement structure is valid', () => {
    const agreement: Agreement = {
      id: 'ag1',
      topic: 'Payment',
      terms: 'Refund within 30 days',
      conditions: [],
      partyAAccepts: true,
      partyBAccepts: false,
      timestamp: new Date().toISOString(),
    };
    expect(agreement.partyAAccepts).toBe(true);
    expect(agreement.partyBAccepts).toBe(false);
  });

  it('PowerDynamics structure is valid', () => {
    const pd: PowerDynamics = {
      dimensions: [{ dimension: 'economic', score: -2, evidence: 'Party A controls budget' }],
      overallBalance: 'A-favored',
      rebalancingStrategy: 'Give Party B more procedural control',
      timestamp: new Date().toISOString(),
    };
    expect(pd.overallBalance).toBe('A-favored');
    expect(pd.dimensions[0].score).toBe(-2);
  });

  it('ImpasseEvent structure is valid', () => {
    const ev: ImpasseEvent = {
      id: 'imp1',
      signals: ['repeated positions', 'circular arguments'],
      duration: '10 minutes',
      lastNewInformation: 'Budget constraint mentioned 15 min ago',
      suggestedBreaker: 'future-casting',
      timestamp: new Date().toISOString(),
    };
    expect(ev.signals.length).toBe(2);
    expect(ev.suggestedBreaker).toBe('future-casting');
  });

  it('EscalationFlag structure is valid', () => {
    const flag: EscalationFlag = {
      id: 'ef1',
      trigger: "That's ridiculous",
      category: 'contempt',
      severity: 7,
      affectedParty: 'Party A',
      deEscalationTechnique: 'Acknowledge emotion, validate, slow pace',
      timestamp: new Date().toISOString(),
    };
    expect(flag.severity).toBe(7);
    expect(flag.category).toBe('contempt');
  });
});
