// Accessibility utilities for CONCORDIA workspace

export const a11y = {
  liveRegion: (priority: 'polite' | 'assertive' = 'polite') => ({
    'aria-live': priority as 'polite' | 'assertive',
    role: 'log' as const,
  }),

  button: (label: string, pressed?: boolean) => ({
    'aria-label': label,
    ...(pressed !== undefined ? { 'aria-pressed': pressed } : {}),
    role: 'button' as const,
  }),

  status: (label: string) => ({
    'aria-label': label,
    role: 'status' as const,
  }),

  tab: (label: string, selected: boolean) => ({
    'aria-label': label,
    'aria-selected': selected,
    role: 'tab' as const,
  }),

  panel: (labelledBy: string) => ({
    'aria-labelledby': labelledBy,
    role: 'tabpanel' as const,
  }),

  region: (label: string) => ({
    'aria-label': label,
    role: 'region' as const,
  }),
};

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// BCP-47 language code mapping
export const LANGUAGE_MAP: Record<string, { code: string; name: string }> = {
  'English': { code: 'en-US', name: 'English' },
  'Spanish': { code: 'es-ES', name: 'Spanish' },
  'French': { code: 'fr-FR', name: 'French' },
  'German': { code: 'de-DE', name: 'German' },
  'Italian': { code: 'it-IT', name: 'Italian' },
  'Portuguese': { code: 'pt-BR', name: 'Portuguese' },
  'Chinese': { code: 'zh-CN', name: 'Chinese' },
  'Japanese': { code: 'ja-JP', name: 'Japanese' },
  'Korean': { code: 'ko-KR', name: 'Korean' },
  'Arabic': { code: 'ar-SA', name: 'Arabic' },
};
