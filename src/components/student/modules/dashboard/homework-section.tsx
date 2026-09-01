'use client'

import { motion } from 'framer-motion'
import {
  BookOpen, ClipboardList, BookMarked,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { assignments, homeworks } from '@/lib/mock/academics'
import { issuedBooks } from '@/lib/mock/operations'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'

interface HomeworkSectionProps {
  pendingHomework: typeof homeworks
  dueAssignments: typeof assignments
  libraryId: string
}

export function HomeworkSection({ pendingHomework, dueAssignments, libraryId }: HomeworkSectionProps) {
  const myIssuedBook = issuedBooks.find((b) => b.admissionNo === 'DSO2025018')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* My homework */}
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-500" /> My Homework
          </h3>
          <StatusBadge status={`${pendingHomework.length} pending`} variant="warning" />
        </div>
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {pendingHomework.map((h, i) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border bg-card/40 p-3 hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-sm leading-tight">{h.title}</p>
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full px-2 py-0.5 shrink-0">
                  Due {new Date(h.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{h.subject} · {h.assignedBy}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Assignments due soon */}
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-violet-500" /> Assignments Due
          </h3>
          <StatusBadge status={`${dueAssignments.length} to submit`} variant="info" />
        </div>
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {dueAssignments.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border bg-card/40 p-3 hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-sm leading-tight">{a.title}</p>
                <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 rounded-full px-2 py-0.5 shrink-0">
                  {a.marks} marks
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{a.subject} · Due {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            </motion.div>
          ))}
          {assignments.filter((a) => a.status === 'Graded').map((a) => (
            <div key={a.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-sm leading-tight">{a.title}</p>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5 shrink-0">
                  {a.obtainedMarks}/{a.marks}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{a.subject} · Graded</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Library book */}
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-cyan-500" /> My Library
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">{libraryId}</span>
        </div>
        {myIssuedBook && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent p-3"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 text-white">
                <BookMarked className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{myIssuedBook.book}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Issued {formatDate(myIssuedBook.issueDate)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status="Overdue" variant="danger" dot />
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Fine: ₹{myIssuedBook.fine}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => toast.info('Library book return requested. Please visit the library counter.', { description: 'Librarian: Geeta Sharma' })}
              className="mt-3 w-full rounded-lg bg-primary/10 text-primary text-xs font-semibold py-2 hover:bg-primary/15 transition-colors"
            >
              Return Book
            </button>
          </motion.div>
        )}
        <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Books read this term</span><span className="font-semibold">12</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Reading streak</span><span className="font-semibold text-emerald-600">7 days 🔥</span></div>
        </div>
      </GlassCard>
    </div>
  )
}
