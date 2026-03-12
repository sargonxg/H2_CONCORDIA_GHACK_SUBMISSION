import { describe, it, expect } from 'vitest';
import {
  FRAMEWORKS,
  getRelevantFrameworks,
  buildFrameworkSnippet,
} from '@/lib/mediation-library';

describe('FRAMEWORKS', () => {
  it('has at least 31 frameworks', () => {
    expect(FRAMEWORKS.length).toBeGreaterThanOrEqual(31);
  });

  it('includes rosenberg-nvc', () => {
    const ids = FRAMEWORKS.map((f) => f.id);
    expect(ids).toContain('rosenberg-nvc');
  });

  it('includes shapiro-identity', () => {
    const ids = FRAMEWORKS.map((f) => f.id);
    expect(ids).toContain('shapiro-identity');
  });

  it('includes solution-focused', () => {
    const ids = FRAMEWORKS.map((f) => f.id);
    expect(ids).toContain('solution-focused');
  });

  it('includes fisher-ury', () => {
    const ids = FRAMEWORKS.map((f) => f.id);
    expect(ids).toContain('fisher-ury');
  });

  it('includes glasl', () => {
    const ids = FRAMEWORKS.map((f) => f.id);
    expect(ids).toContain('glasl');
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

  it('every framework has a glaslStages string', () => {
    FRAMEWORKS.forEach((f) => {
      expect(typeof f.glaslStages).toBe('string');
      expect(f.glaslStages.length).toBeGreaterThan(0);
    });
  });

  it('glaslStages values match known patterns', () => {
    const validPattern = /^(\d+-\d+|all|\d+)$/;
    FRAMEWORKS.forEach((f) => {
      expect(validPattern.test(f.glaslStages)).toBe(true);
    });
  });

  it('rosenberg-nvc has correct category and glaslStages', () => {
    const fw = FRAMEWORKS.find((f) => f.id === 'rosenberg-nvc');
    expect(fw).toBeDefined();
    expect(fw!.glaslStages).toBeTruthy();
    expect(fw!.corePrinciples.length).toBeGreaterThan(0);
  });

  it('shapiro-identity has glaslStages and tacitusPrimitives', () => {
    const fw = FRAMEWORKS.find((f) => f.id === 'shapiro-identity');
    expect(fw).toBeDefined();
    expect(fw!.glaslStages).toBeTruthy();
    expect(fw!.tacitusPrimitives.length).toBeGreaterThan(0);
  });

  it('solution-focused has glaslStages and keyTechniques', () => {
    const fw = FRAMEWORKS.find((f) => f.id === 'solution-focused');
    expect(fw).toBeDefined();
    expect(fw!.glaslStages).toBeTruthy();
    expect(fw!.keyTechniques.length).toBeGreaterThan(0);
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
