"use client";

import { useState, useRef } from "react";
import { motion } from "motion/react";
import { Mic, Square, FileAudio, Loader2 } from "lucide-react";
import { transcribeAudio } from "@/services/gemini-client";

export default function Transcribe() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await handleTranscription(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Audio = base64data.split(",")[1] ?? "";

        const result = await transcribeAudio(base64Audio, blob.type);
        setTranscript(result);
      };
    } catch (error) {
      console.error("Transcription error:", error);
      setTranscript("Error transcribing audio.");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileAudio className="w-6 h-6 text-[var(--color-accent)]" />
          Audio Transcription
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Record a conflict scenario and let the Listener Agent transcribe it
          accurately.
        </p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full space-y-8">
        <motion.div
          className={`w-32 h-32 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
            isRecording
              ? "bg-red-500/20 border-4 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]"
              : "bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]"
          }`}
          onClick={isRecording ? stopRecording : startRecording}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isRecording ? (
            <Square className="w-12 h-12 text-red-500" />
          ) : (
            <Mic className="w-12 h-12 text-[var(--color-accent)]" />
          )}
        </motion.div>

        <div className="text-center">
          <p className="text-lg font-medium text-white">
            {isRecording ? "Listening..." : "Tap to record"}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-2 font-mono">
            {isRecording ? "Recording in progress" : "Ready"}
          </p>
        </div>

        <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 min-h-[200px] flex flex-col">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
            Transcript
          </h3>

          <div className="flex-1 text-sm text-white leading-relaxed">
            {isTranscribing ? (
              <div className="flex items-center justify-center h-full gap-2 text-[var(--color-accent)]">
                <Loader2 className="w-5 h-5 animate-spin" />
                Transcribing...
              </div>
            ) : transcript ? (
              <p>{transcript}</p>
            ) : (
              <p className="text-[var(--color-text-muted)] italic text-center mt-12">
                Your transcription will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
