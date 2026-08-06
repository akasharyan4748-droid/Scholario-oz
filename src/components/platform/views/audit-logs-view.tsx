'use client'

import React from 'react'
import { FileText } from 'lucide-react'

export function AuditLogsView() {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-secondary" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Immutable Platform Audit Trail</h3>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-500">ENCRYPTED LOGS</span>
      </div>

      <div className="space-y-3">
        {[
          { id: 'LOG-9021', action: 'TENANT_ONBOARD_SUCCESS', actor: 'Super Admin', target: 'Emerald Heights Academy', time: '12m ago' },
          { id: 'LOG-9022', action: 'SECURITY_RULE_VALIDATE', actor: 'System Auto-Auditor', target: 'Multi-Tenant Isolation', time: '45m ago' },
          { id: 'LOG-9023', action: 'STRIPE_PAYOUT_INITIATE', actor: 'Billing Service', target: 'Payout Account #0812', time: '2h ago' },
          { id: 'LOG-9024', action: 'ENCRYPTION_KEY_ROTATE', actor: 'KMS Key Manager', target: 'Master Database Vault', time: '5h ago' },
        ].map((log) => (
          <div key={log.id} className="p-3.5 rounded-xl bg-white/30 dark:bg-black/20 border border-slate-200/30 dark:border-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-brand-secondary">{log.id}</span>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">Target: {log.target}</span>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 text-[10px] font-mono text-slate-400">
              <span>Actor: {log.actor}</span>
              <span>{log.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
