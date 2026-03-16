'use client';

import { ConcordiaEventBus, ConcordiaEventName, ConcordiaEvents } from './concordia-events';

const CONCORDIA_PREFIX = 'concordia:';

export interface PostMessageConfig {
  targetOrigin: string; // '*' or specific origin
  eventBus: ConcordiaEventBus;
}

// Send events to parent window (when embedded as iframe)
export function initPostMessageBridge(config: PostMessageConfig) {
  const { targetOrigin, eventBus } = config;

  // Forward all events to parent
  const events: ConcordiaEventName[] = [
    'session:started', 'session:ended', 'session:paused',
    'phase:changed', 'primitive:extracted', 'agreement:reached',
    'escalation:detected', 'commonGround:identified', 'graph:updated',
    'speaker:identified', 'emotion:detected'
  ];

  const unsubscribers = events.map(event =>
    eventBus.on(event, (data) => {
      if (window.parent !== window) {
        window.parent.postMessage({ type: `${CONCORDIA_PREFIX}${event}`, payload: data }, targetOrigin);
      }
    })
  );

  // Listen for commands from host
  const handleMessage = (event: MessageEvent) => {
    if (!event.data?.type?.startsWith(CONCORDIA_PREFIX)) return;
    const command = event.data.type.replace(CONCORDIA_PREFIX, '');

    switch (command) {
      case 'start':
        // Trigger session start
        window.dispatchEvent(new CustomEvent('concordia:command', { detail: { command: 'start', payload: event.data.payload } }));
        break;
      case 'pause':
        window.dispatchEvent(new CustomEvent('concordia:command', { detail: { command: 'pause' } }));
        break;
      case 'injectContext':
        window.dispatchEvent(new CustomEvent('concordia:command', { detail: { command: 'injectContext', payload: event.data.payload } }));
        break;
    }
  };

  window.addEventListener('message', handleMessage);

  return () => {
    unsubscribers.forEach(unsub => unsub());
    window.removeEventListener('message', handleMessage);
  };
}
