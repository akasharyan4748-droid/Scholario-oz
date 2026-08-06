'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Award, Phone } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { Input } from '@/components/ui/input'
import { students, type Student } from '@/lib/mock/students'
import { cn } from '@/lib/utils'
import { scoreSequence, type Filter } from './data'

// Students directory grid with search + attendance filter. Owns its own search/filter state.
export function StudentsGrid({ onSelect }: { onSelect: (s: Student) => void }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    let list = students
    if (search) {
      list = list.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.rollNo.includes(search) ||
        s.admissionNo.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (filter === 'high') list = list.filter((s) => s.attendance >= 95)
    if (filter === 'at-risk') list = list.filter((s) => s.attendance < 90)
    return list
  }, [search, filter])

  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, roll, admission no…" className="pl-8 h-9" />
        </div>
        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg">
          {([['all', 'All'], ['high', 'Top Attendees'], ['at-risk', 'At Risk']] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                filter === k ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((s, i) => {
          const score = scoreSequence[i % 18]
          const scorePct = (score / 50) * 100
          return (
            <motion.button
              key={s.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -3 }}
              onClick={() => onSelect(s)}
              className="text-left rounded-2xl border border-border bg-card/40 p-4 hover:shadow-premium hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <GradientAvatar name={s.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate">{s.name}</p>
                    {s.scholarship > 0 && <Award className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Roll #{s.rollNo} · {s.admissionNo}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.fatherName}</p>
                </div>
                <StatusBadge status={s.attendance >= 95 ? 'Excellent' : s.attendance >= 90 ? 'Good' : 'At Risk'} variant={s.attendance >= 95 ? 'success' : s.attendance >= 90 ? 'info' : 'warning'} dot />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground">Attendance</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <ProgressBar value={s.attendance} color={s.attendance > 95 ? 'oklch(0.55 0.14 162)' : s.attendance > 90 ? 'oklch(0.65 0.16 75)' : 'oklch(0.62 0.2 25)'} height={4} className="flex-1" />
                    <span className="text-xs font-semibold">{s.attendance}%</span>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground">Math Score</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <ProgressBar value={scorePct} color="oklch(0.6 0.18 300)" height={4} className="flex-1" />
                    <span className="text-xs font-semibold">{score}/50</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {s.guardianPhone}</span>
                <span className="text-primary font-medium">View profile →</span>
              </div>
            </motion.button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No students match your search.
        </div>
      )}
    </GlassCard>
  )
}
