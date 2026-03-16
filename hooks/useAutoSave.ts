'use client';

import { useRef, useCallback, useEffect } from 'react';
import { sessionStore } from '../lib/session-store';
import type {
  Primitive,
  Actor,
  Agreement,
  LiveMediationState,
  TimelineEntry,
  EmotionSnapshot,
  AuditEntry,
} from '../lib/types';

export function useAutoSave(sessionId: string | null) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveRef = useRef<string>('');

  // Debounced save for transcript (updates frequently)
  const saveTranscript = useCallback(
    (text: string) => {
      if (!sessionId) return;
      // Skip if content hasn't changed
      if (text === lastSaveRef.current) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        lastSaveRef.current = text;
        sessionStore.appendTranscript(sessionId, text);
      }, 2000);
    },
    [sessionId],
  );

  // Immediate saves for important structural events
  const savePrimitive = useCallback(
    (primitive: Primitive) => {
      if (!sessionId) return;
      sessionStore.upsertPrimitive(sessionId, primitive);
    },
    [sessionId],
  );

  const saveActor = useCallback(
    (actor: Actor) => {
      if (!sessionId) return;
      sessionStore.upsertActor(sessionId, actor);
    },
    [sessionId],
  );

  const saveAgreement = useCallback(
    (agreement: Agreement) => {
      if (!sessionId) return;
      sessionStore.addAgreement(sessionId, agreement);
    },
    [sessionId],
  );

  const saveMediationState = useCallback(
    (state: LiveMediationState) => {
      if (!sessionId) return;
      sessionStore.updateMediationState(sessionId, state);
    },
    [sessionId],
  );

  const saveTimelineEvent = useCallback(
    (event: TimelineEntry) => {
      if (!sessionId) return;
      sessionStore.addTimelineEvent(sessionId, event);
    },
    [sessionId],
  );

  const saveEmotionSnapshot = useCallback(
    (snapshot: EmotionSnapshot) => {
      if (!sessionId) return;
      sessionStore.addEmotionSnapshot(sessionId, snapshot);
    },
    [sessionId],
  );

  const addAudit = useCallback(
    (
      action: string,
      details: Record<string, any>,
      actor: AuditEntry['actor'] = 'system',
    ) => {
      if (!sessionId) return;
      sessionStore.addAuditEntry(sessionId, {
        timestamp: new Date().toISOString(),
        action,
        details,
        actor,
      });
    },
    [sessionId],
  );

  // Cleanup pending debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return {
    saveTranscript,
    savePrimitive,
    saveActor,
    saveAgreement,
    saveMediationState,
    saveTimelineEvent,
    saveEmotionSnapshot,
    addAudit,
  };
}
