'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Mic, FileText, BarChart3, Download } from 'lucide-react';

const TUTORIAL_KEY = 'concordia-tutorial-completed';

const steps = [
  {
    icon: BarChart3,
    title: 'The Mediation Workspace',
    description: 'This is your command center. The left panel shows case info and party profiles. The center is for live conversation. The right panel shows analysis, graphs, and agreements.',
    highlight: 'layout',
  },
  {
    icon: FileText,
    title: 'Start with Intake',
    description: 'Click "New Mediation" to open the Intake Wizard. Name the parties, upload documents, set the mediator style, and provide case context. Documents will be analyzed to pre-populate the conflict ontology.',
    highlight: 'intake',
  },
  {
    icon: Mic,
    title: 'During Mediation',
    description: 'CONCORDIA listens to both parties via your microphone and guides the conversation. The AI extracts conflict primitives, tracks emotions, detects escalation, and identifies common ground — all in real-time.',
    highlight: 'mediation',
  },
  {
    icon: Download,
    title: 'After Mediation',
    description: 'Export your session as a professional report, settlement agreement, or structured JSON. All agreements, primitives, and the full transcript are preserved for review.',
    highlight: 'export',
  },
];

interface WorkspaceTutorialProps {
  onComplete: () => void;
}

export default function WorkspaceTutorial({ onComplete }: WorkspaceTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_KEY);
    if (!completed) {
      setVisible(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!visible) return null;

  const step = steps[currentStep]!;
  const isLast = currentStep === steps.length - 1;
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-[#141416] border border-[#2A2A2E] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2E]">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg text-[#F0EDE8]">Welcome to CONCORDIA</span>
          </div>
          <button
            onClick={handleSkip}
            className="text-[#6E6B68] hover:text-[#F0EDE8] transition-colors"
            aria-label="Skip tutorial"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step content */}
        <div className="px-6 py-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#5B8AF5]/10 flex items-center justify-center">
              <Icon size={32} className="text-[#5B8AF5]" />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-[#F0EDE8] text-center mb-3">
            {step.title}
          </h2>
          <p className="text-[#A8A4A0] text-center leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 pb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentStep ? 'bg-[#5B8AF5]' : i < currentStep ? 'bg-[#5B8AF5]/40' : 'bg-[#3A3A3E]'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2A2A2E]">
          <button
            onClick={handleSkip}
            className="text-sm text-[#6E6B68] hover:text-[#A8A4A0] transition-colors"
          >
            Skip
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-sm text-[#A8A4A0] hover:text-[#F0EDE8] bg-[#1A1A1E] hover:bg-[#222226] rounded-lg border border-[#2A2A2E] transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
            <button
              onClick={isLast ? handleComplete : () => setCurrentStep(currentStep + 1)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#5B8AF5] hover:bg-[#4A79E4] rounded-lg transition-colors flex items-center gap-1"
            >
              {isLast ? 'Get Started' : 'Next'} {!isLast && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
