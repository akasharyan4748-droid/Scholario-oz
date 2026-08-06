'use client'

import { motion } from 'framer-motion'
import {
  Award, Trophy, Download, TrendingUp, Sparkles, FileText, Star,
  CheckCircle2, ArrowUpRight, Medal,
} from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { ChartCard, AreaTrend, ProgressBar } from '@/components/shared/charts'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { examResults } from '@/lib/mock/academics'
import { gradeColor } from '@/lib/format'
import { toast } from 'sonner'

const subjectColors: Record<string, string> = {
  English: 'from-emerald-400 to-teal-500',
  Mathematics: 'from-violet-400 to-purple-500',
  Science: 'from-amber-400 to-orange-500',
  'Social Studies': 'from-orange-400 to-red-500',
  Hindi: 'from-rose-400 to-pink-500',
  'Computer Science': 'from-lime-400 to-green-500',
}

export function ResultsModule() {
  const r = examResults

  return (
    <div className="space-y-6">
      <SectionHeading
        title="My Results"
        subtitle="Unit Test 3 · November 2024 · Class 2-A"
        icon={<Award className="h-5 w-5" />}
        action={
          <Button
            onClick={() => toast.success('Report card download started', { description: 'RCP-UT3-2024-018.pdf will appear in your downloads.' })}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          >
            <Download className="h-3.5 w-3.5" /> Download Report Card
          </Button>
        }
      />

      {/* Hero report card */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 sm:p-8 text-white overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute left-1/3 -bottom-16 h-32 w-32 rounded-full bg-amber-300/30 blur-2xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur border-2 border-white/30 text-3xl sm:text-4xl font-extrabold"
              >
                AS
              </motion.div>
              <div>
                <div className="flex items-center gap-2 text-violet-100 text-xs font-medium mb-1.5">
                  <Sparkles className="h-3 w-3" /> Unit Test 3 Result
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold">Aarav Sharma</h2>
                <p className="text-violet-50/90 text-sm mt-0.5">Class 2-A · Roll #18 · Nov 2024</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="rounded-2xl bg-white/15 backdrop-blur px-5 py-3 text-center border border-white/20">
                <p className="font-display text-3xl font-extrabold">
                  <AnimatedCounter value={r.percentage} decimals={1} suffix="%" />
                </p>
                <p className="text-[11px] text-violet-100">Percentage</p>
              </div>
              <div className="rounded-2xl bg-white/15 backdrop-blur px-5 py-3 text-center border border-white/20">
                <p className="font-display text-3xl font-extrabold flex items-center gap-1 justify-center">
                  <Medal className="h-6 w-6 text-amber-200" />
                  {r.rank}
                </p>
                <p className="text-[11px] text-violet-100">of {r.totalStudents} students</p>
              </div>
              <div className="rounded-2xl bg-amber-400/30 backdrop-blur px-5 py-3 text-center border border-amber-200/30 hidden sm:block">
                <p className="font-display text-3xl font-extrabold">{r.grade}</p>
                <p className="text-[11px] text-amber-50">Grade</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subject-wise table */}
        <div className="p-5 sm:p-6">
          <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-violet-500" /> Subject-wise Marks
          </h3>
          <div className="overflow-x-auto -mx-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Subject</TableHead>
                  <TableHead className="text-center">Max Marks</TableHead>
                  <TableHead className="text-center">Obtained</TableHead>
                  <TableHead className="text-center min-w-[120px]">Progress</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.studentResults.map((s, i) => {
                  const pct = (s.obtained / s.maxMarks) * 100
                  const color = subjectColors[s.subject] ?? 'from-emerald-400 to-teal-500'
                  return (
                    <motion.tr
                      key={s.subject}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white text-[10px] font-bold shadow-md`}>
                            {s.subject.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm">{s.subject}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">{s.maxMarks}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-display font-bold text-base">{s.obtained}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={pct} color={gradeColor(s.grade)} height={6} className="w-20" />
                          <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="font-bold"
                          style={{
                            background: `${gradeColor(s.grade)}20`,
                            color: gradeColor(s.grade),
                            border: `1px solid ${gradeColor(s.grade)}40`,
                          }}
                        >
                          {s.grade}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Total row */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-card/40 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Total Marks</p>
              <p className="font-display text-xl font-bold mt-0.5">
                <AnimatedCounter value={r.total} /> / {r.maxTotal}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Percentage</p>
              <p className="font-display text-xl font-bold mt-0.5 text-emerald-600">
                <AnimatedCounter value={r.percentage} decimals={1} suffix="%" />
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Class Rank</p>
              <p className="font-display text-xl font-bold mt-0.5 text-violet-600">
                #{r.rank} <span className="text-xs text-muted-foreground font-normal">/ {r.totalStudents}</span>
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Overall Grade</p>
              <p className="font-display text-xl font-bold mt-0.5 text-amber-600">{r.grade}</p>
            </div>
          </div>

          {/* Remarks */}
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-4">
            <div className="flex items-start gap-3">
              <GradientAvatar name="Rohan Mehta" size="md" gradient="from-amber-400 to-orange-500" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Class Teacher's Remarks
                </p>
                <p className="text-sm mt-1 leading-relaxed">{r.remarks}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5">— Rohan Mehta, Class Teacher 2-A</p>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Progress trend + Class toppers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard
          title="My Progress Trend"
          subtitle="Across all tests this year"
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+7% growth</span>
            </div>
          }
        >
          <AreaTrend data={r.progressTrend} xKey="exam" yKey="percentage" color="oklch(0.6 0.18 300)" height={260} gradientId="progGrad" />
        </ChartCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" /> Class Top 5
          </h3>
          <div className="space-y-2">
            {[
              { rank: 1, name: 'Myra Iyer', percentage: 96.7, avatar: 'MI', rollNo: '10' },
              { rank: 2, name: 'Anika Desai', percentage: 94.3, avatar: 'AD', rollNo: '14' },
              { rank: 3, name: 'Aarav Sharma (You)', percentage: 91.3, avatar: 'AS', rollNo: '18' },
              { rank: 4, name: 'Ananya Singh', percentage: 90.0, avatar: 'AN', rollNo: '04' },
              { rank: 5, name: 'Kiara Rao', percentage: 88.7, avatar: 'KR', rollNo: '12' },
            ].map((t, i) => (
              <motion.div
                key={t.rank}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`flex items-center gap-2.5 rounded-xl p-2 ${
                  t.name.includes('You') ? 'bg-violet-500/10 border border-violet-500/30' : 'hover:bg-accent/30 transition-colors'
                }`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center text-base">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-xs font-bold text-muted-foreground">{t.rank}</span>}
                </div>
                <GradientAvatar name={t.name} initials={t.avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">Roll #{t.rollNo}</p>
                </div>
                <span className="font-display font-bold text-sm text-emerald-600">{t.percentage}%</span>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Achievements */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-500" /> My Achievements
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { title: 'Top 3 in Class', desc: 'Unit Test 3', icon: '🏆', color: 'from-amber-400 to-orange-500' },
            { title: 'Perfect Attendance', desc: 'August 2024', icon: '🎯', color: 'from-emerald-400 to-teal-500' },
            { title: 'Star Reader', desc: '12 books this term', icon: '📚', color: 'from-violet-400 to-purple-500' },
            { title: 'Math Whiz', desc: '48/50 in UT3', icon: '🔢', color: 'from-cyan-400 to-sky-500' },
          ].map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-border bg-card/40 p-4 text-center hover:shadow-premium transition-shadow"
            >
              <div className={`flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-gradient-to-br ${a.color} text-2xl shadow-md mb-2`}>
                {a.icon}
              </div>
              <p className="font-semibold text-sm">{a.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
