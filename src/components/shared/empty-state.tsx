'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = <Inbox className="h-8 w-8 text-brand-secondary" />,
  title = "No data available",
  description = "No items or records were found in this tenant sector. Click below to register your first record.",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div id="empty-state-container" className="flex items-center justify-center min-h-[40vh] w-full max-w-xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/50 text-center space-y-6 w-full"
      >
        {/* Dynamic Graphic Backdrop Glow */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/30 dark:border-slate-700/30 overflow-hidden">
          {/* Subtle Accent Glow Ring */}
          <div className="absolute inset-0 bg-radial from-brand-secondary/15 to-transparent blur-md" />
          <div className="relative z-10">
            {icon}
          </div>
        </div>

        {/* Typographic Layout */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-sans leading-relaxed max-w-sm mx-auto">
            {description}
          </p>
        </div>

        {/* Action Trigger */}
        {actionLabel && onAction && (
          <div className="pt-2">
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-secondary hover:brightness-110 transition cursor-pointer shadow-sm hover:shadow-md focus-ring"
            >
              <Plus className="w-4 h-4" />
              {actionLabel}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
