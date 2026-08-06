'use client'

import { Download, FileCheck2, FileText, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { DocItem } from './types'

interface PreviewDialogProps {
  doc: DocItem
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  effectiveFileName: string
  effectiveOcr: number
  effectiveVerifiedBy: string
  effectiveVerificationTime: string
  onDownload: () => void
}

/**
 * Document preview modal: header with FileCheck2 icon + doc name + file name,
 * a 4-column metadata grid (Status / OCR Accuracy / Verified By / Time), a
 * simulated watermarked digital document container with extracted OCR data
 * snapshot, and a Close / Download Official PDF footer.
 */
export function PreviewDialog({
  doc,
  isOpen,
  onOpenChange,
  effectiveFileName,
  effectiveOcr,
  effectiveVerifiedBy,
  effectiveVerificationTime,
  onDownload,
}: PreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border shadow-2xl p-6">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Document Preview: {doc.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Official verified digital record ({effectiveFileName})
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Document Header Metadata Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-muted/30 rounded-xl border border-border/50 text-xs">
            <div>
              <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                Status
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                OCR Accuracy
              </span>
              <span className="font-mono font-semibold text-foreground mt-0.5 block">
                {effectiveOcr}% Match
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                Verified By
              </span>
              <span className="font-medium text-foreground mt-0.5 block truncate">
                {effectiveVerifiedBy}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                Time
              </span>
              <span className="font-medium text-foreground mt-0.5 block truncate">
                {effectiveVerificationTime}
              </span>
            </div>
          </div>

          {/* Simulated Digital Preview Document Container */}
          <div className="rounded-xl border border-border bg-muted/10 p-6 flex flex-col items-center justify-center min-h-[220px] text-center space-y-3 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Watermarked Official Copy
              </Badge>
            </div>

            <FileText className="h-12 w-12 text-primary/60" />
            <div className="space-y-1">
              <p className="font-mono text-sm font-semibold text-foreground">
                {effectiveFileName}
              </p>
              <p className="text-xs text-muted-foreground max-w-md">
                PDF Digital Document • High Resolution • Authenticated with Institutional Seal
              </p>
            </div>

            <div className="bg-background/80 backdrop-blur-xs p-3 rounded-lg border border-border text-left w-full text-xs font-mono space-y-1 text-muted-foreground">
              <div className="text-[10px] font-sans font-semibold text-foreground uppercase tracking-wider text-muted-foreground mb-1">
                Extracted OCR Data Snapshot:
              </div>
              <p>• Document ID: DOC-{doc.key.toUpperCase()}-2026-X91</p>
              <p>• Institutional Authority: Municipal Govt / Education Board</p>
              <p>• Verification Hash: 8f9b2c3a-1e4d-5f6a-7b8c</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onDownload}
            className="bg-primary text-primary-foreground gap-1.5"
          >
            <Download className="h-4 w-4" /> Download Official PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
