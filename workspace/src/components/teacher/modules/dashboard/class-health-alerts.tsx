'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, AlertCircle, Megaphone, ArrowUpRight, CheckCircle2,
} from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { students } from '@/lib/mock/students'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ClassHealthAlertsProps {
  onNavigate: (key: string) => void
}

interface AtRiskStudent { id: string; name: string; att: number; contacted: boolean }
interface ParentQuery { id: string; name: string; topic: string; read: boolean }
interface Deadline { id: string; task: string; days: string; done: boolean }

export function ClassHealthAlerts({ onNavigate }: ClassHealthAlertsProps) {
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([
    { id: 's1', name: 'Reyansh Kumar', att: 78, contacted: false },
    { id: 's2', name: 'Kabir Singh', att: 76, contacted: false },
    { id: 's3', name: 'Aanya Reddy', att: 79, contacted: false },
  ])
  const [parentQueries, setParentQueries] = useState<ParentQuery[]>([
    { id: 'p1', name: 'Mrs. Patel', topic: 'Diya\'s grades', read: false },
    { id: 'p2', name: 'Mr. Sharma', topic: 'Homework load', read: false },
    { id: 'p3', name: 'Mrs. Iyer', topic: 'PTM slot', read: false },
    { id: 'p4', name: 'Mr. Reddy', topic: 'Bus route', read: false },
  ])
  const [deadlines, setDeadlines] = useState<Deadline[]>([
    { id: 'd1', task: 'Algebra WS-4', days: 'Tomorrow', done: false },
    { id: 'd2', task: 'Science Quiz', days: '2 days', done: false },
    { id: 'd3', task: 'Comp. Sci Lab', days: '3 days', done: false },
    { id: 'd4', task: 'Geometry Test', days: '4 days', done: false },
  ])

  const handleContactParent = (student: AtRiskStudent) => {
    setAtRiskStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, contacted: true } : s))
    toast.success('Parent contacted', { description: `Message sent to ${student.name}'s parent regarding ${student.att}% attendance` })
  }

  const handleOpenStudent = (student: AtRiskStudent) => {
    toast.info('Opening student profile', { description: `Loading ${student.name}'s details` })
    onNavigate('students')
  }

  const handleReplyQuery = (query: ParentQuery) => {
    setParentQueries((prev) => prev.map((q) => q.id === query.id ? { ...q, read: true } : q))
    toast.success('Opening messaging', { description: `Reply to ${query.name} about ${query.topic}` })
    onNavigate('communication')
  }

  const handleMarkDeadlineDone = (deadline: Deadline) => {
    setDeadlines((prev) => prev.map((d) => d.id === deadline.id ? { ...d, done: true } : d))
    toast.success('Marked as done', { description: deadline.task })
  }

  const activeAtRisk = atRiskStudents.filter((s) => !s.contacted).length
  const activeQueries = parentQueries.filter((q) => !q.read).length
  const activeDeadlines = deadlines.filter((d) => !d.done).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard className="relative overflow-hidden p-4 sm:p-5 lg:p-6 border-l-4 border-l-amber-500">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <Header onNavigate={onNavigate} />
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-3">
          <AtRiskColumn
            count={activeAtRisk}
            students={atRiskStudents}
            onContact={handleContactParent}
            onOpen={handleOpenStudent}
          />
          <ParentQueriesColumn
            count={activeQueries}
            queries={parentQueries}
            onReply={handleReplyQuery}
          />
          <DeadlinesColumn
            count={activeDeadlines}
            deadlines={deadlines}
            onNavigate={onNavigate}
            onMarkDone={handleMarkDeadlineDone}
          />
        </div>
      </GlassCard>
    </motion.div>
  )
}

function Header({ onNavigate }: { onNavigate: (key: string) => void }) {
  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div className="flex items-start gap-3.5">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25"
        >
          <Sparkles className="h-5 w-5" />
        </motion.div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base sm:text-lg font-bold tracking-tight">Class Health Alerts</h3>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Needs Attention
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Students flagged for attendance or performance dips · {students.length} total in Class 2-A
          </p>
        </div>
      </div>
      <button
        onClick={() => onNavigate('students')}
        className="shrink-0 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
      >
        View All Students
      </button>
    </div>
  )
}

function AtRiskColumn({
  count, students, onContact, onOpen,
}: {
  count: number
  students: AtRiskStudent[]
  onContact: (s: AtRiskStudent) => void
  onOpen: (s: AtRiskStudent) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">At-Risk</span>
        </div>
        <span className="font-display text-xl font-bold text-rose-600 dark:text-rose-400">{count}</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2">Attendance below 80%</p>
      <div className="space-y-1.5">
        {students.map((s) => (
          <div
            key={s.id}
            className={cn(
              'group flex items-center justify-between text-xs rounded-md px-1.5 py-1 transition-colors',
              s.contacted ? 'opacity-50 line-through' : 'hover:bg-rose-500/10 cursor-pointer'
            )}
            onClick={() => !s.contacted && onOpen(s)}
            title={s.contacted ? 'Parent contacted' : `Click to open ${s.name}'s profile`}
          >
            <span className="font-medium truncate">{s.name}</span>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className="font-mono text-rose-600 dark:text-rose-400">{s.att}%</span>
              {!s.contacted ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onContact(s) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex h-5 w-5 items-center justify-center rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25"
                  title="Contact parent"
                >
                  <Megaphone className="h-3 w-3" />
                </button>
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function ParentQueriesColumn({
  count, queries, onReply,
}: {
  count: number
  queries: ParentQuery[]
  onReply: (q: ParentQuery) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.38 }}
      className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Megaphone className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Parent Queries</span>
        </div>
        <span className="font-display text-xl font-bold text-amber-600 dark:text-amber-400">{count}</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2">Awaiting your response</p>
      <div className="space-y-1.5">
        {queries.map((m) => (
          <div
            key={m.id}
            className={cn(
              'group flex items-center justify-between text-xs rounded-md px-1.5 py-1 transition-colors',
              m.read ? 'opacity-50' : 'hover:bg-amber-500/10 cursor-pointer'
            )}
            onClick={() => !m.read && onReply(m)}
            title={m.read ? 'Replied' : `Click to reply to ${m.name}`}
          >
            <span className="font-medium truncate">{m.name}</span>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className="text-muted-foreground truncate">{m.topic}</span>
              {!m.read && (
                <ArrowUpRight className="h-3 w-3 text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              {m.read && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function DeadlinesColumn({
  count, deadlines, onNavigate, onMarkDone,
}: {
  count: number
  deadlines: Deadline[]
  onNavigate: (key: string) => void
  onMarkDone: (d: Deadline) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.46 }}
      className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Due Soon</span>
        </div>
        <span className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">{count}</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2">Assignments due this week</p>
      <div className="space-y-1.5">
        {deadlines.map((d) => (
          <div
            key={d.id}
            className={cn(
              'group flex items-center justify-between text-xs rounded-md px-1.5 py-1 transition-colors',
              d.done ? 'opacity-50 line-through' : 'hover:bg-emerald-500/10 cursor-pointer'
            )}
            onClick={() => !d.done && onNavigate('assignments')}
            title={d.done ? 'Completed' : `Click to view assignments`}
          >
            <span className="font-medium truncate">{d.task}</span>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className="text-muted-foreground">{d.days}</span>
              {!d.done ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onMarkDone(d) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex h-5 w-5 items-center justify-center rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                  title="Mark as done"
                >
                  <CheckCircle2 className="h-3 w-3" />
                </button>
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
