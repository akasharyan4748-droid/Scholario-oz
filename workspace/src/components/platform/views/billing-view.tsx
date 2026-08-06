'use client'

import React from 'react'

export function BillingView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-2">
          <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Monthly Recurring Revenue</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">$84,500.00</div>
          <span className="text-xs text-emerald-500 font-bold">+12.4% vs last billing cycle</span>
        </div>
        <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-2">
          <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Active Stripe Accounts</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">12 / 12</div>
          <span className="text-xs text-brand-secondary font-bold">100% connected & synchronized</span>
        </div>
        <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-2">
          <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Pending Payouts</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">$18,200.00</div>
          <span className="text-xs text-slate-500">Scheduled for July 25th</span>
        </div>
      </div>

      <div className="backdrop-blur-md bg-white/45 dark:bg-slate-900/40 border border-white/25 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">SaaS Subscription Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200/30 dark:border-slate-800/30 text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                <th className="pb-3">Invoice ID</th>
                <th className="pb-3">Tenant School</th>
                <th className="pb-3">Plan Tier</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3 pr-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {[
                { id: 'INV-8921', school: 'Emerald Heights Academy', tier: 'Enterprise Tier', amount: '$24,000.00', status: 'Paid' },
                { id: 'INV-8922', school: 'Royal Oak Lyceum', tier: 'Professional Tier', amount: '$12,500.00', status: 'Paid' },
                { id: 'INV-8923', school: 'St. Xavier International', tier: 'Enterprise Tier', amount: '$18,900.00', status: 'Pending' },
              ].map((inv, idx) => (
                <tr key={idx}>
                  <td className="py-3 font-mono text-xs font-bold text-brand-secondary">{inv.id}</td>
                  <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{inv.school}</td>
                  <td className="py-3 text-xs text-slate-500">{inv.tier}</td>
                  <td className="py-3 font-mono text-xs font-bold">{inv.amount}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800'}`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
