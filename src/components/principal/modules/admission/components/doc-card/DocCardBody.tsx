'use client'

import {
  Clock,
  Download,
  Eye,
  FileText,
  History,
  Paperclip,
  Sparkles,
  UploadCloud,
  UserCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DocItem } from './types'
import type { UseDocCardReturn } from './useDocCard'

interface DocCardBodyProps {
  doc: DocItem
  state: Omit<
    UseDocCardReturn,
    'isPreviewOpen' | 'setIsPreviewOpen' | 'isHistoryOpen' | 'setIsHistoryOpen' | 'historyLogs'
  >
  onOpenPreview: () => void
  onOpenHistory: () => void
}

/**
 * The compact doc card body: document-name row (with Required + status
 * badges), file-name row, OCR/VerifiedBy/VerificationTime metadata grid, and
 * the bottom action row (Preview · Download · History on the left;
 * Submit Later · Upload/Replace on the right).
 *
 * The hidden `<input type="file">` lives at the top so the Upload button can
 * trigger it via `fileInputRef.current?.click()`.
 */
export function DocCardBody({
  doc,
  state,
  onOpenPreview,
  onOpenHistory,
}: DocCardBodyProps) {
  const {
    fileInputRef,
    isUploaded,
    isLater,
    effectiveFileName,
    effectiveOcr,
    effectiveVerifiedBy,
    effectiveVerificationTime,
    statusLabel,
    statusBadgeStyle,
    StatusIcon,
    handleFileChange,
    handleDownload,
    handleDefer,
  } = state

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg"
      />

      <div className="group relative rounded-xl border border-border/70 dark:border-border bg-card/90 dark:bg-muted/80 hover:bg-card hover:border-border transition-all duration-150 p-3 sm:p-3.5 shadow-2xs space-y-2.5">
        {/* FIRST ROW: Document Name | Required Badge | Verification Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className={cn(
                'p-1.5 rounded-md text-xs shrink-0 flex items-center justify-center font-semibold',
                isUploaded
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : isLater
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate tracking-tight">
                {doc.name}
              </h4>
              <span className="text-[11px] text-muted-foreground/80 hidden lg:inline truncate">
                • {doc.description}
              </span>
            </div>
          </div>

          {/* Connected Badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            {doc.mandatory && (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 rounded-full"
              >
                Required
              </Badge>
            )}
            <Badge
              className={cn(
                'text-[10px] px-2 py-0.5 font-semibold rounded-full border flex items-center gap-1',
                statusBadgeStyle
              )}
            >
              <StatusIcon className="h-3 w-3 shrink-0" />
              <span>{statusLabel}</span>
            </Badge>
          </div>
        </div>

        {/* SECOND ROW: File Name */}
        <div className="flex items-center justify-between gap-2 text-xs py-0.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-muted-foreground shrink-0 uppercase tracking-wider">
              File:
            </span>
            <div
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono min-w-0 max-w-full border',
                isUploaded
                  ? 'bg-muted/50 dark:bg-muted border-border/60 text-foreground font-medium'
                  : 'bg-muted/20 border-dashed border-border/60 text-muted-foreground italic'
              )}
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{effectiveFileName}</span>
            </div>
          </div>
        </div>

        {/* THIRD ROW: OCR Confidence | Verified By | Verification Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-muted/20 dark:bg-muted/40 p-2 rounded-lg border border-border/30">
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="text-muted-foreground font-medium">OCR Confidence:</span>
            <span className="font-semibold text-foreground font-mono">
              {isUploaded ? `${effectiveOcr}%` : 'N/A'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <UserCheck className="h-3.5 w-3.5 text-sky-500 shrink-0" />
            <span className="text-muted-foreground font-medium">Verified By:</span>
            <span className="font-medium text-foreground truncate">
              {isUploaded ? effectiveVerifiedBy : '—'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="text-muted-foreground font-medium">Verification Time:</span>
            <span className="font-medium text-foreground truncate">
              {isUploaded
                ? effectiveVerificationTime
                : isLater
                ? 'Deferred'
                : 'Pending'}
            </span>
          </div>
        </div>

        {/* BOTTOM ACTION ROW: Preview | Download | Replace/Upload | View History | (Submit Later conditionally) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
          {/* Left Actions: Preview, Download, View History */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!isUploaded}
              onClick={onOpenPreview}
              className="h-7 text-[11px] px-2.5 gap-1 font-medium hover:bg-accent border-border/80"
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Preview</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!isUploaded}
              onClick={handleDownload}
              className="h-7 text-[11px] px-2.5 gap-1 font-medium hover:bg-accent border-border/80"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Download</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onOpenHistory}
              className="h-7 text-[11px] px-2.5 gap-1 text-muted-foreground hover:text-foreground font-medium"
            >
              <History className="h-3.5 w-3.5" />
              <span>History</span>
            </Button>
          </div>

          {/* Right Actions: Submit Later (ONLY if not uploaded) & Upload/Replace */}
          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            {/* HIDE "Submit Later" once uploaded / verified */}
            {!isUploaded && (
              <Button
                type="button"
                size="sm"
                variant={isLater ? 'secondary' : 'ghost'}
                onClick={handleDefer}
                className="h-7 text-[11px] px-2.5 gap-1 text-muted-foreground hover:text-foreground font-medium"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>{isLater ? 'Deferred' : 'Submit Later'}</span>
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              variant={isUploaded ? 'outline' : 'default'}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'h-7 text-[11px] px-3 gap-1.5 font-medium transition-all shadow-2xs',
                isUploaded
                  ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>{isUploaded ? 'Replace' : 'Upload File'}</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
