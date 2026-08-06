'use client';

import React from 'react';
import type { ActiveSchool } from '../../shared/sidebar';

// -------------------------------------------------------------
// 10. WEBSITE BUILDER
// -------------------------------------------------------------

export interface WebsiteBuilderViewProps {
  activeSchool: ActiveSchool;
}

export function WebsiteBuilderView({ activeSchool }: WebsiteBuilderViewProps) {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Public Website Designer</h3>
        <span className="text-xs font-mono font-bold text-brand-secondary">{activeSchool.domain}</span>
      </div>

      <div className="p-6 rounded-2xl bg-linear-to-br from-brand-primary to-slate-900 text-white space-y-3">
        <span className="text-[10px] font-mono tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded">HERO PREVIEW</span>
        <h2 className="text-xl font-bold font-display">Welcome to {activeSchool.name}</h2>
        <p className="text-xs text-slate-200 max-w-md">Empowering future leaders through world-class academics and holistic development.</p>
      </div>
    </div>
  );
}
