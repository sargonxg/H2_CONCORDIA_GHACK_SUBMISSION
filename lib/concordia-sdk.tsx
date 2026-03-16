'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { ConcordiaEventBus, ConcordiaEvents, ConcordiaEventName } from './concordia-events';

interface ConcordiaContextType {
  eventBus: ConcordiaEventBus;
  isConnected: boolean;
  apiEndpoint: string;
}

const ConcordiaContext = createContext<ConcordiaContextType | null>(null);

export function ConcordiaProvider({
  children,
  apiEndpoint,
  authToken,
}: {
  children: React.ReactNode;
  apiEndpoint: string;
  authToken?: string;
}) {
  const eventBusRef = useRef(new ConcordiaEventBus());
  const [isConnected, setIsConnected] = useState(false);

  return (
    <ConcordiaContext.Provider value={{
      eventBus: eventBusRef.current,
      isConnected,
      apiEndpoint,
    }}>
      {children}
    </ConcordiaContext.Provider>
  );
}

export function useConcordiaEvents() {
  const ctx = useContext(ConcordiaContext);
  if (!ctx) throw new Error('useConcordiaEvents must be used within ConcordiaProvider');
  return ctx.eventBus;
}

export function useConcordiaState() {
  const ctx = useContext(ConcordiaContext);
  if (!ctx) throw new Error('useConcordiaState must be used within ConcordiaProvider');
  return {
    isConnected: ctx.isConnected,
    apiEndpoint: ctx.apiEndpoint,
    eventBus: ctx.eventBus,
  };
}
