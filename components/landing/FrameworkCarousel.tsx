'use client';

import React from 'react';

const FRAMEWORKS = [
  { name: 'Fisher & Ury', desc: 'Principled negotiation separating people from problems.', tag: 'Interest-based disputes' },
  { name: 'Glasl 9-Stage', desc: 'Escalation model for diagnosing conflict intensity.', tag: 'Escalation assessment' },
  { name: 'Thomas-Kilmann', desc: 'Five conflict-handling modes for style profiling.', tag: 'Style analysis' },
  { name: 'Bush & Folger', desc: 'Transformative mediation through empowerment and recognition.', tag: 'Relationship repair' },
  { name: 'Winslade & Monk', desc: 'Narrative mediation reauthoring conflict stories.', tag: 'Identity conflicts' },
  { name: 'Gottman', desc: 'Four Horsemen detection for destructive communication.', tag: 'De-escalation' },
  { name: 'Ury', desc: 'Getting Past No — breakthrough strategies for deadlock.', tag: 'Impasse breaking' },
  { name: 'Lederach', desc: 'Conflict transformation addressing root causes.', tag: 'Systemic conflicts' },
  { name: 'Zartman', desc: 'Ripeness theory for timing interventions.', tag: 'Timing & readiness' },
  { name: 'Raiffa', desc: 'Integrative bargaining and joint gains analysis.', tag: 'Complex negotiations' },
  { name: 'NVC (Rosenberg)', desc: 'Nonviolent communication connecting needs and feelings.', tag: 'Emotional conflicts' },
  { name: 'Deutsch', desc: 'Constructive conflict and cooperation theory.', tag: 'Team dynamics' },
  { name: 'Susskind', desc: 'Consensus building for multi-party disputes.', tag: 'Multi-stakeholder' },
  { name: 'Shapiro', desc: 'Negotiating the nonnegotiable — identity-based conflicts.', tag: 'Values disputes' },
  { name: 'Axelrod', desc: 'Evolution of cooperation and reciprocity strategies.', tag: 'Repeated interactions' },
  { name: 'Ostrom', desc: 'Governing commons through institutional design.', tag: 'Resource conflicts' },
  { name: 'Mnookin', desc: 'Beyond winning — problem-solving negotiation.', tag: 'Legal disputes' },
];

function FrameworkCard({ name, desc, tag }: { name: string; desc: string; tag: string }) {
  return (
    <div className="flex-shrink-0 w-72 p-5 rounded-xl bg-[#141416] border border-[#2A2A2E] mx-3">
      <h4 className="text-sm font-semibold text-[#F0EDE8] mb-1.5">{name}</h4>
      <p className="text-xs text-[#A8A4A0] leading-relaxed mb-3">{desc}</p>
      <span className="inline-block text-[10px] font-medium uppercase tracking-wider text-[#5B8AF5] bg-[#5B8AF5]/10 px-2.5 py-1 rounded-full border border-[#5B8AF5]/20">
        {tag}
      </span>
    </div>
  );
}

export default function FrameworkCarousel() {
  const topRow = FRAMEWORKS.slice(0, 9);
  const bottomRow = FRAMEWORKS.slice(9);

  return (
    <section className="py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <h2 className="text-center font-serif text-3xl md:text-4xl text-[#F0EDE8] mb-4">
          Grounded in Science
        </h2>
        <p className="text-center text-[#A8A4A0] max-w-2xl mx-auto">
          Every intervention draws from 60+ years of peer-reviewed conflict resolution research.
          17+ frameworks applied contextually based on live conflict dynamics.
        </p>
      </div>

      {/* Top row — scrolls left */}
      <div className="relative mb-4">
        <div className="animate-marquee whitespace-nowrap flex">
          {[...topRow, ...topRow].map((fw, i) => (
            <FrameworkCard key={`top-${i}`} {...fw} />
          ))}
        </div>
      </div>

      {/* Bottom row — scrolls right (reverse) */}
      <div className="relative">
        <div className="animate-marquee-reverse whitespace-nowrap flex">
          {[...bottomRow, ...bottomRow, ...bottomRow].map((fw, i) => (
            <FrameworkCard key={`bot-${i}`} {...fw} />
          ))}
        </div>
      </div>
    </section>
  );
}
