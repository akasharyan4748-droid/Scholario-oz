'use client'

import React from 'react'

export function MonitoringView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Edge Rewriter Latency', val: '0.08ms', desc: 'Next.js Edge Middleware', status: 'Optimal', color: 'text-emerald-500' },
          { label: 'Isolated DB Pools', val: '124 / 150', desc: 'PostgreSQL Connection Pooling', status: 'Optimal', color: 'text-brand-secondary' },
          { label: 'Android Capacitor CI/CD', val: 'Idle', desc: 'Codemagic Pipeline', status: 'Ready', color: 'text-amber-500' },
        ].map((node, i) => (
          <div key={i} className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-2">
            <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">{node.label}</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-display">{node.val}</div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">{node.desc}</span>
              <span className={`font-bold ${node.color}`}>{node.status}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Live Cluster Health Checks</h3>
        <div className="space-y-3">
          {[
            { service: 'Cloud Run Primary Cluster (us-central1)', ping: '12ms', health: 'Healthy' },
            { service: 'Firestore Multi-Tenant Security Engine', ping: '4ms', health: 'Healthy' },
            { service: 'CDN Edge Caching Layer', ping: '1ms', health: 'Healthy' },
          ].map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-white/30 dark:bg-black/20 border border-slate-200/30 dark:border-slate-800/30 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.service}</span>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-slate-400">{item.ping}</span>
                <span className="text-emerald-500 font-bold">● {item.health}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
