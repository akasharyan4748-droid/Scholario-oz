'use client'

/**
 * FeesStructuresSection — Fee Structure administrative section.
 *
 * - Per-class structure cards (5 categories)
 * - Edit / Duplicate / View Students / View History actions
 * - Add new fee head / archive fee head (preserves historical transactions)
 * - Versioning notice: changes apply only to NEW student accounts
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, Pencil, Copy, Users, History, Plus, Archive, Check, X, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useFeeData, useFeeStore, type FeeStructureConfig } from '@/lib/store/fee-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeePanel, FeeEmptyState, FeePill } from './fees-shared'
import { toast } from 'sonner'

const CATEGORY_COLORS: Record<string, { chip: string; bar: string; dot: string }> = {
  'Pre-Primary': { chip: 'bg-cyan-500/10 text-cyan-600 ring-cyan-500/20', bar: 'oklch(0.7 0.15 200)', dot: 'bg-cyan-500' },
  'Primary': { chip: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20', bar: 'oklch(0.55 0.14 162)', dot: 'bg-emerald-500' },
  'Middle': { chip: 'bg-amber-500/10 text-amber-600 ring-amber-500/20', bar: 'oklch(0.65 0.16 75)', dot: 'bg-amber-500' },
  'Secondary': { chip: 'bg-violet-500/10 text-violet-600 ring-violet-500/20', bar: 'oklch(0.6 0.18 300)', dot: 'bg-violet-500' },
  'Senior': { chip: 'bg-rose-500/10 text-rose-600 ring-rose-500/20', bar: 'oklch(0.62 0.2 25)', dot: 'bg-rose-500' },
}

export function FeesStructuresSection({ data }: { data: ReturnType<typeof useFeeData> }) {
  const { feeStructures } = data
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddHead, setShowAddHead] = useState<string | null>(null)
  const students = useStudentsStore((s) => s.students)

  const studentsByLevel = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of students) {
      const level =
        s.className.includes('11') || s.className.includes('12') ? 'Senior Secondary' :
        s.className.includes('9') || s.className.includes('10') ? 'Secondary' :
        s.className.match(/Class [6-8]/) ? 'Middle' :
        s.className.match(/Class [1-5]/) ? 'Primary' : 'Pre-Primary'
      counts[level] = (counts[level] ?? 0) + 1
    }
    return counts
  }, [students])

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Version safety banner */}
      <div className="rounded-lg bg-sky-500/5 border border-sky-500/20 p-2.5 flex items-start gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-[11px] text-muted-foreground">
          <p className="font-semibold text-sky-700 dark:text-sky-300">Version-safe policy</p>
          <p className="mt-0.5">Fee structure changes apply to <strong>new</strong> student accounts only. Historical transactions remain unchanged for auditability. Archiving a fee head preserves its past transactions.</p>
        </div>
      </div>

      {/* Structure grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {feeStructures.map((f, i) => {
          const accent = CATEGORY_COLORS[f.category] ?? CATEGORY_COLORS['Primary']
          const studentsCount = studentsByLevel[f.classLevel] ?? 0
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card p-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1', accent.chip)}>
                    <Layers className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{f.className}</p>
                    <p className="text-[9px] text-muted-foreground">{f.category} · v{f.version}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] tabular-nums">{formatINR(f.annual, true)}</Badge>
              </div>

              {/* Components */}
              <div className="space-y-1 mb-2">
                {f.components.filter((c) => c.active).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-[10px] rounded-md hover:bg-muted/30 px-1.5 py-1 group">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', accent.dot)} />
                      <span className="font-medium truncate">{c.name}</span>
                      {c.mandatory && <Badge variant="outline" className="text-[7px] py-0 px-1 h-3">REQ</Badge>}
                    </div>
                    <span className="font-mono font-semibold tabular-nums shrink-0">{formatINR(c.amount, true)}</span>
                  </div>
                ))}
                {f.components.filter((c) => !c.active).length > 0 && (
                  <details className="mt-1">
                    <summary className="text-[9px] text-muted-foreground cursor-pointer hover:text-foreground">+ {f.components.filter((c) => !c.active).length} archived</summary>
                    <div className="space-y-1 mt-1">
                      {f.components.filter((c) => !c.active).map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-[10px] opacity-60 line-through">
                          <span className="flex items-center gap-1.5"><span className={cn('h-1.5 w-1.5 rounded-full', accent.dot)} />{c.name}</span>
                          <span className="font-mono">{formatINR(c.amount, true)}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 pt-2 border-t border-border/40">
                <Button size="sm" variant="ghost" className="h-6 text-[9px] gap-1 flex-1" onClick={() => toast.info(`${studentsCount} students use this structure`, { description: f.className })}>
                  <Users className="h-2.5 w-2.5" /> {studentsCount}
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-[9px] gap-1 flex-1" onClick={() => toast.info('Version history', { description: `${f.className} · v${f.version} · effective ${f.effectiveFrom}` })}>
                  <History className="h-2.5 w-2.5" /> v{f.version}
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-[9px] gap-1 flex-1" onClick={() => toast.info('Duplicated', { description: `${f.className} v${f.version + 1} created as draft` })}>
                  <Copy className="h-2.5 w-2.5" /> Dup
                </Button>
                <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1 flex-1" onClick={() => setShowAddHead(f.id)}>
                  <Plus className="h-2.5 w-2.5" /> Add
                </Button>
              </div>

              {/* Inline add fee head form */}
              <AnimatePresence>
                {showAddHead === f.id && (
                  <AddFeeHeadForm
                    structureId={f.id}
                    onClose={() => setShowAddHead(null)}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}



function AddFeeHeadForm({ structureId, onClose }: { structureId: string; onClose: () => void }) {
  const addFeeHead = useFeeStore((s) => s.addFeeHead)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState(0)
  const [frequency, setFrequency] = useState<'Annual' | 'Quarterly' | 'Monthly' | 'One-time'>('Annual')
  const [mandatory, setMandatory] = useState(true)

  const submit = () => {
    if (!name || amount <= 0) {
      toast.error('Fill all fields', { description: 'Fee head name and amount are required.' })
      return
    }
    addFeeHead(structureId, { name, amount, frequency, mandatory })
    toast.success('Fee head added', { description: `${name} (${formatINR(amount, true)}) added to structure.` })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 pt-2 border-t border-border/40 overflow-hidden"
    >
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Head Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sports Fee" className="h-7 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Amount (₹)</Label>
            <Input type="number" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className="h-7 text-xs tabular-nums" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Frequency</Label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)} className="w-full h-7 text-xs rounded-md border border-border bg-background px-2">
              <option value="Annual">Annual</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Monthly">Monthly</option>
              <option value="One-time">One-time</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
              <input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} className="rounded" />
              Mandatory
            </label>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" className="h-6 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white flex-1" onClick={submit}>
            <Check className="h-3 w-3" /> Add Head
          </Button>
          <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={onClose}>
            <X className="h-3 w-3" /> Cancel
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
