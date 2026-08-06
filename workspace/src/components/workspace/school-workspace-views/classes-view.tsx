'use client';

import React from 'react';

// -------------------------------------------------------------
// 6. CLASSES
// -------------------------------------------------------------

export function ClassesView() {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Academic Timetable & Class Allocations</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { name: 'Grade X-B', room: 'Room 304', teacher: 'Dr. Sarah Jenkins', students: '32 pupils' },
          { name: 'Grade XII-A', room: 'Lab Delta', teacher: 'Prof. Marcus Vance', students: '28 pupils' },
          { name: 'Grade IX-C', room: 'Room 102', teacher: 'Elena Rostova', students: '35 pupils' },
        ].map((cls, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-slate-200/30 dark:border-slate-800/30 bg-white/30 dark:bg-black/20 space-y-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">{cls.name}</h4>
            <p className="text-xs text-brand-secondary font-mono">{cls.room}</p>
            <p className="text-[11px] text-slate-500">{cls.teacher} • {cls.students}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
