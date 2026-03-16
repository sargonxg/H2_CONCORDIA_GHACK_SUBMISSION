'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import EmbedContainer from '../../components/embed/EmbedContainer';
import CompactMediator from '../../components/embed/CompactMediator';

function EmbedContent() {
  const searchParams = useSearchParams();
  const layout = (searchParams.get('layout') || 'compact') as 'full' | 'compact' | 'minimal';

  return (
    <EmbedContainer layout={layout}>
      <CompactMediator
        isConnected={false}
        isMuted={true}
        onToggleMute={() => {}}
        currentPhase="Opening"
        transcript={[]}
        primitiveCount={{}}
        partyAName={searchParams.get('partyA') || 'Party A'}
        partyBName={searchParams.get('partyB') || 'Party B'}
      />
    </EmbedContainer>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#0C0C0E] text-[#A8A4A0]">Loading...</div>}>
      <EmbedContent />
    </Suspense>
  );
}
