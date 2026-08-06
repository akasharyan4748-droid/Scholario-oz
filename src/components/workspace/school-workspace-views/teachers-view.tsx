'use client';

import React from 'react';

// -------------------------------------------------------------
// 3. TEACHERS
// -------------------------------------------------------------

export function TeachersView() {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Faculty Roster</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { name: 'Dr. Sarah Jenkins', dept: 'Mathematics Dept Head', classes: 'Grade X-B, Grade XII-A' },
          { name: 'Prof. Marcus Vance', dept: 'Physics & Lab Director', classes: 'Grade IX-C, Lab Delta' },
          { name: 'Elena Rostova', dept: 'English Literature', classes: 'Grade X-A, Grade XI-B' },
          { name: 'Rajesh Kumar', dept: 'Computer Science', classes: 'Lab Alpha, Grade XII-B' },
        ].map((fac, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-slate-200/30 dark:border-slate-800/30 bg-white/30 dark:bg-black/20 space-y-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">{fac.name}</h4>
            <p className="text-xs font-semibold text-brand-secondary">{fac.dept}</p>
            <p className="text-[11px] text-slate-400 font-mono">Assigned: {fac.classes}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
