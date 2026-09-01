'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PendingPayrollUpdate {
  proposedSalary: number
  code: string
}

interface PayrollRevisionBannerProps {
  teacherId: string
  pendingPayrollUpdate: PendingPayrollUpdate | null | undefined
  confirmPayrollRevision: (teacherId: string, code: string) => boolean
}

export function PayrollRevisionBanner({
  teacherId,
  pendingPayrollUpdate,
  confirmPayrollRevision,
}: PayrollRevisionBannerProps) {
  const [payrollCodeInput, setPayrollCodeInput] = useState('')

  if (!pendingPayrollUpdate) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 p-4 sm:p-5 shadow-lg text-emerald-950"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold text-base text-emerald-900">
                Principal Proposed Payroll Revision
              </span>
              <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                Confirmation Code Issued
              </Badge>
            </div>
            <p className="text-xs text-emerald-800 mt-1">
              Proposed Monthly Gross Salary: <strong className="text-emerald-950 font-bold text-sm">₹{pendingPayrollUpdate.proposedSalary.toLocaleString('en-IN')}</strong>. Enter the 6-digit confirmation code sent by Principal (or <code className="bg-emerald-200/80 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900">{pendingPayrollUpdate.code}</code>) to accept:
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="6-Digit Code"
            value={payrollCodeInput}
            onChange={(e) => setPayrollCodeInput(e.target.value.toUpperCase())}
            className="px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border border-emerald-300 bg-white text-slate-900 w-32 shadow-inner focus:outline-emerald-600"
          />
          <Button
            size="sm"
            onClick={() => {
              const success = confirmPayrollRevision(teacherId, payrollCodeInput)
              if (success) {
                toast.success('Payroll Revision Confirmed & Active!', {
                  description: `Your monthly gross salary is now ₹${pendingPayrollUpdate.proposedSalary.toLocaleString('en-IN')}`,
                })
                setPayrollCodeInput('')
              } else {
                toast.error('Invalid Confirmation Code', {
                  description: 'Please check the code provided by the Principal.',
                })
              }
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
          >
            Approve & Activate
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
