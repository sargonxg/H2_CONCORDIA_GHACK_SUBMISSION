'use client';

import React from 'react';
import { Mic, Brain, Zap, BookOpen, FileText, Download } from 'lucide-react';

const features = [
  {
    icon: Mic,
    title: 'Voice-Native Mediation',
    description: 'Affective dialog with natural turn-taking, emotional intelligence, and real-time vocal analysis.',
    color: '#4ECDC4',
  },
  {
    icon: Brain,
    title: 'TACITUS Ontology',
    description: '8 conflict primitives map every dimension: Claims, Interests, Constraints, Leverage, and more.',
    color: '#A78BFA',
  },
  {
    icon: Zap,
    title: 'Real-Time Intelligence',
    description: 'Live extraction, ZOPA detection, escalation monitoring, and psychological profiling.',
    color: '#F59E0B',
  },
  {
    icon: BookOpen,
    title: '17+ Frameworks',
    description: 'Fisher & Ury to Glasl to NVC — applied contextually based on conflict dynamics.',
    color: '#5B8AF5',
  },
  {
    icon: FileText,
    title: 'Document Ingestion',
    description: 'Pre-session analysis of contracts, emails, and complaints for ontology pre-population.',
    color: '#34D399',
  },
  {
    icon: Download,
    title: 'Professional Export',
    description: 'Settlement agreements, case reports, and full audit trails for compliance.',
    color: '#F87171',
  },
];

export default function FeatureCards() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center font-serif text-3xl md:text-4xl text-[#F0EDE8] mb-4">
          Purpose-Built for Conflict Resolution
        </h2>
        <p className="text-center text-[#A8A4A0] mb-16 max-w-2xl mx-auto">
          Every feature designed by conflict resolution researchers, powered by Google&apos;s most advanced AI.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title}
              className="p-6 rounded-xl bg-[#141416] border border-[#2A2A2E] hover:border-[#3A3A3E] transition-all group"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: `${feature.color}15` }}
              >
                <feature.icon size={20} style={{ color: feature.color }} />
              </div>
              <h3 className="text-[#F0EDE8] font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-[#A8A4A0] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
