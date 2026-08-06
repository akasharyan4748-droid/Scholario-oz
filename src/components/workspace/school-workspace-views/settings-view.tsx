'use client';

import React from 'react';
import type { ActiveSchool } from '../../shared/sidebar';

// -------------------------------------------------------------
// 15. SETTINGS
// -------------------------------------------------------------

export interface SettingsViewProps {
  activeSchool: ActiveSchool;
}

export function SettingsView({ activeSchool }: SettingsViewProps) {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">School Configuration</h3>
      <div className="space-y-3 max-w-lg">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Official School Name</label>
          <input
            type="text"
            defaultValue={activeSchool.name}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Current Academic Session</label>
          <input
            type="text"
            defaultValue="2026 - 2027"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
          />
        </div>
        <button className="px-4 py-2 text-xs font-bold text-white bg-brand-primary rounded-xl hover:bg-brand-primary/90 transition cursor-pointer">
          Save School Settings
        </button>
      </div>
    </div>
  );
}
