'use client'

import { Badge } from '@/components/ui/badge'
import type { TeacherRecord } from '@/lib/store/teachers-store'

interface RelievedViewsProps {
  active: string
  currentTeacher: TeacherRecord
  isRelieved: boolean
}

export function RelievedViews({ active, currentTeacher, isRelieved }: RelievedViewsProps) {
  if (active === 'profile') {
    return (
      <div className="space-y-4">
        {isRelieved && (
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200">
            <strong>Restricted Access Mode:</strong> Relieved staff access is strictly limited to Profile, Payroll, and processed Fee receipts.
          </div>
        )}
        <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-bold text-lg">{currentTeacher.name}</h3>
              <p className="text-xs text-muted-foreground">{currentTeacher.designation} · {currentTeacher.department}</p>
            </div>
            <Badge variant="outline" className="text-xs">{currentTeacher.status}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div><span className="text-muted-foreground">Employee ID:</span> <strong className="block font-mono">{currentTeacher.employeeId}</strong></div>
            <div><span className="text-muted-foreground">Date of Joining:</span> <strong className="block">{currentTeacher.joiningDate}</strong></div>
            <div><span className="text-muted-foreground">Phone:</span> <strong className="block">{currentTeacher.phone}</strong></div>
            <div><span className="text-muted-foreground">Email:</span> <strong className="block">{currentTeacher.email}</strong></div>
            <div><span className="text-muted-foreground">Current Address:</span> <strong className="block">{currentTeacher.currentAddress}</strong></div>
            <div><span className="text-muted-foreground">Aadhaar ID:</span> <strong className="block font-mono">{currentTeacher.aadhaarNo}</strong></div>
          </div>
        </div>
      </div>
    )
  }

  if (active === 'payroll') {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-4">
          <h3 className="font-bold text-base">Payroll & Salary Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl border bg-card"><span className="text-muted-foreground">Gross Monthly</span><p className="font-bold text-base mt-1">₹{currentTeacher.salary.toLocaleString('en-IN')}</p></div>
            <div className="p-3 rounded-xl border bg-card"><span className="text-muted-foreground">Basic Salary</span><p className="font-bold text-base mt-1">₹{currentTeacher.salaryBreakdown.basic.toLocaleString('en-IN')}</p></div>
            <div className="p-3 rounded-xl border bg-card"><span className="text-muted-foreground">HRA</span><p className="font-bold text-base mt-1">₹{currentTeacher.salaryBreakdown.hra.toLocaleString('en-IN')}</p></div>
            <div className="p-3 rounded-xl border bg-card"><span className="text-muted-foreground">Net Monthly Pay</span><p className="font-bold text-base text-emerald-600 mt-1">₹{currentTeacher.salaryBreakdown.netPay.toLocaleString('en-IN')}</p></div>
          </div>
        </div>
      </div>
    )
  }

  if (active === 'fee-management') {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-4">
          <h3 className="font-bold text-base">Fee Collections Processed Through ID</h3>
          <p className="text-xs text-muted-foreground">Historical fee collection receipts recorded under {currentTeacher.name} ({currentTeacher.employeeId}).</p>
          <div className="p-4 rounded-xl border border-border bg-muted/20 text-xs flex items-center justify-between">
            <span>Total Fees Collected & Submitted:</span>
            <strong className="text-sm font-bold text-emerald-600">₹42,500 (18 Transactions)</strong>
          </div>
        </div>
      </div>
    )
  }

  return null
}
