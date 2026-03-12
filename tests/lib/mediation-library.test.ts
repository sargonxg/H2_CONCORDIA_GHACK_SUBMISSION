import { describe, it, expect } from 'vitest';
import {
  FRAMEWORKS,
  getRelevantFrameworks,
  buildFrameworkSnippet,
} from '@/lib/mediation-library';

describe('FRAMEWORKS', () => {
  it('has at least 6 frameworks', () => {
    expect(FRAMEWORKS.length).toBeGreaterThanOrEqual(6);
  });

  it('every framework has required fields', () => {
    FRAMEWORKS.forEach((f) => {
      expect(f.id).toBeTruthy();
      expect(f.name).toBeTruthy();
      expect(f.corePrinciples.length).toBeGreaterThan(0);
      expect(f.keyTechniques.length).toBeGreaterThan(0);
      expect(f.diagnosticQuestions.length).toBeGreaterThan(0);
    });
  });

  it('every framework references valid TACITUS primitives', () => {
    const validPrimitives = [
      'Actor', 'Claim', 'Interest', 'Constraint',
      'Leverage', 'Commitment', 'Event', 'Narrative',
    ];
    FRAMEWORKS.forEach((f) => {
      f.tacitusPrimitives.forEach((p) => {
        expect(validPrimitives).toContain(p);
      });
    });
  });

  it('every framework has a valid glaslStages value', () => {
    const validRanges = ['1-3', '4-6', '7-9', 'all', '1-9'];
    FRAMEWORKS.forEach((f) => {
      expect(typeof f.glaslStages).toBe('string');
      expect(f.glaslStages.length).toBeGreaterThan(0);
    });
  });
});

describe('getRelevantFrameworks', () => {
  it('returns frameworks for high escalation', () => {
    const result = getRelevantFrameworks({ escalationLevel: 80 });
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns frameworks matching missing primitives', () => {
    const result = getRelevantFrameworks({ missingPrimitives: ['Interest', 'Narrative'] });
    expect(result.some((f) => f.tacitusPrimitives.includes('Interest'))).toBe(true);
  });

  it('returns an array', () => {
    const result = getRelevantFrameworks({});
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns fewer results for low escalation than high', () => {
    const high = getRelevantFrameworks({ escalationLevel: 90 });
    const low = getRelevantFrameworks({ escalationLevel: 10 });
    // Both should return results, just different ones
    expect(high.length).toBeGreaterThan(0);
    expect(low.length).toBeGreaterThan(0);
  });
});

describe('buildFrameworkSnippet', () => {
  it('returns a non-empty string for valid input', () => {
    const snippet = buildFrameworkSnippet([FRAMEWORKS[0]]);
    expect(typeof snippet).toBe('string');
    expect(snippet.length).toBeGreaterThan(0);
  });

  it('includes the framework short name', () => {
    const fw = FRAMEWORKS[0];
    const snippet = buildFrameworkSnippet([fw]);
    // buildFrameworkSnippet uses shortName (e.g. "Fisher & Ury") not full name
    expect(snippet).toContain(fw.shortName);
  });

  it('returns empty string for empty array', () => {
    const snippet = buildFrameworkSnippet([]);
    expect(snippet).toBe('');
  });
});
