'use client';

import React from 'react';

// -------------------------------------------------------------
// 14. ADMISSIONS
// -------------------------------------------------------------

export function AdmissionsView() {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Inbound Admission Applications</h3>
      <div className="space-y-3">
        {[
          { id: 'ADM-201', applicant: 'Kabir Mehta', grade: 'Grade IX', status: 'Under Review' },
          { id: 'ADM-202', applicant: 'Zara Khan', grade: 'Grade XI', status: 'Entrance Test Passed' },
        ].map((app) => (
          <div key={app.id} className="p-3.5 rounded-xl border border-slate-200/30 dark:border-slate-800/30 bg-white/30 dark:bg-black/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-400 font-bold block">{app.id}</span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-display">{app.applicant}</h4>
              <span className="text-[10px] text-slate-500">{app.grade}</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
              {app.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
