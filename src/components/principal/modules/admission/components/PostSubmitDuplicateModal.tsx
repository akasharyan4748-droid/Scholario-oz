'use client'

/**
 * Post-Submit Duplicate Detection Modal.
 * Extracted from the original admission.tsx monolith (Task ID: 21).
 *
 * Shown after the user clicks "Submit Application" when a likely duplicate
 * existing record is detected. Lets the principal cancel, view the existing
 * record, or override (continue anyway) when allowed.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, AlertTriangle, X, Eye, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DuplicateMatch } from '../lib/admission-utils'

export function PostSubmitDuplicateModal({
  postSubmitDup,
  onCancel,
  onContinueAnyway,
}: {
  postSubmitDup: DuplicateMatch | null
  onCancel: () => void
  onContinueAnyway: () => void
}) {
  return (
    <AnimatePresence>
      {postSubmitDup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-premium-lg overflow-hidden"
          >
            <div className={cn('p-4 border-b flex items-center gap-3', postSubmitDup.matchType === 'block' ? 'border-rose-500/30 bg-rose-500/5' : 'border-amber-500/30 bg-amber-500/5')}>
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shrink-0', postSubmitDup.matchType === 'block' ? 'bg-rose-500/15 text-rose-600' : 'bg-amber-500/15 text-amber-600')}>
                {postSubmitDup.matchType === 'block' ? <ShieldAlert className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-sm">{postSubmitDup.matchType === 'block' ? 'Duplicate Record Found' : 'Possible Existing Record'}</h3>
                <p className="text-[11px] text-muted-foreground">{postSubmitDup.score}% match · {postSubmitDup.matchedFields.join(', ')}</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Existing Record</span>
                  <Badge variant="outline" className="text-[9px]">{postSubmitDup.existingRecord.source === 'student' ? 'Enrolled Student' : 'Active Application'}</Badge>
                </div>
                <p className="text-sm font-semibold">{postSubmitDup.existingRecord.name}</p>
                <p className="text-[11px] text-muted-foreground">{postSubmitDup.existingRecord.className} · {postSubmitDup.existingRecord.admissionNo || postSubmitDup.existingRecord.id}</p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {postSubmitDup.matchType === 'block'
                  ? 'This application matches an existing record. Please review the existing entry before proceeding.'
                  : 'A similar record exists. You can continue anyway with principal override, or cancel to review first.'}
              </p>
            </div>
            <div className="p-4 border-t border-border flex flex-col sm:flex-row gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={onCancel} className="text-xs gap-1.5">
                <X className="h-3.5 w-3.5" /> Cancel Submission
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast.info('Opening existing record', { description: postSubmitDup.existingRecord.name })} className="text-xs gap-1.5">
                <Eye className="h-3.5 w-3.5" /> View Existing
              </Button>
              <Button size="sm" onClick={onContinueAnyway} disabled={postSubmitDup.matchType === 'block'} className="text-xs gap-1.5 bg-primary text-primary-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" /> Continue Anyway
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
