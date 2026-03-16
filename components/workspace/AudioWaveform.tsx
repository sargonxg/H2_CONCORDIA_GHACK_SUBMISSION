"use client";

import { useRef, useEffect, useCallback } from "react";
import { CONCORDIA_DESIGN } from "@/lib/design-system";

interface AudioWaveformProps {
  analyserNode?: AnalyserNode | null;
  isActive: boolean;
  speakerColor?: string;
  height?: number;
}

export default function AudioWaveform({
  analyserNode,
  isActive,
  speakerColor = CONCORDIA_DESIGN.colors.accent.primary,
  height = 40,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, width, h);

    if (analyserNode && isActive) {
      // Real waveform from analyser
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteTimeDomainData(dataArray);

      ctx.lineWidth = 2;
      ctx.strokeStyle = speakerColor;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = (dataArray[i] ?? 128) / 128.0;
        const y = (v * h) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(width, h / 2);
      ctx.stroke();
    } else if (isActive) {
      // Sine wave animation fallback
      phaseRef.current += 0.05;
      ctx.lineWidth = 2;
      ctx.strokeStyle = speakerColor;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();

      for (let x = 0; x < width; x++) {
        const normalizedX = x / width;
        const amplitude = (h / 4) * Math.sin(normalizedX * Math.PI); // Envelope
        const y = h / 2 + amplitude * Math.sin(normalizedX * 8 * Math.PI + phaseRef.current);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      // Flat line when idle
      ctx.strokeStyle = CONCORDIA_DESIGN.colors.border.subtle;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(width, h / 2);
      ctx.stroke();
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [analyserNode, isActive, speakerColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Match canvas resolution to display size
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener("resize", resize);
    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg"
      style={{ height: `${height}px` }}
    />
  );
}
