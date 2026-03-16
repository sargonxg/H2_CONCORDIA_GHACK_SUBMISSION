'use client';

import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface FloatingWidgetProps {
  isActive: boolean;
  children: React.ReactNode;
}

export default function FloatingWidget({ isActive, children }: FloatingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <div
          className="fixed z-[9999] w-[400px] h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-[#2A2A2E] bg-[#0C0C0E]"
          style={{ bottom: '80px', right: '20px' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2E] bg-[#141416]">
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm text-[#F0EDE8]">CONCORDIA</span>
              {isActive && <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />}
            </div>
            <button onClick={() => setIsOpen(false)} className="text-[#6E6B68] hover:text-[#F0EDE8]">
              <X size={16} />
            </button>
          </div>
          <div className="h-[calc(100%-48px)] overflow-hidden">
            {children}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed z-[9999] bottom-5 right-5 w-14 h-14 rounded-full bg-[#5B8AF5] hover:bg-[#4A79E4] text-white shadow-lg shadow-[#5B8AF5]/30 flex items-center justify-center transition-all"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {isActive && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#34D399] border-2 border-[#0C0C0E] animate-pulse" />
        )}
      </button>
    </>
  );
}
