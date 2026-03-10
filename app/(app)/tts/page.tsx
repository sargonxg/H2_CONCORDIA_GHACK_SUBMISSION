"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Volume2, Play, Loader2 } from "lucide-react";
import { generateSpeech } from "@/services/gemini-client";

export default function TTS() {
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    try {
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioContext = new AudioContext({ sampleRate: 24000 });
        const pcm16 = new Int16Array(bytes.buffer);
        const audioBuffer = audioContext.createBuffer(1, pcm16.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < pcm16.length; i++) {
          channelData[i] = pcm16[i] / 0x7fff;
        }

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();

        setAudioUrl("played");
      }
    } catch (error) {
      console.error("TTS error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Volume2 className="w-6 h-6 text-[var(--color-accent)]" />
          Speech Engine
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Generate natural-sounding speech for Advisor Agent responses.
        </p>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full space-y-8">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
            Text Input
          </h3>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to synthesize..."
            className="w-full h-48 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
          />

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={!text.trim() || isGenerating}
              className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Synthesizing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Generate Speech
                </>
              )}
            </button>
          </div>
        </div>

        {audioUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Audio Generated
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Played via Web Audio API
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              className="text-sm text-[var(--color-accent)] hover:underline"
            >
              Replay
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
