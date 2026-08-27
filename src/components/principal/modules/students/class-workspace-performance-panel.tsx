'use client'

import { TrendingUp, Award } from 'lucide-react'
import { GradientAvatar } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { type StudentRecord } from '@/lib/store/students-store'

export function PerformancePanel({ students }: { students: StudentRecord[] }) {
  const avgPercent = students.length > 0 ? Math.round(students.reduce((a, s) => a + s.academics.overallPercent, 0) / students.length) : 0
  const topPerformers = [...students].sort((a, b) => b.academics.overallPercent - a.academics.overallPercent).slice(0, 5)
  const needsAttention = students.filter((s) => s.attendance < 75 || s.academics.overallPercent < 60)
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="rounded-xl border border-border bg-card/40 p-4">
        <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-amber-600" /> Top Performers</h4>
        <div className="space-y-2">
          {topPerformers.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <span className="text-xs font-bold w-5 text-amber-600 dark:text-amber-400">#{i + 1}</span>
              <GradientAvatar name={s.name} initials={s.avatar} size="sm" className="h-7 w-7 text-[10px]" />
              <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{s.name}</p><p className="text-[10px] text-muted-foreground">Roll {s.rollNo} · Sec {s.section}</p></div>
              <Badge variant="secondary" className="text-[10px]">{s.academics.overallGrade}</Badge>
              <span className="text-xs font-semibold w-10 text-right">{s.academics.overallPercent}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card/40 p-4">
        <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-rose-600" /> Needs Attention</h4>
        {needsAttention.length > 0 ? (
          <div className="space-y-2">
            {needsAttention.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <GradientAvatar name={s.name} initials={s.avatar} size="sm" className="h-7 w-7 text-[10px]" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.attendance < 75 && <span className="text-rose-600 dark:text-rose-400">Attendance {s.attendance}%</span>}{s.attendance < 75 && s.academics.overallPercent < 60 && ' · '}{s.academics.overallPercent < 60 && <span className="text-rose-600 dark:text-rose-400">Grade {s.academics.overallGrade}</span>}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20"><p className="text-xs text-emerald-700 dark:text-emerald-300">All students performing well</p></div>
        )}
      </div>
      <div className="lg:col-span-2 rounded-xl border border-border bg-card/40 p-4">
        <div className="flex items-center justify-between mb-2"><h4 className="text-xs font-semibold">Class Average Performance</h4><Badge variant="secondary" className="text-[10px]">{avgPercent}% overall</Badge></div>
        <div className="h-3.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${avgPercent}%` }} /></div>
      </div>
    </div>
  )
}
