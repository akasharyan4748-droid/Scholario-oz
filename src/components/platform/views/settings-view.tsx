'use client'

import React from 'react'
import { Settings } from 'lucide-react'

export function SettingsView() {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
        <Settings className="w-5 h-5 text-brand-secondary" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Global Platform Configuration</h3>
      </div>

      <div className="space-y-4 max-w-2xl">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Master Platform Title</label>
          <input
            type="text"
            defaultValue="Scholario OS"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Root Subdomain Wildcard Pattern</label>
          <input
            type="text"
            defaultValue="*.scholario.com"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono"
          />
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/40 space-y-1">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-display">Multi-Tenant Isolation Lock</span>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            All tenant databases enforce strict UUID claim verification. Direct cross-tenant querying is strictly prevented by security rules.
          </p>
        </div>

        <button className="px-4 py-2 text-xs font-bold text-white bg-brand-primary rounded-xl hover:bg-brand-primary/90 transition cursor-pointer">
          Save Platform Configuration
        </button>
      </div>
    </div>
  )
}
