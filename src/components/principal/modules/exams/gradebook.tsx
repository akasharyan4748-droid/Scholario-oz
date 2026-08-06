'use client'

// Gradebook view: Class Toppers card (top 5 of UT3) + Grade Sheet table for
// UT3 · Class 2-A (auto-ranked, 12 students shown).

import { motion } from 'framer-motion'
import { Trophy, GraduationCap, Download, Medal } from 'lucide-react'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { classToppers } from '@/lib/mock/academics'
import { toast } from 'sonner'
import { gradeSheet, gradeSheetSubjects } from './data'
import { GradePill, RankBadge } from './shared'

export function ClassToppersCard() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-500" /> Class Toppers — UT3
      </h3>
      <p className="text-xs text-muted-foreground mb-3">Class 2-A · Top 5 performers</p>
      <div className="space-y-2">
        {classToppers.map((t, i) => (
          <motion.div
            key={t.rank}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`flex items-center gap-3 rounded-xl border p-2.5 ${t.rank === 1 ? 'bg-amber-500/5 border-amber-500/30' : 'bg-card/40 border-border'}`}
          >
            {t.rank === 1 ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white">
                <Medal className="h-4 w-4" />
              </div>
            ) : (
              <RankBadge rank={t.rank} />
            )}
            <GradientAvatar name={t.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{t.name}</p>
              <p className="text-[10px] text-muted-foreground">Roll #{t.rollNo}</p>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-sm">{t.percentage}%</p>
              <p className="text-[10px] text-muted-foreground">Rank #{t.rank}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}

export function GradeSheetCard() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" /> Grade Sheet — UT3 · Class 2-A
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Auto-ranked · {gradeSheet.length} students shown</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success('Grade sheet exported', { description: 'UT3-class-2A-gradesheet.pdf' })}
        >
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>
      <div className="overflow-x-auto -mx-2 max-h-[28rem] overflow-y-auto custom-scroll">
        <Table>
          <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Student</TableHead>
              {gradeSheetSubjects.map((s) => (
                <TableHead key={s} className="text-center hidden md:table-cell text-[10px]">{s.slice(0, 4)}</TableHead>
              ))}
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">%</TableHead>
              <TableHead className="text-center">Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gradeSheet.map((s, i) => (
              <motion.tr
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors ${s.rank <= 3 ? 'bg-amber-500/5' : ''}`}
              >
                <TableCell className="font-bold text-xs">
                  {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : s.rank}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <GradientAvatar name={s.name} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium text-xs truncate">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">#{s.roll}</p>
                    </div>
                  </div>
                </TableCell>
                {s.marks.map((m, idx) => (
                  <TableCell key={idx} className="text-center hidden md:table-cell text-xs font-mono">
                    <span className={m >= 45 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : m >= 35 ? 'text-foreground' : 'text-rose-600 dark:text-rose-400'}>
                      {m}
                    </span>
                  </TableCell>
                ))}
                <TableCell className="text-right font-display font-bold text-sm">
                  {s.total}<span className="text-muted-foreground text-[10px]">/{s.maxTotal}</span>
                </TableCell>
                <TableCell className="text-right font-semibold text-sm">{s.pct}%</TableCell>
                <TableCell className="text-center">
                  <GradePill grade={s.grade} />
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  )
}

export function ExamsGradebook() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ClassToppersCard />
      <GradeSheetCard />
    </div>
  )
}
