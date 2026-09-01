'use client'

/**
 * Single document card used inside the Documents wizard step.
 * Extracted from the original admission.tsx monolith (Task ID: 21).
 *
 * Receives the document descriptor and its current verification status plus
 * the action handlers (upload / defer / verify) from the parent step.
 */
import {
  FileText, Paperclip, Sparkles, Eye, RefreshCw, Download, RotateCw, Crop,
  Minimize2, UploadCloud, Clock, ShieldCheck, AlertTriangle, AlertCircle,
  UserCheck, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DocStatus } from '../types'
import { DocActionButton } from './StepShared'

export interface DocDescriptor {
  key: string
  name: string
  description: string
  mandatory: boolean
}

export function DocumentCard({
  doc,
  st,
  verificationEnabled,
  onUploadClick,
  onDefer,
  onVerify,
}: {
  doc: DocDescriptor
  st: DocStatus
  verificationEnabled: boolean
  onUploadClick: (key: string) => void
  onDefer: (key: string) => void
  onVerify: (key: string) => void
}) {
  const isUploaded = st.status === 'uploaded'
  const isLater = st.status === 'later'
  const vStatus = st.verificationStatus
  const isVerified = verificationEnabled && isUploaded && vStatus === 'verified'
  const isRejected = verificationEnabled && isUploaded && vStatus === 'rejected'
  const isReplaceRequested = verificationEnabled && isUploaded && vStatus === 'replace_requested'
  const isPendingReview = verificationEnabled && isUploaded && (!vStatus || vStatus === 'pending')

  // Verification / upload state badge
  let vBadge: { label: string; className: string; Icon: typeof CheckCircle2 }
  if (verificationEnabled && isUploaded) {
    if (isVerified) vBadge = { label: 'Verified', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30', Icon: CheckCircle2 }
    else if (isRejected) vBadge = { label: 'Rejected', className: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30', Icon: AlertTriangle }
    else if (isReplaceRequested) vBadge = { label: 'Replace Requested', className: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30', Icon: RefreshCw }
    else vBadge = { label: 'Pending Review', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30', Icon: Clock }
  } else if (isUploaded) {
    vBadge = { label: 'Uploaded', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30', Icon: CheckCircle2 }
  } else if (isLater) {
    vBadge = { label: 'Deferred', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30', Icon: Clock }
  } else {
    vBadge = { label: 'Not Uploaded', className: 'bg-muted/40 text-muted-foreground border-border/60', Icon: AlertCircle }
  }

  const fileName = st.fileName || (isUploaded ? `${doc.key}_Verified_Document.pdf` : isLater ? 'Deferred for later submission' : 'No file attached yet')
  const ocr = st.ocrConfidence ?? 0

  const accentBorder = isVerified
    ? 'border-emerald-500/30'
    : isRejected
    ? 'border-rose-500/30'
    : isReplaceRequested
    ? 'border-violet-500/30'
    : isPendingReview
    ? 'border-amber-500/30'
    : 'border-border/70'

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card/80 backdrop-blur-md p-3.5 transition-all duration-150 shadow-sm hover:shadow-md hover:bg-card space-y-3',
        accentBorder
      )}
    >
      {/* Header: doc name + badges */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div
            className={cn(
              'p-2 rounded-lg shrink-0 flex items-center justify-center',
              isUploaded
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : isLater
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-foreground tracking-tight">{doc.name}</h4>
            <p className="text-[11px] text-muted-foreground/90 mt-0.5">{doc.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] px-2 py-0.5 font-semibold rounded-full border',
              doc.mandatory
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25'
                : 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25'
            )}
          >
            {doc.mandatory ? 'Required' : 'Optional'}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] px-2 py-0.5 font-semibold rounded-full border flex items-center gap-1',
              vBadge.className
            )}
          >
            <vBadge.Icon className="h-3 w-3 shrink-0" />
            <span>{vBadge.label}</span>
          </Badge>
        </div>
      </div>

      {/* File metadata */}
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md border max-w-full',
            isUploaded
              ? 'bg-muted/40 border-border/60 text-foreground'
              : 'bg-muted/20 border-dashed border-border/60 text-muted-foreground italic'
          )}
        >
          <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate font-mono text-[11px]">{fileName}</span>
        </div>
        {isUploaded && ocr > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span className="font-mono font-semibold tabular-nums">{ocr}% OCR</span>
          </div>
        )}
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
        <div className="flex flex-wrap items-center gap-1">
          <DocActionButton icon={Eye} label="Preview" disabled={!isUploaded} onClick={() => toast.info('Preview opened', { description: doc.name })} />
          <DocActionButton icon={RefreshCw} label="Replace" disabled={!isUploaded} onClick={() => toast.info('Replace dialog', { description: doc.name })} />
          <DocActionButton icon={Download} label="Download" disabled={!isUploaded} onClick={() => toast.success('Download started', { description: fileName })} />
          <DocActionButton icon={RotateCw} label="Rotate" disabled={!isUploaded} onClick={() => toast.info('Rotated', { description: doc.name })} />
          <DocActionButton icon={Crop} label="Crop" disabled={!isUploaded} onClick={() => toast.info('Crop mode', { description: doc.name })} />
          <DocActionButton icon={Minimize2} label="Compress" disabled={!isUploaded} onClick={() => toast.success('Compressed', { description: doc.name })} />
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          {!isUploaded && (
            <>
              {!isLater && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onDefer(doc.key)}
                  className="h-7 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground font-medium"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Submit Later</span>
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={() => onUploadClick(doc.key)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs h-7 px-3 gap-1.5"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                {isLater ? 'Upload Now' : 'Upload File'}
              </Button>
            </>
          )}
          {isUploaded && isPendingReview && (
            <Button
              type="button"
              size="sm"
              onClick={() => onVerify(doc.key)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-7 px-3 gap-1.5 shadow-sm"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Verify
            </Button>
          )}
          {isUploaded && isReplaceRequested && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => toast.info('Replace dialog', { description: doc.name })}
              className="h-7 text-[11px] px-2.5 gap-1 border-violet-500/40 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10 font-medium"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Replace File
            </Button>
          )}
        </div>
      </div>

      {/* Verifier info (when verified) */}
      {isUploaded && isVerified && st.verifiedBy && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          <div className="flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-muted-foreground">Verified by</span>
            <span className="font-semibold text-foreground">{st.verifiedBy}</span>
          </div>
          {st.verificationTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium text-foreground tabular-nums">{st.verificationTime}</span>
            </div>
          )}
        </div>
      )}

      {/* Rejection reason (when rejected) */}
      {isUploaded && isRejected && st.rejectionReason && (
        <div className="flex items-start gap-2 text-[11px] bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-muted-foreground">Rejection reason: </span>
            <span className="text-foreground font-medium">{st.rejectionReason}</span>
          </div>
        </div>
      )}

      {/* Replace requested note */}
      {isUploaded && isReplaceRequested && (
        <div className="flex items-start gap-2 text-[11px] bg-violet-500/5 dark:bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2">
          <RefreshCw className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-muted-foreground">Verifier requested a replacement upload. </span>
            {st.rejectionReason && <span className="text-foreground font-medium">{st.rejectionReason}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
