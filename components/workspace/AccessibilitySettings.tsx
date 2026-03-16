'use client';

import React, { useState } from 'react';
import { Accessibility, Type, Eye, Volume2 } from 'lucide-react';

interface AccessibilitySettingsProps {
  onHighContrastChange: (enabled: boolean) => void;
  onTextSizeChange: (size: 'small' | 'medium' | 'large') => void;
  onCaptionsChange: (enabled: boolean) => void;
  onReducedMotionChange: (enabled: boolean) => void;
}

export default function AccessibilitySettings({
  onHighContrastChange,
  onTextSizeChange,
  onCaptionsChange,
  onReducedMotionChange,
}: AccessibilitySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [captions, setCaptions] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <button
      onClick={onChange}
      className={`w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-[#5B8AF5]' : 'bg-[#3A3A3E]'}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${checked ? 'left-4' : 'left-0.5'}`} />
    </button>
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-[#A8A4A0] hover:text-[#F0EDE8] hover:bg-[#1A1A1E] transition-colors"
        aria-label="Accessibility settings"
      >
        <Accessibility size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#141416] border border-[#2A2A2E] rounded-xl shadow-lg p-4 z-50">
          <h3 className="text-sm font-semibold text-[#F0EDE8] mb-3">Accessibility</h3>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-[#A8A4A0]" />
              <span className="text-sm text-[#A8A4A0]">High Contrast</span>
            </div>
            <Toggle
              checked={highContrast}
              label="High Contrast"
              onChange={() => { const v = !highContrast; setHighContrast(v); onHighContrastChange(v); }}
            />
          </div>

          <div className="py-2">
            <div className="flex items-center gap-2 mb-2">
              <Type size={14} className="text-[#A8A4A0]" />
              <span className="text-sm text-[#A8A4A0]">Text Size</span>
            </div>
            <div className="flex gap-1">
              {(['small', 'medium', 'large'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => { setTextSize(size); onTextSizeChange(size); }}
                  className={`flex-1 py-1 text-xs rounded transition-colors ${
                    textSize === size ? 'bg-[#5B8AF5] text-white' : 'bg-[#1A1A1E] text-[#A8A4A0] hover:bg-[#222226]'
                  }`}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Volume2 size={14} className="text-[#A8A4A0]" />
              <span className="text-sm text-[#A8A4A0]">Live Captions</span>
            </div>
            <Toggle
              checked={captions}
              label="Live Captions"
              onChange={() => { const v = !captions; setCaptions(v); onCaptionsChange(v); }}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[#A8A4A0]">Reduced Motion</span>
            <Toggle
              checked={reducedMotion}
              label="Reduced Motion"
              onChange={() => { const v = !reducedMotion; setReducedMotion(v); onReducedMotionChange(v); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
