"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const MESSAGES = [
  "Listening to what matters...",
  "Connecting the threads...",
  "Finding common ground...",
  "Considering both perspectives...",
  "Identifying shared interests...",
];

const DOT_COLOR = "#5B8AF5";

function PulsingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: DOT_COLOR }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.35, 1, 0.35] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

function RotatingText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-5 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-sm text-[var(--color-text-muted)] whitespace-nowrap"
        >
          {MESSAGES[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

interface ConcordiaThinkingProps {
  size: "compact" | "full" | "overlay";
}

function ConcordiaThinking({ size }: ConcordiaThinkingProps) {
  if (size === "compact") {
    return <PulsingDots />;
  }

  if (size === "full") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <PulsingDots />
        <RotatingText />
      </div>
    );
  }

  // overlay
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-col items-center gap-4 rounded-2xl bg-[var(--color-surface)] p-8 shadow-xl border border-[var(--color-border)]"
      >
        <PulsingDots />
        <RotatingText />
      </motion.div>
    </motion.div>
  );
}

export default React.memo(ConcordiaThinking);
