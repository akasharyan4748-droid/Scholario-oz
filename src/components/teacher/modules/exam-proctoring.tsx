'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardCheck, Calendar, Clock, Users, DoorOpen, Ticket, Plus,
  ChevronRight, CheckCircle2, X, MapPin, FileText, AlertTriangle,
  Download, Sparkles, Grid3x3,
} from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, BarTrend, Donut } from '@/components/shared/charts'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { examSlots, seatingArrangements, invigilationDuties, hallTickets, proctoringStats } from '@/lib/mock/proctoring'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Tab = 'schedule' | 'seating' | 'duties' | 'tickets'

const examStatusConfig = {
  Scheduled: { variant: 'info' as const, color: 'text-sky-600 bg-sky-500/10' },
  Ongoing: { variant: 'warning' as const, color: 'text-amber-600 bg-amber-500/10' },
  Completed: { variant: 'success' as const, color: 'text-emerald-600 bg-emerald-500/10' },
}

const ticketStatusConfig = {
  Generated: { variant: 'neutral' as const, color: 'bg-muted text-muted-foreground' },
  Printed: { variant: 'info' as const, color: 'bg-sky-500/15 text-sky-600' },
  Distributed: { variant: 'success' as const, color: 'bg-emerald-500/15 text-emerald-600' },
}

export function ExamProctoringModule() {
  const [tab, setTab] = useState<Tab>('schedule')

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Exam Proctoring"
        subtitle="Hall tickets, seating arrangements & invigilation duties"
        icon={<ClipboardCheck className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('Hall tickets generated', { description: '108 tickets ready for distribution' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-amber-500/20"
          >
            <Ticket className="h-3.5 w-3.5" /> Generate Tickets
          </button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Upcoming Exams" value={proctoringStats.upcomingExams} icon={<Calendar className="h-5 w-5" />} accent="amber" trendLabel={`${proctoringStats.totalStudents} students`} delay={0} />
        <KpiCard label="Rooms Allocated" value={proctoringStats.roomsAllocated} icon={<DoorOpen className="h-5 w-5" />} accent="violet" trendLabel={`${proctoringStats.invigilatorsAssigned} invigilators`} delay={0.05} />
        <KpiCard label="Hall Tickets" value={proctoringStats.hallTicketsGenerated} icon={<Ticket className="h-5 w-5" />} accent="emerald" trendLabel="generated" delay={0.1} />
        <KpiCard label="Attendance Rate" value={proctoringStats.attendanceRate} suffix="%" icon={<CheckCircle2 className="h-5 w-5" />} accent="cyan" trendLabel={`${proctoringStats.malpracticeReports} incidents`} delay={0.15} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard title="Exams per Month" subtitle="This academic year" className="lg:col-span-2">
          <BarTrend data={proctoringStats.monthlyExams} xKey="month" yKey="count" color="oklch(0.65 0.16 75)" height={220} />
        </ChartCard>
        <ChartCard title="Room Utilization" subtitle="Students per room">
          <Donut data={proctoringStats.roomUtilization} centerValue={`${proctoringStats.totalStudents}`} centerLabel="students" height={220} />
        </ChartCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'schedule' as Tab, label: 'Exam Schedule', icon: <Calendar className="h-3.5 w-3.5" />, count: examSlots.length },
          { id: 'seating' as Tab, label: 'Seating', icon: <Grid3x3 className="h-3.5 w-3.5" />, count: seatingArrangements.length },
          { id: 'duties' as Tab, label: 'Invigilation', icon: <ClipboardCheck className="h-3.5 w-3.5" />, count: invigilationDuties.length },
          { id: 'tickets' as Tab, label: 'Hall Tickets', icon: <Ticket className="h-3.5 w-3.5" />, count: hallTickets.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all',
              tab === t.id ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'glass text-muted-foreground hover:text-foreground'
            )}
          >
            {t.icon}
            {t.label}
            <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold', tab === t.id ? 'bg-primary-foreground/20' : 'bg-muted')}>{t.count}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'schedule' && (
          <motion.div key="sc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {examSlots.map((e, i) => {
              const cfg = examStatusConfig[e.status]
              return (
                <motion.div key={e.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard className="p-0 overflow-hidden h-full hover:shadow-premium-lg transition-shadow">
                    <div className={cn('relative h-20 bg-gradient-to-br p-4 text-white', e.gradient)}>
                      <div className="absolute inset-0 bg-grid opacity-20" />
                      <div className="relative flex items-start justify-between">
                        <div>
                          <p className="text-[10px] text-white/80 font-medium uppercase tracking-wide">{e.exam}</p>
                          <p className="font-semibold text-sm leading-tight mt-0.5">{e.subject}</p>
                        </div>
                        <span className={cn('flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold bg-white/15 backdrop-blur')}>{e.status}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3 w-3" /> {formatDate(e.date)}</div>
                        <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3 w-3" /> {e.time} · {e.duration}</div>
                        <div className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-3 w-3" /> {e.students} students</div>
                        <div className="flex items-center gap-1.5 text-muted-foreground"><DoorOpen className="h-3 w-3" /> {e.rooms} rooms</div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {e.classes.map((c) => (
                          <span key={c} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">{c}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="text-[10px] text-muted-foreground">{e.invigilators} invigilators</span>
                        <span className={cn('flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold', cfg.color)}>{cfg && e.status}</span>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {tab === 'seating' && (
          <motion.div key="st" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
            {seatingArrangements.map((s, i) => {
              const pct = Math.round((s.allocated / s.capacity) * 100)
              return (
                <motion.div key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard className="p-3 sm:p-4 lg:p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
                          <DoorOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{s.room}</p>
                          <p className="text-[11px] text-muted-foreground">{s.exam}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-bold">{s.allocated}/{s.capacity}</p>
                        <p className="text-[10px] text-muted-foreground">{pct}% filled</p>
                      </div>
                    </div>

                    {/* Seating grid visualization */}
                    <div className="rounded-xl border border-border bg-card/30 p-3 mb-3">
                      <p className="text-[10px] text-muted-foreground mb-2 text-center">Blackboard ↑ · Front of Room</p>
                      <div className="space-y-1.5">
                        {Array.from({ length: s.rows }).map((_, rowIdx) => (
                          <div key={rowIdx} className="flex justify-center gap-1.5">
                            {Array.from({ length: s.cols }).map((_, colIdx) => {
                              const seatNum = rowIdx * s.cols + colIdx + 1
                              const isOccupied = seatNum <= s.allocated
                              return (
                                <motion.div
                                  key={colIdx}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: (rowIdx * s.cols + colIdx) * 0.015 }}
                                  className={cn(
                                    'flex h-7 w-7 items-center justify-center rounded-md text-[9px] font-bold',
                                    isOccupied ? 'bg-violet-500/20 text-violet-600 ring-1 ring-violet-500/30' : 'bg-muted text-muted-foreground/40'
                                  )}
                                  title={`Seat ${seatNum} — ${isOccupied ? 'Occupied' : 'Empty'}`}
                                >
                                  {seatNum}
                                </motion.div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 text-center">Invigilator: {s.invigilator}</p>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {tab === 'duties' && (
          <motion.div key="dt" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
            {invigilationDuties.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <GradientAvatar name={d.teacher} initials={d.avatar} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{d.teacher}</p>
                        <StatusBadge status={d.status} variant={d.status === 'Completed' ? 'success' : d.status === 'Ongoing' ? 'warning' : 'info'} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{d.exam} · {d.subject}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {formatDate(d.date)}</span>
                        <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {d.time} · {d.duration}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {d.room}</span>
                      </div>
                      {d.report && (
                        <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-600 mb-0.5">Post-Exam Report</p>
                          <p className="text-xs italic">"{d.report}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === 'tickets' && (
          <motion.div key="tk" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
            {hallTickets.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <GlassCard className="p-3 sm:p-4 lg:p-5">
                  {/* Hall ticket card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <GradientAvatar name={t.studentName} initials={t.avatar} size="md" />
                      <div>
                        <p className="font-semibold text-sm">{t.studentName}</p>
                        <p className="text-[11px] text-muted-foreground">Roll #{t.rollNo} · {t.className}</p>
                      </div>
                    </div>
                    <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-semibold', ticketStatusConfig[t.status].color)}>{t.status}</span>
                  </div>

                  <div className="rounded-xl border-2 border-dashed border-border bg-card/30 p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                          <span className="font-display text-xs font-bold">G</span>
                        </div>
                        <span className="text-[10px] font-bold">Demo School · {t.exam}</span>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">{t.id}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div>
                        <p className="text-muted-foreground">Room</p>
                        <p className="font-bold">{t.room}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Seat</p>
                        <p className="font-bold">{t.seatNo}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Roll</p>
                        <p className="font-bold">#{t.rollNo}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    {t.subjects.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] rounded bg-muted/40 px-2 py-1">
                        <span className="font-medium">{s.subject}</span>
                        <span className="text-muted-foreground">{formatDate(s.date)} · {s.time}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => toast.success('Downloaded', { description: `${t.studentName}'s hall ticket` })} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors">
                      <Download className="h-3 w-3" /> Download
                    </button>
                    <button onClick={() => toast.success('Printed', { description: 'Sent to printer' })} className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-[11px] font-medium hover:bg-accent transition-colors">
                      <FileText className="h-3 w-3" /> Print
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
