import { describe, it, expect } from 'vitest';
import { generateAgreementHTML } from '@/lib/export';

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
