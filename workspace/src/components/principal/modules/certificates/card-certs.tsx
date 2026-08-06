'use client'

import { school } from '@/lib/mock/school'
import { formatDate, formatINR } from '@/lib/format'
import type { Student } from './data'
import { Seal } from './shared'

/* ============== ID CARD ============== */

export function IdCardCert({ student }: { student: Student }) {
  const accent = 'oklch(0.7 0.15 200)'
  return (
    <div className="mx-auto" style={{ maxWidth: 340 }}>
      {/* Front */}
      <div className="relative rounded-xl overflow-hidden shadow-lg" style={{ boxShadow: `0 0 0 1px ${accent}40` }}>
        <div className="bg-gradient-to-r p-3 text-white" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blup font-display font-bold text-sm">{school.logo}</div>
              <div>
                <p className="font-display text-[11px] font-bold leading-tight">{school.name}</p>
                <p className="text-[7px] opacity-90">{school.tagline}</p>
              </div>
            </div>
            <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded">2025-26</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-950 p-4 flex gap-3">
          <div className="h-20 w-16 rounded-md bg-gradient-to-br flex items-center justify-center text-white font-display font-bold text-2xl shadow-md" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}>
            {student.avatar}
          </div>
          <div className="flex-1 space-y-1 text-[10px]">
            <p className="font-display text-sm font-bold" style={{ color: accent }}>{student.name}</p>
            <p className="text-slate-500">Adm: <span className="font-mono text-slate-700 dark:text-slate-300">{student.admissionNo}</span></p>
            <p className="text-slate-500">Class: <span className="font-semibold text-slate-700 dark:text-slate-300">{student.className}-{student.section}</span></p>
            <p className="text-slate-500">Roll: <span className="font-semibold text-slate-700 dark:text-slate-300">{student.rollNo}</span></p>
            <p className="text-slate-500">Blood: <span className="font-semibold text-slate-700 dark:text-slate-300">{student.bloodGroup}</span></p>
            <p className="text-slate-500">Ph: <span className="text-slate-700 dark:text-slate-300">{student.guardianPhone}</span></p>
          </div>
        </div>
        <div className="bg-slate-100 dark:bg-slate-900 p-2 flex items-center justify-between text-[8px] text-slate-500">
          <span>Valid till: Mar 2025</span>
          <span>{school.website}</span>
        </div>
      </div>
      {/* Back */}
      <div className="mt-2 rounded-xl bg-white dark:bg-slate-950 p-3 text-[9px] text-slate-600 dark:text-slate-400 shadow-md" style={{ boxShadow: `0 0 0 1px ${accent}40` }}>
        <p className="font-semibold mb-1" style={{ color: accent }}>Rules & Regulations</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>This card must be carried at all times within school premises.</li>
          <li>Loss of card should be reported immediately to the office.</li>
          <li>This card is non-transferable and property of {school.shortName}.</li>
        </ul>
        <div className="flex items-end justify-between mt-2">
          <div>
            <div className="border-t border-slate-300 w-20 mt-3" />
            <p className="mt-0.5 text-[8px]">Principal's Sign</p>
          </div>
          <Seal accent={accent} />
        </div>
      </div>
    </div>
  )
}

/* ============== FEE RECEIPT ============== */

const FEE_ITEMS = [
  { name: 'Tuition Fee', amount: 60000 },
  { name: 'Transport Fee', amount: 18000 },
  { name: 'Library Fee', amount: 2000 },
  { name: 'Examination Fee', amount: 3000 },
  { name: 'Activity Fee', amount: 3000 },
]

export function FeeReceipt({ student }: { student: Student }) {
  const accent = 'oklch(0.62 0.2 25)'
  const total = FEE_ITEMS.reduce((s, i) => s + i.amount, 0)
  return (
    <div className="bg-white dark:bg-slate-950 rounded-lg p-5 shadow-md" style={{ boxShadow: `0 0 0 1px ${accent}40` }}>
      <div className="flex items-center justify-between border-b-2 pb-3" style={{ borderColor: accent }}>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full text-white font-display font-bold text-lg" style={{ background: accent }}>{school.logo}</div>
          <div>
            <h3 className="font-display text-sm font-bold" style={{ color: accent }}>{school.name}</h3>
            <p className="text-[8px] text-muted-foreground">{school.address}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: accent }}>Fee Receipt</p>
          <p className="text-[8px] text-muted-foreground">RCP-2025-{Math.floor(Math.random() * 9000 + 1000)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
        <div><span className="text-muted-foreground">Student:</span> <span className="font-semibold">{student.name}</span></div>
        <div><span className="text-muted-foreground">Admission No:</span> <span className="font-mono">{student.admissionNo}</span></div>
        <div><span className="text-muted-foreground">Class:</span> <span className="font-semibold">{student.className}-{student.section}</span></div>
        <div><span className="text-muted-foreground">Date:</span> <span>{formatDate(new Date())}</span></div>
        <div><span className="text-muted-foreground">Purpose:</span> Annual Fee — Q1</div>
        <div><span className="text-muted-foreground">Mode:</span> <span className="font-semibold">UPI</span></div>
      </div>

      <table className="w-full mt-3 text-[10px]">
        <thead>
          <tr className="text-left" style={{ background: `color-mix(in oklch, ${accent} 10%, white)` }}>
            <th className="p-1.5 font-semibold">Particulars</th>
            <th className="p-1.5 font-semibold text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {FEE_ITEMS.map((it, i) => (
            <tr key={i} className="border-b border-dotted border-slate-200 dark:border-slate-800">
              <td className="p-1.5">{it.name}</td>
              <td className="p-1.5 text-right font-mono">{formatINR(it.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold" style={{ background: `color-mix(in oklch, ${accent} 15%, white)` }}>
            <td className="p-2">Total Paid</td>
            <td className="p-2 text-right font-mono" style={{ color: accent }}>{formatINR(total)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="flex items-end justify-between mt-4">
        <div className="text-[8px] text-muted-foreground">
          <p>This is a computer-generated receipt.</p>
          <p>For queries: accounts@greenwood.edu.in</p>
        </div>
        <div className="text-center">
          <div className="mt-4 border-t border-slate-400 w-24" />
          <p className="text-[8px] text-muted-foreground mt-0.5">Accounts Officer</p>
        </div>
      </div>
    </div>
  )
}
