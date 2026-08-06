'use client';

import React from 'react';
import type { ActiveSchool } from '../../shared/sidebar';

// -------------------------------------------------------------
// 13. DOMAINS
// -------------------------------------------------------------

export interface DomainsViewProps {
  activeSchool: ActiveSchool;
}

export function DomainsView({ activeSchool }: DomainsViewProps) {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Custom Subdomains & SSL</h3>
      <div className="p-4 rounded-xl border border-slate-200/30 dark:border-slate-800/30 bg-white/30 dark:bg-black/20 font-mono text-xs space-y-2">
        <div className="flex justify-between"><span>Active Gateway:</span><span className="text-brand-secondary font-bold">{activeSchool.domain}</span></div>
        <div className="flex justify-between"><span>SSL Certificate:</span><span className="text-emerald-500 font-bold">Valid (Let&apos;s Encrypt Wildcard)</span></div>
      </div>
    </div>
  );
}
