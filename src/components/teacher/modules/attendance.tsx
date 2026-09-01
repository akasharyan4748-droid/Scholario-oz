'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarCheck, Check, X, Clock, Plane, Save, CheckCircle2, Users,
  Sparkles, Search,
} from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { class2AAttendance } from '@/lib/mock/attendance'
import { cn } from '@/lib/utils'

type Status = 'present' | 'absent' | 'late' | 'leave'

const statusConfig: Record<Status, { label: string; icon: React.ReactNode; active: string; inactive: string }> = {
  present: {
    label: 'Present',
    icon: <Check className="h-3.5 w-3.5" />,
    active: 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/30',
    inactive: 'text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30',
  },
  absent: {
    label: 'Absent',
    icon: <X className="h-3.5 w-3.5" />,
    active: 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/30',
    inactive: 'text-rose-600 hover:bg-rose-500/10 border-rose-500/30',
  },
  late: {
    label: 'Late',
    icon: <Clock className="h-3.5 w-3.5" />,
    active: 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/30',
    inactive: 'text-amber-600 hover:bg-amber-500/10 border-amber-500/30',
  },
  leave: {
    label: 'Leave',
    icon: <Plane className="h-3.5 w-3.5" />,
    active: 'bg-info text-white border-info shadow-sm',
    inactive: 'text-info hover:bg-info/10 border-info/30',
  },
}

export function AttendanceModule() {
  const [selectedClass, setSelectedClass] = useState('2-A')
  const [search, setSearch] = useState('')
  const [records, setRecords] = useState<Record<string, Status>>(() => {
    const init: Record<string, Status> = {}
    class2AAttendance.forEach((r) => {
      init[r.rollNo] = r.status as Status
    })
    return init
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const setStatus = (rollNo: string, status: Status) => {
    setRecords((prev) => ({ ...prev, [rollNo]: status }))
    setSaved(false)
  }

  const bulkMarkPresent = () => {
    const init: Record<string, Status> = {}
    class2AAttendance.forEach((r) => {
      init[r.rollNo] = 'present'
    })
    setRecords(init)
    setSaved(false)
    toast.success('All students marked present', { description: 'Review and save the attendance.' })
  }

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, leave: 0 }
    Object.values(records).forEach((s) => { c[s]++ })
    return c
  }, [records])

  const filtered = class2AAttendance.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) || r.rollNo.includes(search)
  )

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      toast.success('Attendance saved successfully', {
        description: `Class ${selectedClass} · ${counts.present} present, ${counts.absent} absent, ${counts.late} late, ${counts.leave} on leave`,
      })
    }, 1100)
  }

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Attendance"
        subtitle={`Mark daily attendance · ${today}`}
        icon={<CalendarCheck className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2-A">Class 2-A</SelectItem>
                <SelectItem value="2-B">Class 2-B</SelectItem>
                <SelectItem value="2-C">Class 2-C</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-emerald-600 to-teal-600">
              <AnimatePresence mode="wait" initial={false}>
                {saving ? (
                  <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white" />
                    Saving…
                  </motion.span>
                ) : saved ? (
                  <motion.span key="saved" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Saved
                  </motion.span>
                ) : (
                  <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    <Save className="h-4 w-4" /> Save Attendance
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        }
      />

      {/* Live summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[
          { label: 'Present', value: counts.present, color: 'emerald', icon: <Check className="h-4 w-4" /> },
          { label: 'Absent', value: counts.absent, color: 'rose', icon: <X className="h-4 w-4" /> },
          { label: 'Late', value: counts.late, color: 'amber', icon: <Clock className="h-4 w-4" /> },
          { label: 'On Leave', value: counts.leave, color: 'info', icon: <Plane className="h-4 w-4" /> },
        ].map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{c.label}</span>
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg',
                  c.color === 'emerald' && 'bg-emerald-500/10 text-emerald-600',
                  c.color === 'rose' && 'bg-rose-500/10 text-rose-600',
                  c.color === 'amber' && 'bg-amber-500/10 text-amber-600',
                  c.color === 'info' && 'bg-info/10 text-info',
                )}>
                  {c.icon}
                </div>
              </div>
              <p className={cn(
                'font-display text-2xl font-bold',
                c.color === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
                c.color === 'rose' && 'text-rose-600 dark:text-rose-400',
                c.color === 'amber' && 'text-amber-600 dark:text-amber-400',
                c.color === 'info' && 'text-info',
              )}>
                <motion.span key={c.value} initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                  {c.value}
                </motion.span>
                <span className="text-base text-muted-foreground font-normal">/18</span>
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Bulk action + search */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-sm">Class {selectedClass} · Student Roster</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Tap a status button for each student. Attendance rate: {((counts.present / 18) * 100).toFixed(1)}%</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student…"
                className="pl-8 w-44 h-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={bulkMarkPresent} className="h-9">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Mark all present
            </Button>
          </div>
        </div>

        {/* Attendance grid */}
        <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1 -mr-1">
          {filtered.map((r, i) => {
            const current = records[r.rollNo]
            return (
              <motion.div
                key={r.rollNo}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                  current === 'present' ? 'border-emerald-500/20 bg-emerald-500/5' :
                  current === 'absent' ? 'border-rose-500/20 bg-rose-500/5' :
                  current === 'late' ? 'border-amber-500/20 bg-amber-500/5' :
                  current === 'leave' ? 'border-info/20 bg-info/5' :
                  'border-border bg-card/40'
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                  {r.rollNo}
                </div>
                <GradientAvatar name={r.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">Roll #{r.rollNo} · Class 2-A</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {(Object.keys(statusConfig) as Status[]).map((s) => {
                    const cfg = statusConfig[s]
                    const isActive = current === s
                    return (
                      <motion.button
                        key={s}
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ y: -1 }}
                        onClick={() => setStatus(r.rollNo, s)}
                        className={cn(
                          'flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-all',
                          isActive ? cfg.active : cn('bg-transparent', cfg.inactive)
                        )}
                        title={cfg.label}
                      >
                        {cfg.icon}
                        <span className="hidden sm:inline">{cfg.label}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Footer summary */}
        <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Total: <span className="font-semibold text-foreground">18 students</span></span>
            <span className="text-muted-foreground">·</span>
            <StatusBadge
              status={counts.present >= 15 ? 'Healthy' : counts.present >= 12 ? 'Average' : 'Low'}
              variant={counts.present >= 15 ? 'success' : counts.present >= 12 ? 'warning' : 'danger'}
              dot
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Auto-save: <span className={saved ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>{saved ? 'All changes saved' : 'Unsaved changes'}</span>
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
