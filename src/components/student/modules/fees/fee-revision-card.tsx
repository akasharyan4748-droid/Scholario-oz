'use client'

/**
 * FeeRevisionApprovalCard — the STUDENT/GUARDIAN side of the mid-session
 * fee-structure acknowledgement (PART 12/13 of the finance refinement).
 *
 * When the Principal submits a revision of the CURRENT session's fee
 * structure for this student's class, every affected student/guardian
 * sees exactly WHAT CHANGED (previous → proposed per fee head) with an
 * effective date, then Approve/Acknowledge or Decline. The revision only
 * reaches the 60% publication threshold through these responses — the
 * published structure keeps applying until then.
 *
 * Deliberately minimal: no comments, no discussion — a clear change
 * summary plus two buttons, exactly as the spec requires.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, Check, ShieldAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFeeStore, STRUCTURE_APPROVAL_THRESHOLD } from '@/lib/store/fee-store'
import type { StructureRevision } from '@/lib/store/fee-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface HeadChange {
  name: string
  old: number | null
  new: number | null
}

function diffHeads(previous: StructureRevision['previousHeads'], proposed: StructureRevision['proposedHeads']): HeadChange[] {
  const out: HeadChange[] = []
  for (const h of proposed) {
    const old = previous.find((x) => x.id === h.id)
    if (!old) out.push({ name: h.name, old: null, new: h.amount })
    else if (old.amount !== h.amount) out.push({ name: h.name, old: old.amount, new: h.amount })
  }
  for (const old of previous) {
    if (!proposed.some((h) => h.id === old.id)) out.push({ name: old.name, old: old.amount, new: null })
  }
  return out
}

export function FeeRevisionApprovalCard({ canonicalStudentId }: { canonicalStudentId: string }) {
  const revisions = useFeeStore((s) => s.structureRevisions)
  const respond = useFeeStore((s) => s.respondStructureRevision)

  // The ONE active revision affecting this student's class that they have
  // not responded to yet. (Structures bound by classId; class-name fallback.)
  const pending = useMemo(() => {
    const me = useStudentsStore.getState().students.find((s) => s.id === canonicalStudentId)
    if (!me) return null
    return revisions.find((r) =>
      (r.status === 'Pending Approval' || r.status === 'Threshold Reached')
      && r.affectedStudentIds.includes(canonicalStudentId)
      && !r.responses[canonicalStudentId],
    ) ?? null
  }, [revisions, canonicalStudentId])

  const myResponse = useMemo(() => {
    const mine = revisions.find(
      (r) => (r.status === 'Pending Approval' || r.status === 'Threshold Reached')
        && r.affectedStudentIds.includes(canonicalStudentId)
        && r.responses[canonicalStudentId],
    )
    return mine ? { revision: mine, response: mine.responses[canonicalStudentId] } : null
  }, [revisions, canonicalStudentId])

  const respondTo = (accept: boolean, revision: StructureRevision) => {
    const res = respond(revision.id, canonicalStudentId, accept)
    if (!res.success) {
      toast.error('Could not record your response', { description: res.error })
      return
    }
    toast.success(accept ? 'Acknowledgement recorded — thank you' : 'Response recorded', {
      description: res.thresholdReached
        ? 'The 60% acknowledgement threshold is now reached — the Principal can publish the revision.'
        : 'The school records every guardian response for this revision.',
    })
  }

  if (pending) {
    const changes = diffHeads(pending.previousHeads, pending.proposedHeads)
    const approved = Object.values(pending.responses).filter((v) => v === 'Approved').length
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        data-testid="fee-revision-card"
        className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4 space-y-3"
        role="region"
        aria-label="Fee structure revision awaiting acknowledgement"
      >
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" /> Fee Structure Revision — {pending.className}
            </p>
            <p className="text-[10px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
              {pending.academicYear} · proposed v{pending.toVersion} · effective {formatDate(pending.effectiveFrom)}
              {pending.reason ? ` — ${pending.reason}` : ''}
            </p>
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-full px-2 py-0.5 shrink-0">
            Your acknowledgement required
          </span>
        </div>

        {/* What changed — previous vs proposed (PART 13) */}
        <div className="rounded-lg border border-amber-500/20 bg-card px-3 py-2.5 space-y-1">
          {changes.map((c) => (
            <div key={c.name} className="flex items-center justify-between text-[11px] tabular-nums">
              <span className="font-medium">{c.name}</span>
              <span className="text-muted-foreground flex items-center gap-1.5">
                {formatINR(c.old ?? 0)}
                {c.new !== null ? (
                  <>
                    <ArrowRightGlyph up={(c.new) > (c.old ?? 0)} />
                    <span className={cn('font-semibold', c.new > (c.old ?? 0) ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
                      {formatINR(c.new)}
                    </span>
                  </>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">removed</span>
                )}
              </span>
            </div>
          ))}
          <p className="text-[9px] text-muted-foreground border-t border-dashed border-border pt-1.5">
            Annual total {formatINR(pending.previousTotal, true)} → {formatINR(pending.proposedTotal, true)}.
            The current fee structure continues to apply until 60% of guardians approve.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-[10px] text-muted-foreground">
            {approved}/{pending.affectedStudentIds.length} guardians have acknowledged · {Math.ceil(pending.affectedStudentIds.length * STRUCTURE_APPROVAL_THRESHOLD)} needed
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm" variant="outline"
              className="h-8 text-xs gap-1 text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
              onClick={() => respondTo(false, pending)}
            >
              <X className="h-3 w-3" /> Decline
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => respondTo(true, pending)}
            >
              <Check className="h-3 w-3" /> Approve / Acknowledge
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  if (myResponse) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-2.5 flex items-center justify-between gap-2" data-testid="fee-revision-ack">
        <p className="text-[11px] text-muted-foreground truncate">
          Fee revision for <span className="font-medium text-foreground">{myResponse.revision.className}</span> — you {myResponse.response === 'Approved' ? 'approved' : 'declined'} this proposal.
        </p>
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0',
          myResponse.response === 'Approved' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
        )}>
          {myResponse.response === 'Approved' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {myResponse.response === 'Approved' ? 'Acknowledged' : 'Declined'}
        </span>
      </div>
    )
  }

  return null
}

function ArrowRightGlyph({ up }: { up: boolean }) {
  return up
    ? <ArrowUpRight className="h-3 w-3 text-rose-500" aria-label="increased" />
    : <ArrowDownRight className="h-3 w-3 text-emerald-500" aria-label="decreased" />
}
