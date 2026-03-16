'use client';

import React from 'react';
import { Shield, Lock, Server, AlertCircle } from 'lucide-react';

const trustItems = [
  {
    icon: Shield,
    title: 'Real-Time Processing Only',
    description: 'Your conversations are processed in real-time and not stored by Google. Audio data is ephemeral.',
    color: '#4ECDC4',
  },
  {
    icon: Server,
    title: 'Enterprise-Grade Infrastructure',
    description: 'Built on Vertex AI with data residency controls. SOC 2 compliant Google Cloud infrastructure.',
    color: '#5B8AF5',
  },
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'All data in transit is encrypted via TLS 1.3. Session data stored locally in your browser only.',
    color: '#A78BFA',
  },
  {
    icon: AlertCircle,
    title: 'Not Legal Advice',
    description: 'CONCORDIA is a mediation facilitation tool. It does not provide legal advice or serve as a substitute for professional legal counsel.',
    color: '#F59E0B',
  },
];

export default function TrustSection() {
  return (
    <section className="py-24 px-6 bg-[#0A0A0C]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center font-serif text-3xl md:text-4xl text-[#F0EDE8] mb-4">
          Trust & Security
        </h2>
        <p className="text-center text-[#A8A4A0] mb-16 max-w-2xl mx-auto">
          Built with privacy and professional ethics at the foundation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 p-6 rounded-xl bg-[#141416] border border-[#2A2A2E]"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${item.color}12` }}
              >
                <item.icon size={20} style={{ color: item.color }} />
              </div>
              <div>
                <h3 className="text-[#F0EDE8] font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-[#A8A4A0] leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
