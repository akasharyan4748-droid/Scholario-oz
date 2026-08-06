'use client'

// Payroll tab — read-only display of pay grades & salary structures
// (base pay, HRA, DA, PF deduction). Backed by store.payroll.payGrades.

import { Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { SettingsTab } from './shared'

export function PayrollTab() {
  const store = useSchoolSettingsStore()

  return (
    <SettingsTab
      icon={Wallet}
      title="Pay Grades & Salary Structures"
      description="Define base pay, HRA, DA allowances, and PF statutory deductions."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {store.payroll.payGrades.map((pg) => (
          <div key={pg.id} className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-2xs">
            <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30">
              {pg.grade}
            </Badge>
            <p className="font-bold text-xs text-foreground">{pg.title}</p>
            <div className="text-[11px] space-y-0.5 text-muted-foreground border-t border-border/50 pt-2">
              <div className="flex justify-between"><span>Base Pay:</span><strong className="text-foreground">₹{pg.basePay}</strong></div>
              <div className="flex justify-between"><span>HRA:</span><span>₹{pg.hra}</span></div>
              <div className="flex justify-between"><span>DA:</span><span>₹{pg.da}</span></div>
              <div className="flex justify-between"><span>PF Deduction:</span><span className="text-rose-600">₹{pg.pfDeduction}</span></div>
            </div>
          </div>
        ))}
      </div>
    </SettingsTab>
  )
}
