'use client'

import React from 'react'
import { Users } from 'lucide-react'

export function UsersView() {
  return (
    <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-secondary" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">System Administrators & Operators</h3>
        </div>
        <span className="px-2.5 py-1 text-xs font-mono font-bold bg-brand-primary/10 text-brand-primary rounded-md">
          4 OPERATORS
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200/30 dark:border-slate-800/30 text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              <th className="pb-3 pl-2">Operator Name</th>
              <th className="pb-3">Email Address</th>
              <th className="pb-3">Role Designation</th>
              <th className="pb-3">MFA Status</th>
              <th className="pb-3 pr-2 text-right">Access State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {[
              { name: 'Akash Aryan', email: 'akasharyan4748@gmail.com', role: 'Super Admin', mfa: 'Enabled', status: 'Active' },
              { name: 'Sarah Jenkins', email: 'sarah.j@scholario.com', role: 'Platform Architect', mfa: 'Enabled', status: 'Active' },
              { name: 'Robert Vance', email: 'robert.v@scholario.com', role: 'Support Specialist', mfa: 'Enabled', status: 'Active' },
              { name: 'David Miller', email: 'david.m@scholario.com', role: 'Billing Manager', mfa: 'Disabled', status: 'Active' },
            ].map((user, idx) => (
              <tr key={idx} className="hover:bg-slate-200/20 dark:hover:bg-slate-800/20 transition-colors">
                <td className="py-3 pl-2 font-bold text-slate-900 dark:text-white font-display">{user.name}</td>
                <td className="py-3 font-mono text-xs text-brand-secondary">{user.email}</td>
                <td className="py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">{user.role}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${user.mfa === 'Enabled' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800'}`}>
                    {user.mfa}
                  </span>
                </td>
                <td className="py-3 pr-2 text-right text-xs font-bold text-emerald-500">
                  ● {user.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
