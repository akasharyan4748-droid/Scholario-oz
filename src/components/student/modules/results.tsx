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
import { school } from '@/lib/mock/school'
import { useStudentsStore } from '@/lib/store/students-store'
import { DEMO_STUDENT_ID } from './applications/student'
import { downloadHTMLFile, safeFileName } from '@/lib/download-file'
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

const REPORT_CARD_FILENAME = safeFileName('Report Card UT3 DSO2024058', 'html')

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * STU-F — the REAL report card document. Same standalone-HTML approach as
 * the certificate / fee-receipt downloads: inline CSS only, no CDN
 * dependencies, print-ready via the browser. Every value derives from
 * examResults + the school mock + the canonical roster identity (STU-58).
 */
function buildReportCardHTML(identity: {
  name: string; admissionNo: string; classSection: string; rollNo: string
}): string {
  const r = examResults
  const rows = r.studentResults
    .map((s) => {
      const pct = ((s.obtained / s.maxMarks) * 100).toFixed(1)
      return `<tr><td>${esc(s.subject)}</td><td class="c">${s.maxMarks}</td><td class="c">${s.obtained}</td><td class="c">${pct}%</td><td class="c">${esc(s.grade)}</td></tr>`
    })
    .join('')
  const issuedOn = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Report Card — Unit Test 3 — ${esc(identity.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; margin: 40px auto; max-width: 720px; color: #1e293b; }
  .letterhead { text-align: center; border-bottom: 3px double #6d28d9; padding-bottom: 14px; margin-bottom: 22px; }
  .school { font-size: 22px; font-weight: bold; color: #0f172a; letter-spacing: 0.02em; }
  .aff { font-size: 11px; color: #475569; margin-top: 4px; }
  .contact { font-size: 10px; color: #64748b; margin-top: 2px; }
  h1 { text-align: center; font-size: 15px; letter-spacing: 0.25em; margin: 18px 0 6px; color: #0f172a; }
  .docmeta { display: flex; justify-content: space-between; font-size: 10px; color: #64748b; margin: 0 0 16px; font-family: ui-monospace, monospace; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  table.data th, table.data td { border: 1px solid #94a3b8; padding: 7px 10px; font-size: 12px; }
  table.data thead th { background: #f5f3ff; color: #6d28d9; text-align: left; }
  table.data tfoot th, table.data tfoot td { background: #f5f3ff; color: #4c1d95; font-weight: bold; }
  .c { text-align: center; }
  table.meta td, table.meta th { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 12px; }
  table.meta th { background: #f8fafc; text-align: left; width: 30%; color: #475569; }
  .summary { display: flex; gap: 10px; margin: 14px 0; flex-wrap: wrap; }
  .summary div { flex: 1; min-width: 120px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; text-align: center; font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; }
  .summary strong { display: block; font-size: 16px; color: #0f172a; margin-top: 3px; text-transform: none; letter-spacing: 0; }
  .remarks { border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 14px; font-size: 12px; margin: 14px 0; background: #f8fafc; line-height: 1.5; }
  .remarks .by { margin-top: 8px; color: #64748b; font-size: 11px; }
  .sign { display: flex; justify-content: space-between; margin-top: 56px; }
  .sign div { text-align: center; font-size: 12px; color: #0f172a; }
  .sign .line { border-top: 1px solid #334155; width: 230px; margin: 0 auto 6px; padding-top: 8px; font-weight: bold; }
  .sign .role { color: #64748b; font-size: 10px; margin-top: 2px; }
  @media print { body { margin: 10mm auto; } }
</style>
</head>
<body>
  <div class="letterhead">
    <div class="school">${esc(school.name)}</div>
    <div class="aff">${esc(school.affiliation)}</div>
    <div class="contact">${esc(school.address)}</div>
  </div>
  <h1>STUDENT REPORT CARD</h1>
  <div class="docmeta"><span>Unit Test 3 · November 2024</span><span>Issued ${issuedOn}</span></div>
  <table class="meta">
    <tr><th>Student Name</th><td>${esc(identity.name)}</td></tr>
    <tr><th>Admission No</th><td>${esc(identity.admissionNo)}</td></tr>
    <tr><th>Class / Section</th><td>${esc(identity.classSection)}</td></tr>
    <tr><th>Roll No</th><td>${esc(identity.rollNo)}</td></tr>
    <tr><th>Examination</th><td>Unit Test 3 · November 2024</td></tr>
  </table>
  <table class="data">
    <thead>
      <tr><th>Subject</th><th class="c">Max Marks</th><th class="c">Obtained</th><th class="c">Percentage</th><th class="c">Grade</th></tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><th>Total</th><th class="c">${r.maxTotal}</th><th class="c">${r.total}</th><th class="c">${r.percentage}%</th><th class="c">${esc(r.grade)}</th></tr>
    </tfoot>
  </table>
  <div class="summary">
    <div>Total Marks<strong>${r.total} / ${r.maxTotal}</strong></div>
    <div>Percentage<strong>${r.percentage}%</strong></div>
    <div>Overall Grade<strong>${esc(r.grade)}</strong></div>
    <div>Class Rank<strong>#${r.rank} / ${r.totalStudents}</strong></div>
  </div>
  <div class="remarks">
    <strong>Class Teacher's Remarks</strong><br />
    ${esc(r.remarks)}
    <div class="by">— Rohan Mehta, Class Teacher</div>
  </div>
  <div class="sign">
    <div><div class="line">Rohan Mehta</div><div class="role">Class Teacher</div></div>
    <div><div class="line">${esc(school.principal)}</div><div class="role">Principal</div></div>
  </div>
</body>
</html>`
}

export function ResultsModule() {
  const r = examResults
  // STU-F — identity from the ONE canonical roster (STU-58).
  const student = useStudentsStore((s) => s.students.find((x) => x.id === DEMO_STUDENT_ID))

  const handleDownloadReportCard = () => {
    const html = buildReportCardHTML({
      name: student?.name ?? 'Aarav Sharma',
      admissionNo: student?.admissionNo ?? 'DSO2024058',
      classSection: `${student?.className ?? 'Class 2'}-${student?.section ?? 'A'}`,
      rollNo: student?.rollNo ?? '18',
    })
    downloadHTMLFile(html, REPORT_CARD_FILENAME)
    toast.success('Report card downloaded', { description: `${REPORT_CARD_FILENAME} — open it and print directly.` })
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="My Results"
        subtitle="Unit Test 3 · November 2024 · Class 2-A"
        icon={<Award className="h-5 w-5" />}
        action={
          <Button
            onClick={handleDownloadReportCard}
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
