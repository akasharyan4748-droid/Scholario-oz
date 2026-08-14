'use client'

/**
 * PolicySection — Homework Policy & Rules.
 *
 * A. Maximum Time Limits: per-grade daily homework caps.
 * B. No-Homework Calendar: block out dates school-wide.
 */

import { useState } from 'react'
import { ShieldCheck, Calendar, Plus, Trash2, Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { InlineLoading } from '../../exams/inline-loading'
import { usePolicies, useNoHomeworkDates } from '@/lib/homework/use-oversight'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function PolicySection() {
  return (
    <div className="space-y-4">
      <MaxTimeLimits />
      <NoHomeworkCalendar />
    </div>
  )
}

// ─── Max Time Limits ──────────────────────────────────────────────────

function MaxTimeLimits() {
  const { data: policies, loading, update } = usePolicies()
  const [editing, setEditing] = useState<Record<string, number>>({})
  const [dirty, setDirty] = useState(false)

  const handleSave = async (id: string) => {
    const newVal = editing[id]
    if (newVal === undefined) return
    try {
      await update(id, { maxMinutesPerDay: newVal })
      setEditing((p) => { const n = { ...p }; delete n[id]; return n })
      setDirty(false)
      toast.success('Policy updated')
    } catch (e: any) {
      toast.error('Failed to update', { description: e.message })
    }
  }

  if (loading) return <InlineLoading label="Loading policies…" />

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Maximum Time Limits</h3>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">
        Set global caps on daily homework by grade level. The system blocks teachers from publishing more work if the daily cap is exceeded.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Grade Level</TableHead>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Max Minutes / Day</TableHead>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Enabled</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-xs font-medium">
                  {p.gradeLevel === 'all' ? 'All Grades (default)' : `Grade ${p.gradeLevel}`}
                </TableCell>
                <TableCell className="text-center">
                  <input
                    type="number"
                    value={editing[p.id] ?? p.maxMinutesPerDay}
                    onChange={(e) => { setEditing({ ...editing, [p.id]: Number(e.target.value) }); setDirty(true) }}
                    className="w-20 text-center bg-transparent border-0 outline-none text-xs"
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={p.enabled}
                    onCheckedChange={(v) => update(p.id, { enabled: v === true })}
                  />
                </TableCell>
                <TableCell>
                  {dirty && editing[p.id] !== undefined && (
                    <button onClick={() => handleSave(p.id)} className="text-emerald-600 hover:text-emerald-700">
                      <Save className="h-3.5 w-3.5" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> ≤ limit (Balanced)</div>
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> 70-100% (High)</div>
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> {'>'}100% (Overload)</div>
      </div>
    </div>
  )
}

// ─── No-Homework Calendar ─────────────────────────────────────────────

function NoHomeworkCalendar() {
  const { data: dates, loading, add, remove } = useNoHomeworkDates()
  const [newDate, setNewDate] = useState('')
  const [reason, setReason] = useState('')

  const handleAdd = async () => {
    if (!newDate) { toast.error('Select a date'); return }
    try {
      await add(newDate, reason || undefined)
      setNewDate('')
      setReason('')
      toast.success('Date blocked')
    } catch (e: any) {
      toast.error('Failed to block date', { description: e.message })
    }
  }

  if (loading) return <InlineLoading label="Loading…" />

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">No-Homework Calendar</h3>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">
        Block out specific dates school-wide — sports days, festivals, exam weeks. No homework can be assigned on these dates.
      </p>
      <div className="flex flex-wrap items-end gap-2 mb-3">
        <div>
          <Label className="text-[10px]">Date</Label>
          <DatePicker value={newDate} onChange={setNewDate} placeholder="Select date" />
        </div>
        <div className="flex-1 min-w-[150px]">
          <Label className="text-[10px]">Reason (optional)</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Sports Day" className="h-8 text-xs" />
        </div>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={handleAdd}>
          <Plus className="h-3 w-3" /> Block Date
        </Button>
      </div>
      {dates.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">No blocked dates. All days allow homework.</p>
      ) : (
        <div className="space-y-1">
          {dates.map((d) => (
            <div key={d.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/60">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium flex-1">
                {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {d.reason && <span className="text-[10px] text-muted-foreground">{d.reason}</span>}
              <button onClick={() => remove(d.id)} className="text-muted-foreground hover:text-rose-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
