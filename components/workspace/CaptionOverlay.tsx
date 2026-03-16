'use client';

import React, { useState, useEffect, useRef } from 'react';

interface CaptionOverlayProps {
  enabled: boolean;
  text: string;
  speaker?: string;
}

export default function CaptionOverlay({ enabled, text, speaker }: CaptionOverlayProps) {
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !text) {
      setVisible(false);
      return;
    }

    setVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setVisible(false), 5000);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [enabled, text]);

  if (!enabled || !visible || !text) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 max-w-[80vw] px-6 py-3 bg-black/85 text-white text-xl leading-relaxed rounded-lg text-center z-[1000] pointer-events-none"
    >
      {speaker && <span className="text-[#A8A4A0] text-sm mr-2">{speaker}:</span>}
      {text}
    </div>
  );
}
