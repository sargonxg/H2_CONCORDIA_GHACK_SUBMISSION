'use client';

import React from 'react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Subtle animated gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0C0C0E] via-[#0F1420] to-[#0C0C0E]">
        <div className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 30% 50%, rgba(91,138,245,0.15), transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(78,205,196,0.1), transparent 60%)',
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        {/* TACITUS Institute badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2A2A2E] bg-[#141416]/80 backdrop-blur mb-8">
          <span className="text-xs font-medium tracking-wider uppercase text-[#A8A4A0]">
            By the TACITUS Institute
          </span>
        </div>

        <h1 className="font-serif text-5xl md:text-7xl font-semibold text-[#F0EDE8] mb-6" style={{ letterSpacing: '-0.02em' }}>
          The World&apos;s First<br />
          <span className="bg-gradient-to-r from-[#4ECDC4] to-[#5B8AF5] bg-clip-text text-transparent">
            AI-Powered Live Mediator
          </span>
        </h1>

        <p className="text-lg md:text-xl text-[#A8A4A0] max-w-2xl mx-auto mb-10 leading-relaxed">
          CONCORDIA combines the Gemini Live Audio API with the TACITUS Conflict Ontology
          to guide real-time conflict resolution. Voice-native. Theory-grounded. Human-centered.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link href="/workspace"
            className="px-8 py-3.5 bg-[#5B8AF5] hover:bg-[#4A79E4] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#5B8AF5]/20 hover:shadow-[#5B8AF5]/30"
          >
            Start a Mediation
          </Link>
          <Link href="/demo"
            className="px-8 py-3.5 bg-[#1A1A1E] hover:bg-[#222226] text-[#F0EDE8] font-medium rounded-xl border border-[#2A2A2E] hover:border-[#3A3A3E] transition-all"
          >
            Watch Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
