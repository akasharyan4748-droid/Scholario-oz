'use client';

import React from 'react';
import type { ActiveSchool } from '../../shared/sidebar';

// -------------------------------------------------------------
// 9. REPORTS
// -------------------------------------------------------------

export interface ReportsViewProps {
  activeSchool: ActiveSchool;
}

export function ReportsView({ activeSchool }: ReportsViewProps) {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Student Transcripts & Academic Cards</h3>
      <p className="text-xs text-slate-500">Official semester report cards signed and locked for {activeSchool.name}.</p>
      <div className="p-4 rounded-xl border border-slate-200/30 dark:border-slate-800/30 bg-white/30 dark:bg-black/20 font-mono text-xs space-y-2">
        <div className="flex justify-between"><span>Grade X-B Average:</span><span className="font-bold text-brand-secondary">88.4%</span></div>
        <div className="flex justify-between"><span>Highest GPA Scored:</span><span className="font-bold text-emerald-500">3.98</span></div>
      </div>
    </div>
  );
}
