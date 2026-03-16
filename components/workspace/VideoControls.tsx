'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Monitor, Camera, CameraOff, Image } from 'lucide-react';
import { VideoCapture } from '../../lib/video-capture';

interface VideoControlsProps {
  onVideoFrame: (base64: string) => void;
  onSnapshot: (dataUrl: string) => void;
  disabled?: boolean;
}

export default function VideoControls({ onVideoFrame, onSnapshot, disabled }: VideoControlsProps) {
  const [mode, setMode] = useState<'off' | 'screen' | 'camera'>('off');
  const [fps, setFps] = useState(1);
  const captureRef = useRef<VideoCapture | null>(null);

  const startScreenShare = useCallback(async () => {
    try {
      const capture = new VideoCapture();
      captureRef.current = capture;
      await capture.startScreenShare();
      capture.startFrameCapture(onVideoFrame, fps);
      setMode('screen');
    } catch (err) {
      console.error('[VideoControls] Screen share failed:', err);
      captureRef.current = null;
    }
  }, [onVideoFrame, fps]);

  const startCamera = useCallback(async () => {
    try {
      const capture = new VideoCapture();
      captureRef.current = capture;
      await capture.startCamera();
      capture.startFrameCapture(onVideoFrame, fps);
      setMode('camera');
    } catch (err) {
      console.error('[VideoControls] Camera start failed:', err);
      captureRef.current = null;
    }
  }, [onVideoFrame, fps]);

  const stopVideo = useCallback(() => {
    captureRef.current?.stop();
    captureRef.current = null;
    setMode('off');
  }, []);

  const takeSnapshot = useCallback(() => {
    const snapshot = captureRef.current?.captureSnapshot();
    if (snapshot) onSnapshot(snapshot);
  }, [onSnapshot]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={mode === 'screen' ? stopVideo : startScreenShare}
        disabled={disabled || mode === 'camera'}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
          mode === 'screen'
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            : 'bg-[#1A1A1E] text-[#A8A4A0] border border-[#2A2A2E] hover:border-[#3A3A3E]'
        }`}
        title="Share Screen"
      >
        <Monitor size={14} />
        {mode === 'screen' ? 'Stop Share' : 'Screen'}
      </button>

      <button
        onClick={mode === 'camera' ? stopVideo : startCamera}
        disabled={disabled || mode === 'screen'}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
          mode === 'camera'
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            : 'bg-[#1A1A1E] text-[#A8A4A0] border border-[#2A2A2E] hover:border-[#3A3A3E]'
        }`}
        title="Camera"
      >
        {mode === 'camera' ? <CameraOff size={14} /> : <Camera size={14} />}
        {mode === 'camera' ? 'Stop' : 'Camera'}
      </button>

      {mode !== 'off' && (
        <>
          <select
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            className="bg-[#1A1A1E] text-[#A8A4A0] border border-[#2A2A2E] rounded px-2 py-1 text-xs"
          >
            <option value={0.5}>0.5 fps</option>
            <option value={1}>1 fps</option>
            <option value={2}>2 fps</option>
          </select>

          <button
            onClick={takeSnapshot}
            className="px-2 py-1.5 rounded-lg text-xs bg-[#1A1A1E] text-[#A8A4A0] border border-[#2A2A2E] hover:border-[#3A3A3E]"
            title="Take Snapshot"
          >
            <Image size={14} />
          </button>
        </>
      )}
    </div>
  );
}
