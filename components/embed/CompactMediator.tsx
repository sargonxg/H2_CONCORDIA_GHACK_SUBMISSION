'use client';

import React, { useState } from 'react';
import { Mic, MicOff, ChevronDown, ChevronUp } from 'lucide-react';

interface CompactMediatorProps {
  isConnected: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  currentPhase: string;
  transcript: { speaker: string; text: string; timestamp: string }[];
  primitiveCount: Record<string, number>;
  partyAName: string;
  partyBName: string;
}

export default function CompactMediator({
  isConnected, isMuted, onToggleMute, currentPhase,
  transcript, primitiveCount, partyAName, partyBName,
}: CompactMediatorProps) {
  const [showTranscript, setShowTranscript] = useState(true);
  const [showPrimitives, setShowPrimitives] = useState(false);

  const totalPrimitives = Object.values(primitiveCount).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full max-w-[400px] bg-[#0C0C0E] text-[#F0EDE8] flex flex-col h-full" style={{ contain: 'layout style' }}>
      {/* Phase indicator */}
      <div className="px-4 py-2 border-b border-[#2A2A2E] flex items-center justify-between">
        <span className="text-xs font-medium text-[#A8A4A0] uppercase tracking-wider">{currentPhase}</span>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#34D399]' : 'bg-[#F87171]'}`} />
      </div>

      {/* Mic button */}
      <div className="flex justify-center py-4">
        <button
          onClick={onToggleMute}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isMuted
              ? 'bg-[#1A1A1E] border-2 border-[#3A3A3E] text-[#6E6B68]'
              : 'bg-[#5B8AF5]/20 border-2 border-[#5B8AF5] text-[#5B8AF5]'
          }`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
      </div>

      {/* Collapsible transcript */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="flex items-center justify-between px-4 py-2 text-xs font-medium text-[#A8A4A0] hover:text-[#F0EDE8]"
        >
          <span>Transcript</span>
          {showTranscript ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {showTranscript && (
          <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
            {transcript.slice(-10).map((entry, i) => (
              <div key={i} className="text-xs">
                <span className="font-medium" style={{ color: entry.speaker === partyAName ? '#4ECDC4' : entry.speaker === partyBName ? '#A78BFA' : '#5B8AF5' }}>
                  {entry.speaker}:
                </span>{' '}
                <span className="text-[#A8A4A0]">{entry.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Primitive counts */}
      <button
        onClick={() => setShowPrimitives(!showPrimitives)}
        className="flex items-center justify-between px-4 py-2 border-t border-[#2A2A2E] text-xs font-medium text-[#A8A4A0]"
      >
        <span>Primitives ({totalPrimitives})</span>
        {showPrimitives ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {showPrimitives && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {Object.entries(primitiveCount).filter(([, v]) => v > 0).map(([type, count]) => (
            <span key={type} className="px-2 py-0.5 rounded-full text-[10px] bg-[#1A1A1E] border border-[#2A2A2E] text-[#A8A4A0]">
              {type}: {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
