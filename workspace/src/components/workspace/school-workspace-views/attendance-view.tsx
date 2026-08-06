'use client';

import React from 'react';
import type { WorkspacePupil } from './shared';

// -------------------------------------------------------------
// 5. ATTENDANCE
// -------------------------------------------------------------

export interface AttendanceViewProps {
  pupilsAttendance: WorkspacePupil[];
  toggleAttendance: (id: number) => void;
}

export function AttendanceView({ pupilsAttendance, toggleAttendance }: AttendanceViewProps) {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Daily Roll Call (Grade X-B)</h3>
        <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-100/30 px-2 py-0.5 rounded">
          {pupilsAttendance.filter((p) => p.present).length} / {pupilsAttendance.length} PRESENT
        </span>
      </div>

      <div className="space-y-2">
        {pupilsAttendance.map((p) => (
          <div
            key={p.id}
            onClick={() => toggleAttendance(p.id)}
            className="p-3 rounded-xl border border-slate-200/30 dark:border-slate-800/30 bg-white/30 dark:bg-black/20 flex items-center justify-between cursor-pointer hover:bg-slate-200/20 transition"
          >
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${p.present ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
              {p.present ? 'Present' : 'Absent'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
