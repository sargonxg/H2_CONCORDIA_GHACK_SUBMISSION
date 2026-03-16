// ── CONCORDIA Design System ──────────────────────────────────────────────────

export const CONCORDIA_DESIGN = {
  colors: {
    bg: { base: '#0C0C0E', elevated: '#141416', overlay: '#1A1A1E', hover: '#222226' },
    border: { subtle: '#2A2A2E', medium: '#3A3A3E', strong: '#4A4A4E' },
    text: { primary: '#F0EDE8', secondary: '#A8A4A0', muted: '#6E6B68', inverse: '#0C0C0E' },
    accent: { primary: '#5B8AF5', hover: '#4A79E4', muted: '#5B8AF520' },
    partyA: { base: '#4ECDC4', light: '#4ECDC420', border: '#4ECDC440' },
    partyB: { base: '#A78BFA', light: '#A78BFA20', border: '#A78BFA40' },
    success: { base: '#34D399', light: '#34D39920' },
    warning: { base: '#FBBF24', light: '#FBBF2420' },
    danger: { base: '#F87171', light: '#F8717120' },
    phase: {
      Opening: '#60A5FA', Discovery: '#A78BFA', Exploration: '#F59E0B',
      Negotiation: '#10B981', Resolution: '#6366F1', Agreement: '#34D399',
    } as Record<string, string>,
  },
  type: {
    display: { size: '2rem', weight: 600, tracking: '-0.02em', family: 'Instrument Serif' },
    heading: { size: '1.125rem', weight: 600, tracking: '-0.01em' },
    subheading: { size: '0.8125rem', weight: 600, tracking: '0.04em', transform: 'uppercase' as const },
    body: { size: '0.875rem', weight: 400, lineHeight: 1.6 },
    caption: { size: '0.75rem', weight: 500 },
    mono: { size: '0.8125rem', weight: 400, family: 'JetBrains Mono' },
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 6, md: 8, lg: 12, xl: 16 },
  shadow: {
    subtle: '0 1px 2px rgba(0,0,0,0.3)',
    medium: '0 4px 12px rgba(0,0,0,0.4)',
    glow: (color: string) => `0 0 20px ${color}20`,
  }
} as const;

/** Returns the phase color from the design system, or a fallback gray. */
export function phaseColor(phase: string): string {
  return CONCORDIA_DESIGN.colors.phase[phase] ?? '#6E6B68';
}

/** Classname helper — filters out falsy values and joins with spaces. */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
