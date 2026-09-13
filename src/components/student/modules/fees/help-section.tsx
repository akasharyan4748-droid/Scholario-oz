'use client'

/**
 * fees/help-section — GET HELP (FEES-R §18–19, §45).
 *
 * Progressive disclosure: one quiet "Get help" affordance expands into the
 * three honest routes —
 *   (a) Accounts Office  → payment, ledger & receipt questions. Checks the
 *       existing secure messaging store for an accounts/office thread; with
 *       none configured it shows the school's office contact line (School
 *       Settings is the configuration source) and routes formal questions
 *       to the fee-request flow.
 *   (b) Class Teacher    → class-related concerns. Reuses the CENTRAL
 *       messaging system (student-messaging-store.startConversation) —
 *       Fees only creates a contextual entry point, never a second
 *       messaging system (§47). The teacher receives the student's
 *       message, NOT the fee ledger.
 *   (c) School review    → escalation via a formal fee request.
 *
 * Every route is honest about what is wired: no dead buttons.
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, ChevronDown, HelpCircle, Landmark, Mail, Phone, Send, UserRound } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useStudentMessagingStore } from '@/lib/store/student-messaging-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { school as schoolFallback } from '@/lib/mock/school'
import { teachers } from '@/lib/mock/teachers'
import { DEMO_STUDENT_ID } from '../applications/student'

interface HelpSectionProps {
  /** Opens the fee-request form (route a + c land there). */
  onRaiseRequest: () => void
}

export function HelpSection({ onRaiseRequest }: HelpSectionProps) {
  const [open, setOpen] = useState(false)
  const [classMessage, setClassMessage] = useState('')

  // ── Central messaging store (reused — never a second system) ────────
  const startConversation = useStudentMessagingStore((s) => s.startConversation)
  const conversations = useStudentMessagingStore((s) => s.conversations)

  // ── Class teacher from the canonical roster ─────────────────────────
  const student = useStudentsStore((s) => s.students.find((x) => x.id === DEMO_STUDENT_ID))
  const classes = useStudentsStore((s) => s.classes)
  const classTeacher = useMemo(() => {
    if (!student) return null
    const cls = classes.find((c) => c.id === student.classId)
    const tid = cls?.sections.find((s) => s.name === student.section)?.classTeacherId ?? cls?.classTeacherId
    const t = tid ? teachers.find((x) => x.id === tid) : undefined
    return t ? { id: t.id, name: t.name, subject: t.department } : null
  }, [student, classes])

  // ── Accounts/office thread in the existing messaging system ─────────
  // Honest check: only an actual accounts/office conversation counts.
  const accountsConversation = useMemo(
    () => conversations.find((c) => /accounts|office|finance/i.test(`${c.teacherName} ${c.subject}`)) ?? null,
    [conversations],
  )

  // ── Office contact from School Settings (configuration source) ──────
  const general = useSchoolSettingsStore((s) => s.general)
  const officePhone = general?.phone || schoolFallback.phone
  const officeEmail = general?.email || schoolFallback.email

  const messageTooShort = classMessage.trim().length < 10

  const sendToClassTeacher = () => {
    if (!classTeacher) return
    const res = startConversation({
      teacherId: classTeacher.id,
      teacherName: classTeacher.name,
      teacherSubject: classTeacher.subject,
      // Context attached, minimum-necessary information (§19) — the
      // teacher sees this message, never the fee ledger itself.
      subject: 'Fee question',
      body: classMessage.trim(),
    })
    if (!res.ok) {
      toast.error('Could not send the message', { description: res.error })
      return
    }
    setClassMessage('')
    setOpen(false)
    toast.success(`Message sent to ${classTeacher.name}`, {
      description: 'Continue the thread in your Messages module — replies come from the teacher.',
    })
  }

  return (
    <GlassCard className="p-4 sm:p-5" data-testid="fee-help">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" aria-hidden>
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
          Questions about your fees?
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="fee-help-routes"
          className="h-10 gap-1.5 border-cyan-500/30 text-cyan-700 hover:bg-cyan-500/[0.06] hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300"
        >
          {open ? 'Close' : 'Get help'}
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
        </Button>
      </div>

      {!open && (
        <p className="mt-2 text-xs text-muted-foreground">
          Payment, ledger and receipt questions route to the right person.
        </p>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="fee-help-routes"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {/* ── Route (a): Accounts Office ───────────────────────── */}
              <div className="rounded-xl border border-border bg-card/60 p-3.5">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" aria-hidden>
                    <Landmark className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">Accounts Office</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Payment, ledger and receipt questions</p>
                    {accountsConversation ? (
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        You have an existing thread with the office — continue it in your{' '}
                        <span className="font-medium text-foreground">Messages</span> module.
                      </p>
                    ) : (
                      <>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" aria-hidden /> {officePhone}</span>
                          <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" aria-hidden /> {officeEmail}</span>
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onRaiseRequest}
                          className="mt-2.5 h-10 gap-1.5 text-[11px]"
                        >
                          Raise a fee request
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Route (b): Class Teacher (central messaging) ─────── */}
              <div className="rounded-xl border border-border bg-card/60 p-3.5">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400" aria-hidden>
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">
                      Class Teacher{classTeacher ? ` — ${classTeacher.name}` : ''}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Class-related concerns (uses your secure Messages thread)</p>
                    {classTeacher ? (
                      <>
                        <label htmlFor="fee-help-class-message" className="sr-only">
                          Message to {classTeacher.name} about a fee question
                        </label>
                        <Textarea
                          id="fee-help-class-message"
                          value={classMessage}
                          onChange={(e) => setClassMessage(e.target.value)}
                          placeholder={`Write your question for ${classTeacher.name}…`}
                          className="mt-2.5 min-h-[72px] text-xs"
                          rows={3}
                        />
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[10px] text-muted-foreground">
                            The teacher sees your message — not your fee ledger.
                          </p>
                          <Button
                            size="sm"
                            onClick={sendToClassTeacher}
                            disabled={messageTooShort}
                            className="h-10 gap-1.5 text-[11px]"
                          >
                            <Send className="h-3.5 w-3.5" aria-hidden /> Send
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Your class teacher isn't listed on the roster — please ask at the school office.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Route (c): School review (escalation) ────────────── */}
              <div className="rounded-xl border border-border bg-card/60 p-3.5">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400" aria-hidden>
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">Need escalation?</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Unresolved, or needs a school decision — raise a formal request and follow its timeline here.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRaiseRequest}
                      className="mt-2.5 h-10 gap-1.5 text-[11px]"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> Request school review
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
