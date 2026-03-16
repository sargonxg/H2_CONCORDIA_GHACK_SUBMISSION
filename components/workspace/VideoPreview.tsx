'use client';

import React, { useRef, useEffect, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface VideoPreviewProps {
  stream: MediaStream | null;
  snapshots: { id: string; dataUrl: string; timestamp: string }[];
  onClose: () => void;
}

export default function VideoPreview({ stream, snapshots, onClose }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`bg-[#141416] border border-[#2A2A2E] rounded-lg overflow-hidden ${
      isExpanded ? 'fixed inset-4 z-50' : 'w-64'
    }`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2A2A2E]">
        <span className="text-xs font-medium text-[#A8A4A0]">
          {stream ? 'Live Preview' : 'Snapshots'}
        </span>
        <div className="flex gap-1">
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-[#6E6B68] hover:text-[#F0EDE8]">
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <button onClick={onClose} className="text-[#6E6B68] hover:text-[#F87171]">
            <X size={12} />
          </button>
        </div>
      </div>

      {stream && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full aspect-video bg-black"
        />
      )}

      {snapshots.length > 0 && (
        <div className="p-2 grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
          {snapshots.map((snap) => (
            <img
              key={snap.id}
              src={snap.dataUrl}
              alt={`Snapshot ${snap.timestamp}`}
              className="w-full aspect-video object-cover rounded border border-[#2A2A2E]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
