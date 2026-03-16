'use client';

import { useState, useEffect, useCallback } from 'react';
import { sessionStore } from '../lib/session-store';
import type { StoredSession } from '../lib/types';

export function useSessionResume(sessionId: string | null) {
  const [storedSession, setStoredSession] = useState<StoredSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    setIsLoading(true);
    sessionStore.getSession(sessionId).then((session) => {
      if (cancelled) return;
      if (session && session.status !== 'completed') {
        setStoredSession(session);
        setShowResumeDialog(true);
      }
      setIsLoading(false);
    }).catch(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  /** Accept the stored session and return it for hydration. */
  const resumeSession = useCallback((): StoredSession | null => {
    setShowResumeDialog(false);
    return storedSession;
  }, [storedSession]);

  /** Decline the stored session and start fresh. */
  const startFresh = useCallback((): null => {
    setShowResumeDialog(false);
    setStoredSession(null);
    return null;
  }, []);

  return {
    storedSession,
    isLoading,
    showResumeDialog,
    resumeSession,
    startFresh,
  };
}
