'use client';

import React from 'react';

interface EmbedContainerProps {
  children: React.ReactNode;
  layout: 'full' | 'compact' | 'minimal';
}

export default function EmbedContainer({ children, layout }: EmbedContainerProps) {
  return (
    <div
      className="concordia-embed-root"
      data-layout={layout}
      style={{
        contain: 'layout style paint',
        isolation: 'isolate',
        fontFamily: 'Inter, system-ui, sans-serif',
        colorScheme: 'dark',
        width: '100%',
        height: '100%',
        backgroundColor: '#0C0C0E',
        color: '#F0EDE8',
      }}
    >
      {children}
    </div>
  );
}
