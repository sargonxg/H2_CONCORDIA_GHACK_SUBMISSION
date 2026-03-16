import { describe, it, expect } from 'vitest';
import { selectFrameworks, calculateResolutionProbability } from '../../lib/theory-engine';
import type { ConflictState } from '../../lib/theory-engine';

const baseState: ConflictState = {
  phase: 'Discovery',
  escalationLevel: 30,
  glaslStage: 2,
  conflictType: 'workplace',
  partyAStyle: 'Collaborating',
  partyBStyle: 'Competing',
  powerBalance: 'balanced',
  culturalContext: '',
  impasse: false,
  emotionalIntensity: { partyA: 4, partyB: 5 },
};

describe('Theory Engine — selectFrameworks', () => {
  it('should return an array of recommendations', () => {
    const result = selectFrameworks(baseState);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should recommend Fisher & Ury for low Glasl stages', () => {
    const result = selectFrameworks({ ...baseState, glaslStage: 2 });
    const frameworks = result.map(r => r.framework.toLowerCase());
    const hasFisherUry = frameworks.some(f => f.includes('fisher') || f.includes('interest'));
    expect(hasFisherUry).toBe(true);
  });

  it('should recommend transformative approaches for mid Glasl stages', () => {
    const result = selectFrameworks({ ...baseState, glaslStage: 5 });
    const frameworks = result.map(r => r.framework.toLowerCase());
    const hasTransformative = frameworks.some(f =>
      f.includes('transform') || f.includes('bush') || f.includes('narrative') || f.includes('argyris')
    );
    expect(hasTransformative).toBe(true);
  });

  it('should boost impasse-breaking frameworks when impasse detected', () => {
    const normal = selectFrameworks({ ...baseState, impasse: false });
    const impasse = selectFrameworks({ ...baseState, impasse: true });

    // Should have some different/higher-scored frameworks
    expect(impasse.length).toBeGreaterThan(0);
    // Impasse recommendations should include solution-focused or ripeness frameworks
    const impasseFrameworks = impasse.map(r => r.framework.toLowerCase());
    const hasImpasseBreaker = impasseFrameworks.some(f =>
      f.includes('solution') || f.includes('zartman') || f.includes('coleman') || f.includes('ripeness')
    );
    expect(hasImpasseBreaker).toBe(true);
  });

  it('should include relevance scores between 0 and 100', () => {
    const result = selectFrameworks(baseState);
    for (const rec of result) {
      expect(rec.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(rec.relevanceScore).toBeLessThanOrEqual(100);
    }
  });

  it('should include suggested techniques', () => {
    const result = selectFrameworks(baseState);
    for (const rec of result) {
      expect(Array.isArray(rec.suggestedTechniques)).toBe(true);
    }
  });
});

describe('Theory Engine — calculateResolutionProbability', () => {
  it('should return a number between 0 and 100', () => {
    const prob = calculateResolutionProbability({
      commonGroundCount: 3,
      tensionPointCount: 2,
      agreementCount: 1,
      escalationLevel: 40,
      cooperativenessA: 60,
      cooperativenessB: 50,
      phase: 'Negotiation',
      impasses: 0,
      changeTalkCount: 5,
      sustainTalkCount: 3,
    });
    expect(prob).toBeGreaterThanOrEqual(0);
    expect(prob).toBeLessThanOrEqual(100);
  });

  it('should increase with more common ground', () => {
    const low = calculateResolutionProbability({
      commonGroundCount: 0, tensionPointCount: 2, agreementCount: 0,
      escalationLevel: 30, cooperativenessA: 50, cooperativenessB: 50,
      phase: 'Discovery', impasses: 0, changeTalkCount: 0, sustainTalkCount: 0,
    });
    const high = calculateResolutionProbability({
      commonGroundCount: 5, tensionPointCount: 2, agreementCount: 0,
      escalationLevel: 30, cooperativenessA: 50, cooperativenessB: 50,
      phase: 'Discovery', impasses: 0, changeTalkCount: 0, sustainTalkCount: 0,
    });
    expect(high).toBeGreaterThan(low);
  });

  it('should decrease with higher escalation', () => {
    const low = calculateResolutionProbability({
      commonGroundCount: 2, tensionPointCount: 2, agreementCount: 0,
      escalationLevel: 10, cooperativenessA: 50, cooperativenessB: 50,
      phase: 'Discovery', impasses: 0, changeTalkCount: 0, sustainTalkCount: 0,
    });
    const high = calculateResolutionProbability({
      commonGroundCount: 2, tensionPointCount: 2, agreementCount: 0,
      escalationLevel: 80, cooperativenessA: 50, cooperativenessB: 50,
      phase: 'Discovery', impasses: 0, changeTalkCount: 0, sustainTalkCount: 0,
    });
    expect(low).toBeGreaterThan(high);
  });

  it('should give phase bonus for Agreement phase', () => {
    const disc = calculateResolutionProbability({
      commonGroundCount: 2, tensionPointCount: 2, agreementCount: 1,
      escalationLevel: 20, cooperativenessA: 60, cooperativenessB: 60,
      phase: 'Discovery', impasses: 0, changeTalkCount: 3, sustainTalkCount: 1,
    });
    const agree = calculateResolutionProbability({
      commonGroundCount: 2, tensionPointCount: 2, agreementCount: 1,
      escalationLevel: 20, cooperativenessA: 60, cooperativenessB: 60,
      phase: 'Agreement', impasses: 0, changeTalkCount: 3, sustainTalkCount: 1,
    });
    expect(agree).toBeGreaterThan(disc);
  });
});
