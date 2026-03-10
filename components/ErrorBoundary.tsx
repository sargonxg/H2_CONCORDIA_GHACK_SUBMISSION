"use client";

import React from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Provide a fully custom fallback node to replace the default error UI. */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Forward to your error-reporting pipeline here (e.g. Sentry)
    console.error("[CONCORDIA ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[220px] w-full items-center justify-center p-6">
          <div
            className="flex max-w-md flex-col items-center gap-5 rounded-xl border border-[#262626] bg-[#141414] p-8 text-center shadow-xl"
            role="alert"
            aria-live="assertive"
          >
            {/* Icon */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-900/40 bg-red-950/30">
              <ShieldAlert
                className="h-7 w-7 text-red-400"
                aria-hidden="true"
              />
            </div>

            {/* Copy — never expose raw error internals to the user */}
            <div className="flex flex-col gap-1.5">
              <h2 className="text-base font-semibold text-[#f5f5f5]">
                Something went wrong
              </h2>
              <p className="text-sm leading-relaxed text-neutral-400">
                An unexpected error occurred in this section. Your session data
                is safe — you can try again or refresh the page.
              </p>
            </div>

            {/* Retry */}
            <button
              type="button"
              onClick={this.handleRetry}
              className="flex items-center gap-2 rounded-lg border border-[#262626] bg-[#1a1a1a] px-5 py-2 text-sm font-medium text-[#f5f5f5] transition-colors hover:border-[#3b82f6]/50 hover:bg-[#1e2a3a] hover:text-[#3b82f6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141414]"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC convenience wrapper — keeps usage ergonomic for functional component trees.
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
) {
  function WrappedWithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  }
  WrappedWithErrorBoundary.displayName = `withErrorBoundary(${
    Component.displayName ?? Component.name ?? "Component"
  })`;
  return WrappedWithErrorBoundary;
}

export default ErrorBoundary;
