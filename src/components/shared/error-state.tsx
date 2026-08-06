'use client';

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw, ArrowLeft, Terminal } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  errorDetails?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "Scholario OS experienced an unexpected system interruption. Data separation remains secure and unaffected.",
  errorDetails = "ERR_RENDER_BOUND_INTERRUPTED (0x44A1B)",
  onRetry,
  onGoBack,
}: ErrorStateProps) {
  const [showLog, setShowLog] = React.useState(false);

  return (
    <div id="error-state-container" className="flex items-center justify-center min-h-[50vh] w-full max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/50 text-center space-y-6 w-full"
      >
        {/* Warning Icon Emblem */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 animate-bounce">
          <AlertTriangle className="h-6 w-6" />
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
            {title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-sans leading-relaxed max-w-md mx-auto">
            {message}
          </p>
        </div>

        {/* Diagnostic Toggle */}
        {errorDetails && (
          <div className="pt-2">
            <button
              onClick={() => setShowLog(!showLog)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold font-mono text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-700/30 transition cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              {showLog ? "Hide" : "Show"} Diagnostic Details
            </button>

            {showLog && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 text-left p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto select-all"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                  <span>System Diagnostics Log</span>
                  <span>STATUS: 500</span>
                </div>
                <p className="whitespace-pre-wrap">{errorDetails}</p>
                <p className="text-slate-500 text-[10px] mt-2">
                  Time: {new Date().toISOString()} | Secure Tenant context: ACTIVE
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* Action Triggers */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition cursor-pointer shadow-sm hover:shadow-md focus-ring"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Transaction
            </button>
          )}
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-300/30 dark:border-slate-700/30 focus-ring"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Previous Page
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
