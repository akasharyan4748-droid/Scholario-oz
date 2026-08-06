'use client';

import React from 'react';

// -------------------------------------------------------------
// 4. PARENTS
// -------------------------------------------------------------

export function ParentsView() {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Parent & Guardian Contacts</h3>
      <div className="space-y-3">
        {[
          { guardian: 'Dr. S. Roy', ward: 'Ananya Roy (Grade X-B)', phone: '+1 (555) 019-2831', status: 'Verified' },
          { guardian: 'Rakesh Sharma', ward: 'Arjun Sharma (Grade X-B)', phone: '+1 (555) 019-8822', status: 'Verified' },
        ].map((p, idx) => (
          <div key={idx} className="p-3.5 rounded-xl border border-slate-200/30 dark:border-slate-800/30 bg-white/30 dark:bg-black/20 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-display">{p.guardian}</h4>
              <p className="text-[11px] text-slate-500">Linked Ward: {p.ward}</p>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-brand-secondary font-bold block">{p.phone}</span>
              <span className="text-[10px] text-emerald-500 font-bold">{p.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
