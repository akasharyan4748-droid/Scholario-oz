'use client';

import React from 'react';
import type { WorkspaceFee } from './shared';

// -------------------------------------------------------------
// 7. FEES
// -------------------------------------------------------------

export interface FeesViewProps {
  fees: WorkspaceFee[];
}

export function FeesView({ fees }: FeesViewProps) {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Tuition Invoices Ledger</h3>
      <div className="space-y-3">
        {fees.map((f) => (
          <div key={f.id} className="p-3.5 rounded-xl border border-slate-200/30 dark:border-slate-800/30 bg-white/30 dark:bg-black/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-brand-secondary font-bold block">{f.id}</span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-display">{f.student}</h4>
              <span className="text-[10px] text-slate-400">Due: {f.due}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-bold text-slate-900 dark:text-white block">{f.amount}</span>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${f.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800'}`}>
                {f.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
