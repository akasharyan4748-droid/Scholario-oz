'use client';

import React from 'react';
import type { ActiveSchool } from '../../shared/sidebar';

// -------------------------------------------------------------
// 11. APP BUILDER
// -------------------------------------------------------------

export interface AppBuilderViewProps {
  activeSchool: ActiveSchool;
}

export function AppBuilderView({ activeSchool }: AppBuilderViewProps) {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Mobile App Configuration</h3>
      <p className="text-xs text-slate-500">Android Capacitor & iOS native app wrapper settings for {activeSchool.name}.</p>
      <div className="p-4 rounded-xl border border-slate-200/30 dark:border-slate-800/30 bg-white/30 dark:bg-black/20 space-y-2">
        <span className="text-xs font-bold font-mono text-brand-secondary">App ID: com.scholario.{activeSchool.code.toLowerCase().replace('-', '')}</span>
        <p className="text-xs text-slate-400">Push notifications: Enabled • Biometric Auth: Enforced</p>
      </div>
    </div>
  );
}
