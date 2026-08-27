'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LoadingStateProps {
  columns?: number;
  rows?: number;
}

export function LoadingState({ columns = 3, rows = 2 }: LoadingStateProps) {
  // Creating arrays for mapping skeleton cards
  const gridCards = Array.from({ length: columns * rows });

  return (
    <div id="loading-state-container" className="space-y-8 w-full max-w-7xl mx-auto p-1">
      {/* Page Header Skeleton */}
      <div id="loading-header" className="space-y-3">
        <div 
          id="loading-breadcrumb-skeleton" 
          className="h-4 w-40 bg-slate-200/60 dark:bg-slate-800/60 rounded-md animate-pulse" 
        />
        <div 
          id="loading-title-skeleton" 
          className="h-8 w-64 bg-slate-300/60 dark:bg-slate-700/60 rounded-lg animate-pulse" 
        />
        <div 
          id="loading-subtitle-skeleton" 
          className="h-4 w-96 max-w-full bg-slate-200/40 dark:bg-slate-800/40 rounded-md animate-pulse" 
        />
      </div>

      {/* Grid of Skeleton Cards */}
      <div 
        id="loading-grid" 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, 320px), 1fr))`
        }}
      >
        {gridCards.map((_, idx) => (
          <motion.div
            key={idx}
            id={`loading-card-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 space-y-4"
          >
            {/* Header row in card */}
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 bg-slate-300/60 dark:bg-slate-700/60 rounded-md animate-pulse" />
              <div className="h-6 w-12 bg-slate-200/50 dark:bg-slate-800/50 rounded-full animate-pulse" />
            </div>

            {/* Content lines */}
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full bg-slate-200/45 dark:bg-slate-800/45 rounded-md animate-pulse" />
              <div className="h-4 w-5/6 bg-slate-200/45 dark:bg-slate-800/45 rounded-md animate-pulse" />
              <div className="h-4 w-2/3 bg-slate-200/45 dark:bg-slate-800/45 rounded-md animate-pulse" />
            </div>

            {/* Footer metric/badge in card */}
            <div className="pt-4 border-t border-slate-200/30 dark:border-slate-700/30 flex items-center justify-between">
              <div className="h-3 w-16 bg-slate-200/40 dark:bg-slate-800/40 rounded-md animate-pulse" />
              <div className="h-3 w-20 bg-slate-200/40 dark:bg-slate-800/40 rounded-md animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
