import { describe, it, expect } from 'vitest';
import { generateAgreementHTML, formatAgreementAsText } from '@/lib/export';

const META = {
  caseTitle: 'Smith vs Jones Workplace Dispute',
  caseType: 'Employment',
  partyAName: 'Alice Smith',
  partyBName: 'Bob Jones',
  date: '2026-03-12',
};

const AGREEMENT = {
  preamble: 'This agreement is entered into voluntarily by both parties.',
  background: 'A workplace conflict arose regarding project responsibilities.',
  agreedTerms: [
    { number: 1, title: 'Weekly Check-in', text: 'Both parties agree to a weekly 30-minute check-in.', responsible: 'Both', deadline: '2026-04-01' },
    { number: 2, title: 'Escalation Path', text: 'Disputes will be escalated to HR within 48 hours.', responsible: 'HR', deadline: '2026-03-20' },
  ],
  implementationPlan: 'Both parties will review progress monthly.',
  reviewMechanism: '90-day review with HR',
  confidentiality: 'This agreement is confidential.',
  acknowledgment: 'Both parties acknowledge the terms above.',
  disclaimer: 'CONCORDIA is a communication facilitation tool.',
};

describe('generateAgreementHTML', () => {
  it('returns a non-empty HTML string', () => {
    const html = generateAgreementHTML(AGREEMENT, META);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(100);
  });

  it('produces valid HTML with doctype and html tags', () => {
    const html = generateAgreementHTML(AGREEMENT, META);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('includes party A name', () => {
    const html = generateAgreementHTML(AGREEMENT, META);
    expect(html).toContain('Alice Smith');
  });

  it('includes party B name', () => {
    const html = generateAgreementHTML(AGREEMENT, META);
    expect(html).toContain('Bob Jones');
  });

  it('includes case title', () => {
    const html = generateAgreementHTML(AGREEMENT, META);
    expect(html).toContain('Smith vs Jones Workplace Dispute');
  });

  it('includes agreed term titles', () => {
    const html = generateAgreementHTML(AGREEMENT, META);
    expect(html).toContain('Weekly Check-in');
    expect(html).toContain('Escalation Path');
  });

  it('includes agreed term text', () => {
    const html = generateAgreementHTML(AGREEMENT, META);
    expect(html).toContain('Both parties agree to a weekly 30-minute check-in.');
  });

  it('includes TACITUS branding (title tag or body)', () => {
    const html = generateAgreementHTML(AGREEMENT, META);
    // The title should reference the case, and CONCORDIA/TACITUS appears in the HTML
    expect(html.toLowerCase()).toMatch(/tacitus|concordia/);
  });

  it('includes the disclaimer', () => {
    const html = generateAgreementHTML(AGREEMENT, META);
    expect(html).toContain('CONCORDIA is a communication facilitation tool');
  });

  it('includes preamble text', () => {
    const html = generateAgreementHTML(AGREEMENT, META);
    expect(html).toContain('entered into voluntarily');
  });

  it('includes responsible party in term metadata', () => {
    const html = generateAgreementHTML(AGREEMENT, META);
    expect(html).toContain('Both');
    expect(html).toContain('HR');
  });

  it('includes deadline in term metadata', () => {
    const html = generateAgreementHTML(AGREEMENT, META);
    expect(html).toContain('2026-04-01');
  });

  it('works with empty agreedTerms array', () => {
    const html = generateAgreementHTML({ ...AGREEMENT, agreedTerms: [] }, META);
    expect(html).toBeTruthy();
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('works with minimal agreement (no optional fields)', () => {
    const html = generateAgreementHTML({}, META);
    expect(html).toBeTruthy();
    expect(html).toContain('Alice Smith');
  });

  it('date is included in the document', () => {
    const html = generateAgreementHTML(AGREEMENT, META);
    expect(html).toContain('2026-03-12');
  });
});

describe('formatAgreementAsText', () => {
  const PLAIN_AGREEMENT = {
    preamble: 'This agreement is entered into voluntarily by both parties.',
    background: 'A workplace conflict arose regarding project responsibilities.',
    agreedTerms: [
      { number: 1, title: 'Weekly Check-in', text: 'Both parties agree to a weekly 30-minute check-in.', responsible: 'Both', deadline: '2026-04-01' },
      { number: 2, title: 'Escalation Path', text: 'Disputes will be escalated to HR within 48 hours.', responsible: 'HR', deadline: '2026-03-20' },
    ],
    implementationPlan: 'Both parties will review progress monthly.',
    reviewMechanism: '90-day review with HR',
    confidentiality: 'This agreement is confidential.',
    disclaimer: 'CONCORDIA is a communication facilitation tool.',
  };

  it('returns a non-empty string', () => {
    const text = formatAgreementAsText(PLAIN_AGREEMENT, 'Alice Smith', 'Bob Jones');
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(100);
  });

  it('includes the title header', () => {
    const text = formatAgreementAsText(PLAIN_AGREEMENT, 'Alice Smith', 'Bob Jones');
    expect(text).toContain('MEDIATION SETTLEMENT AGREEMENT');
  });

  it('includes party names in signature block', () => {
    const text = formatAgreementAsText(PLAIN_AGREEMENT, 'Alice Smith', 'Bob Jones');
    expect(text).toContain('Alice Smith');
    expect(text).toContain('Bob Jones');
  });

  it('includes TACITUS/CONCORDIA branding', () => {
    const text = formatAgreementAsText(PLAIN_AGREEMENT, 'Alice Smith', 'Bob Jones');
    expect(text.toLowerCase()).toMatch(/tacitus|concordia/);
  });

  it('includes agreed terms', () => {
    const text = formatAgreementAsText(PLAIN_AGREEMENT, 'Alice Smith', 'Bob Jones');
    expect(text).toContain('Weekly Check-in');
    expect(text).toContain('Escalation Path');
  });

  it('includes agreed terms text', () => {
    const text = formatAgreementAsText(PLAIN_AGREEMENT, 'Alice Smith', 'Bob Jones');
    expect(text).toContain('Both parties agree to a weekly 30-minute check-in.');
  });

  it('includes responsible and deadline metadata', () => {
    const text = formatAgreementAsText(PLAIN_AGREEMENT, 'Alice Smith', 'Bob Jones');
    expect(text).toContain('Responsible: Both');
    expect(text).toContain('Deadline: 2026-04-01');
  });

  it('includes the preamble', () => {
    const text = formatAgreementAsText(PLAIN_AGREEMENT, 'Alice Smith', 'Bob Jones');
    expect(text).toContain('entered into voluntarily');
  });

  it('includes the implementation plan', () => {
    const text = formatAgreementAsText(PLAIN_AGREEMENT, 'Alice Smith', 'Bob Jones');
    expect(text).toContain('IMPLEMENTATION PLAN');
    expect(text).toContain('review progress monthly');
  });

  it('includes the review mechanism', () => {
    const text = formatAgreementAsText(PLAIN_AGREEMENT, 'Alice Smith', 'Bob Jones');
    expect(text).toContain('REVIEW MECHANISM');
    expect(text).toContain('90-day review');
  });

  it('includes confidentiality section', () => {
    const text = formatAgreementAsText(PLAIN_AGREEMENT, 'Alice Smith', 'Bob Jones');
    expect(text).toContain('CONFIDENTIALITY');
    expect(text).toContain('This agreement is confidential.');
  });

  it('includes disclaimer', () => {
    const text = formatAgreementAsText(PLAIN_AGREEMENT, 'Alice Smith', 'Bob Jones');
    expect(text).toContain('CONCORDIA is a communication facilitation tool.');
  });

  it('works with minimal agreement (no optional fields)', () => {
    const text = formatAgreementAsText({}, 'Alice', 'Bob');
    expect(text).toBeTruthy();
    expect(text).toContain('MEDIATION SETTLEMENT AGREEMENT');
    expect(text).toContain('Alice');
    expect(text).toContain('Bob');
  });

  it('works with empty agreedTerms array', () => {
    const text = formatAgreementAsText({ agreedTerms: [] }, 'Alice', 'Bob');
    expect(text).toBeTruthy();
    expect(text).not.toContain('AGREED TERMS');
  });
});
