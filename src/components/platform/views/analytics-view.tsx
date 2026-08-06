'use client'

import React from 'react'
import { BarChart3 } from 'lucide-react'

export function AnalyticsView() {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-secondary" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Platform Growth Analytics</h3>
        </div>
        <span className="text-xs font-mono font-bold text-slate-400">Q3 REAL-TIME AGGREGATION</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl border border-slate-200/30 dark:border-slate-800/30 bg-white/30 dark:bg-black/20 space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-display">Student Enrollment Trajectory</span>
          <div className="h-32 flex items-end justify-between gap-2 pt-4 px-2">
            {[45, 52, 60, 75, 88, 94, 100].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-brand-primary rounded-t-sm transition-all" style={{ height: `${val}%` }} />
                <span className="text-[9px] font-mono text-slate-400">M{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/30 dark:border-slate-800/30 bg-white/30 dark:bg-black/20 space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-display">API Gateway Calls Volume</span>
          <div className="h-32 flex items-end justify-between gap-2 pt-4 px-2">
            {[60, 40, 80, 90, 70, 85, 95].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-brand-secondary rounded-t-sm transition-all" style={{ height: `${val}%` }} />
                <span className="text-[9px] font-mono text-slate-400">Day {i+1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
