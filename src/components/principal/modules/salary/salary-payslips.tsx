'use client'

/**
 * SalaryPayslipsSection — search, filter, preview, print, download payslips.
 *
 * - Search by employee / payslip ID
 * - Filter by period
 * - Printable payslip (official school format)
 * - Print / Download actions
 */

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, FileText, Printer, Download, X, Eye, Receipt as ReceiptIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSalaryData, type Payslip } from '@/lib/store/salary-store'
import { school } from '@/lib/mock/school'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SalaryPanel, SalaryEmptyState } from './salary-shared'
import { toast } from 'sonner'

export function SalaryPayslipsSection({ data }: { data: ReturnType<typeof useSalaryData> }) {
  const [search, setSearch] = useState('')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [selected, setSelected] = useState<Payslip | null>(null)

  const periods = useMemo(() => {
    const set = new Set(data.payslips.map((p) => p.period))
    return Array.from(set).sort().reverse()
  }, [data.payslips])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return data.payslips.filter((p) => {
      if (q && !p.employeeName.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) return false
      if (periodFilter !== 'all' && p.period !== periodFilter) return false
      return true
    })
  }, [data.payslips, search, periodFilter])

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Search + filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee or payslip ID…" className="pl-8 h-8 text-xs" />
        </div>
        <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className="h-8 text-xs rounded-md border border-border bg-background px-2">
          <option value="all">All Periods</option>
          {periods.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Payslips list */}
      {data.payslips.length === 0 ? (
        <SalaryPanel title="Payslips">
          <SalaryEmptyState
            icon={<ReceiptIcon className="h-6 w-6" />}
            title="No payslips yet"
            description="Payslips are generated when payroll is processed. Run payroll from the Payroll tab."
          />
        </SalaryPanel>
      ) : (
        <SalaryPanel title="Payslips" subtitle={`${filtered.length} of ${data.payslips.length} payslips`} bodyClassName="p-0">
          <div className="overflow-x-auto max-h-[36rem]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
                <tr>
                  <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Payslip ID</th>
                  <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Employee</th>
                  <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground hidden sm:table-cell">Period</th>
                  <th className="text-right px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Net Pay</th>
                  <th className="text-center px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border/30 hover:bg-muted/20 even:bg-muted/10">
                    <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{p.id}</td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-[11px]">{p.employeeName}</p>
                      <p className="text-[9px] text-muted-foreground">{p.designation}</p>
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell text-[10px]">{p.period}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-emerald-600">{formatINR(p.netPay, true)}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="inline-flex items-center gap-0.5">
                        <button onClick={() => setSelected(p)} className="inline-flex items-center justify-center h-6 w-6 rounded text-primary hover:bg-primary/10 transition-colors" title="View">
                          <Eye className="h-3 w-3" />
                        </button>
                        <button onClick={() => toast.success('Print dialog opened', { description: p.id })} className="inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Print">
                          <Printer className="h-3 w-3" />
                        </button>
                        <button onClick={() => toast.success('Payslip downloaded', { description: `${p.id}.pdf` })} className="inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Download">
                          <Download className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="py-12"><SalaryEmptyState icon={<ReceiptIcon className="h-6 w-6" />} title="No payslips found" description="Try adjusting filters or search." /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </SalaryPanel>
      )}

      {/* Payslip preview modal */}
      <AnimatePresence>
        {selected && (
          <PayslipModal payslip={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function PayslipModal({ payslip, onClose }: { payslip: Payslip; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Action bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border sticky top-0 bg-card z-10">
          <p className="text-xs font-semibold">Payslip Preview</p>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => toast.success('Print dialog opened', { description: payslip.id })}>
              <Printer className="h-3 w-3" /> Print
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => toast.success('Payslip downloaded', { description: `${payslip.id}.pdf` })}>
              <Download className="h-3 w-3" /> Download
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          <PayslipContent payslip={payslip} />
        </div>

        <style jsx>{`
          @media print {
            body * { visibility: hidden; }
            .payslip-content, .payslip-content * { visibility: visible; }
            .payslip-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
      </motion.div>
    </motion.div>
  )
}

export function PayslipContent({ payslip }: { payslip: Payslip }) {
  return (
    <div className="payslip-content bg-white text-black rounded-lg border border-border p-6 shadow-sm">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-3 mb-4">
        <h1 className="text-lg font-bold tracking-tight">{school.name.toUpperCase()}</h1>
        <p className="text-[10px] text-gray-600 mt-0.5">{school.address}</p>
        <p className="text-[10px] text-gray-600">Ph: {school.phone} · {school.email}</p>
        <p className="text-[10px] text-gray-600">{school.affiliation}</p>
      </div>

      {/* Title */}
      <div className="text-center mb-4">
        <p className="font-bold text-sm tracking-[0.2em]">PAYSLIP</p>
        <p className="text-[11px] text-gray-600 mt-0.5">For the month of {payslip.period}</p>
      </div>

      {/* Employee details */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-[11px]">
        <div className="space-y-1">
          <div><span className="text-gray-600">Employee Name:</span> <span className="font-semibold">{payslip.employeeName}</span></div>
          <div><span className="text-gray-600">Designation:</span> <span className="font-semibold">{payslip.designation}</span></div>
          <div><span className="text-gray-600">Department:</span> <span className="font-semibold">{payslip.department}</span></div>
        </div>
        <div className="space-y-1 text-right">
          <div><span className="text-gray-600">Payslip ID:</span> <span className="font-mono font-semibold">{payslip.id}</span></div>
          <div><span className="text-gray-600">Pay Period:</span> <span className="font-semibold">{payslip.period}</span></div>
          <div><span className="text-gray-600">Pay Date:</span> <span className="font-semibold">{formatDate(payslip.payDate)}</span></div>
        </div>
      </div>

      {/* Earnings + Deductions */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-gray-300 rounded">
          <div className="bg-gray-100 px-2 py-1 border-b border-gray-300">
            <p className="text-[10px] font-bold uppercase">Earnings</p>
          </div>
          <table className="w-full text-[11px]">
            <tbody>
              {payslip.earnings.map((e, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="px-2 py-1">{e.name}</td>
                  <td className="px-2 py-1 text-right tabular-nums font-semibold">{formatINR(e.amount)}</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold">
                <td className="px-2 py-1">Gross Earnings</td>
                <td className="px-2 py-1 text-right tabular-nums">{formatINR(payslip.grossEarnings)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="border border-gray-300 rounded">
          <div className="bg-gray-100 px-2 py-1 border-b border-gray-300">
            <p className="text-[10px] font-bold uppercase">Deductions</p>
          </div>
          <table className="w-full text-[11px]">
            <tbody>
              {payslip.deductions.map((d, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="px-2 py-1">{d.name}</td>
                  <td className="px-2 py-1 text-right tabular-nums font-semibold">{formatINR(d.amount)}</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold">
                <td className="px-2 py-1">Total Deductions</td>
                <td className="px-2 py-1 text-right tabular-nums">{formatINR(payslip.totalDeductions)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Net Pay */}
      <div className="border-2 border-black bg-gray-100 p-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold">NET PAY</span>
          <span className="text-xl font-bold tabular-nums">{formatINR(payslip.netPay)}</span>
        </div>
      </div>

      {/* Bank details */}
      {payslip.bankAccount && (
        <div className="text-[10px] text-gray-600 mb-4 grid grid-cols-2 gap-2">
          <div>Bank Account: <span className="font-mono">{payslip.bankAccount}</span></div>
          <div className="text-right">Payment Mode: Bank Transfer</div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-300 pt-3 mt-4 flex justify-between text-[10px] text-gray-700">
        <div>
          <p className="font-semibold">Generated By:</p>
          <p className="mt-3 border-t border-gray-400 pt-0.5 w-24">Accountant</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Authorized By:</p>
          <p className="mt-3 border-t border-gray-400 pt-0.5 w-24 ml-auto">{school.principal}</p>
        </div>
      </div>

      <p className="text-center text-[9px] text-gray-500 mt-4">This is a computer-generated payslip. · Generated on {formatDate(payslip.generatedAt)}</p>
    </div>
  )
}
