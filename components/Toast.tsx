"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

// ---------------------------------------------------------------------------
// Per-type styling
// ---------------------------------------------------------------------------

const ICON_MAP: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />,
  error:   <AlertCircle  className="h-4 w-4 shrink-0 text-red-400"     />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400"  />,
  info:    <Info          className="h-4 w-4 shrink-0 text-blue-400"   />,
};

const COLOR_MAP: Record<ToastType, string> = {
  success: "border-emerald-900/60 bg-emerald-950/90 text-emerald-100",
  error:   "border-red-900/60     bg-red-950/90     text-red-100",
  warning: "border-amber-900/60   bg-amber-950/90   text-amber-100",
  info:    "border-blue-900/60    bg-blue-950/90    text-blue-100",
};

const DISMISS_LABEL_MAP: Record<ToastType, string> = {
  success: "Dismiss success notification",
  error:   "Dismiss error notification",
  warning: "Dismiss warning notification",
  info:    "Dismiss info notification",
};

// ---------------------------------------------------------------------------
// Single toast card
// ---------------------------------------------------------------------------

interface ToastCardProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

function ToastCard({ item, onDismiss }: ToastCardProps) {
  // Auto-dismiss after 4 s
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), 4000);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 64, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 64, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={`flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md ${COLOR_MAP[item.type]}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {/* Icon */}
      <span className="mt-0.5">{ICON_MAP[item.type]}</span>

      {/* Message */}
      <p className="flex-1 text-sm leading-snug">{item.message}</p>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label={DISMISS_LABEL_MAP[item.type]}
        className="mt-0.5 shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = `toast-${(counter.current += 1)}`;
    // Keep at most 5 toasts stacked at once
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast stack — top-right, above everything */}
      <div
        aria-label="Notifications"
        className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col items-end gap-2 sm:right-6 sm:top-6"
      >
        <AnimatePresence initial={false} mode="sync">
          {toasts.map((item) => (
            <div key={item.id} className="pointer-events-auto">
              <ToastCard item={item} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
