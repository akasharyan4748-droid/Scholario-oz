'use client'

/**
 * document-detail — slide-from-right detail drawer.
 *
 * Shows the full document record: icon + name + meta + preview placeholder
 * + actions (Download / Print). For generated documents, surfaces the
 * linked student + doc number.
 */

import { motion } from 'framer-motion'
import {
  Download, Printer, X, FileText, Calendar, Hash, User, HardDrive,
  Tag, FolderTree, Share2, Star, RotateCcw, Info, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from '@/components/ui/drawer'
import { toast } from 'sonner'
import { formatDate, formatRelativeTime } from '@/lib/format'
import { useDownloadsStore, type DownloadDocument } from '@/lib/store/downloads-store'
import { useCertificatesStore } from '@/lib/store/certificates-store'
import { DocIcon, FormatBadge, SourceBadge, CategoryPill } from './downloads-shared'

interface DocumentDetailProps {
  doc: DownloadDocument | null
  open: boolean
  onClose: () => void
}

export function DocumentDetail({ doc, open, onClose }: DocumentDetailProps) {
  const download = useDownloadsStore((s) => s.download)
  const recordPreview = useDownloadsStore((s) => s.recordPreview)
  const downloadsCount = useDownloadsStore((s) => s.downloadsCount)
  const certDocs = useCertificatesStore((s) => s.documents)

  if (!doc) return null

  function handleDownload(d: DownloadDocument) {
    const filename = download(d)
    toast.success('Download started', { description: `${filename} · ${d.format}` })
  }

  function handlePrint(d: DownloadDocument) {
    toast.info('Opening print view…', { description: d.docNumber ?? d.name })
  }

  function handleShare(d: DownloadDocument) {
    toast.success('Link copied', { description: `${d.name} share link ready` })
  }

  function handleFavourite(d: DownloadDocument) {
    toast.success('Added to favourites', { description: d.name })
  }

  function handleRegenerate(d: DownloadDocument) {
    const cert = certDocs.find((c) => `doc-gen-${c.id}` === d.id)
    if (cert) {
      toast.info('Regenerating document…', { description: cert.docNumber })
    } else {
      toast.info('Regenerating document…', { description: d.name })
    }
  }

  const certDoc = certDocs.find((c) => `doc-gen-${c.id}` === doc.id)
  const count = downloadsCount[doc.id] ?? 0

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => { if (!v) onClose() }}
      direction="right"
    >
      <DrawerContent
        className="sm:max-w-md w-full"
        aria-label="Document details"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <DocIcon format={doc.format} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.14em]">
                Document Details
              </p>
              <DrawerTitle className="text-sm font-bold leading-tight truncate">
                {doc.name}
              </DrawerTitle>
              <DrawerDescription className="text-[11px] text-muted-foreground truncate mt-0.5">
                {doc.docNumber ?? doc.description}
              </DrawerDescription>
            </div>
          </div>
          <Button
            variant="ghost" size="sm"
            className="h-7 w-7 p-0 shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto downloads-list-scroll">
          {/* Preview placeholder (A4-style card) */}
          <div className="p-4">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="rounded-xl border border-border bg-gradient-to-br from-muted/30 to-background p-6 shadow-sm aspect-[3/4] flex flex-col"
            >
              <div className="flex items-center justify-between gap-2">
                <DocIcon format={doc.format} size="md" />
                <FormatBadge format={doc.format} />
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="relative">
                  <div className="absolute -inset-4 bg-emerald-500/10 blur-2xl rounded-full" aria-hidden />
                  <FileText className="relative h-14 w-14 text-emerald-600/70 dark:text-emerald-400/70" />
                </div>
                <p className="mt-4 text-sm font-semibold leading-tight max-w-[220px]">
                  {doc.name}
                </p>
                {doc.docNumber && (
                  <p className="mt-1 text-[10px] text-muted-foreground font-mono">
                    {doc.docNumber}
                  </p>
                )}
                <p className="mt-2 text-[10px] text-muted-foreground/70 max-w-[240px] leading-snug">
                  {doc.studentName
                    ? `Issued to ${doc.studentName}`
                    : doc.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-[9px] text-muted-foreground/70 pt-3 border-t border-border/40">
                <span>Generated preview</span>
                <span className="tabular-nums">{formatDate(doc.updatedDate)}</span>
              </div>
            </motion.div>
          </div>

          {/* Action buttons row */}
          <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              className="flex-1 min-w-[100px] h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              onClick={() => handleDownload(doc)}
            >
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
            <Button
              variant="outline" size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => handlePrint(doc)}
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            <Button
              variant="outline" size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleShare(doc)}
              aria-label="Share"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline" size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleFavourite(doc)}
              aria-label="Add to favourites"
            >
              <Star className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Metadata grid */}
          <div className="px-4 py-3 border-t border-border">
            <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-2">
              Document information
            </p>
            <dl className="space-y-1.5">
              <MetaRow icon={<Tag className="h-3.5 w-3.5" />} label="Source">
                <SourceBadge source={doc.source} showIcon />
              </MetaRow>
              <MetaRow icon={<FolderTree className="h-3.5 w-3.5" />} label="Category">
                <CategoryPill category={doc.category} />
              </MetaRow>
              <MetaRow icon={<FileText className="h-3.5 w-3.5" />} label="Format">
                <FormatBadge format={doc.format} />
              </MetaRow>
              <MetaRow icon={<HardDrive className="h-3.5 w-3.5" />} label="File size">
                <span className="text-[11px] text-foreground tabular-nums">{doc.size ?? '—'}</span>
              </MetaRow>
              <MetaRow icon={<Calendar className="h-3.5 w-3.5" />} label="Last updated">
                <div className="text-right">
                  <p className="text-[11px] text-foreground leading-tight">
                    {formatRelativeTime(doc.updatedDate)}
                  </p>
                  <p className="text-[9px] text-muted-foreground tabular-nums">
                    {formatDate(doc.updatedDate)}
                  </p>
                </div>
              </MetaRow>
              {doc.docNumber && (
                <MetaRow icon={<Hash className="h-3.5 w-3.5" />} label="Document no.">
                  <span className="text-[11px] font-mono text-foreground">{doc.docNumber}</span>
                </MetaRow>
              )}
              {doc.studentName && (
                <MetaRow icon={<User className="h-3.5 w-3.5" />} label="Issued to">
                  <div className="text-right">
                    <p className="text-[11px] text-foreground leading-tight">{doc.studentName}</p>
                    {doc.studentId && (
                      <p className="text-[9px] text-muted-foreground font-mono">
                        {doc.studentId}
                      </p>
                    )}
                  </div>
                </MetaRow>
              )}
            </dl>
          </div>

          {/* Activity + state info */}
          <div className="px-4 py-3 border-t border-border">
            <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-2">
              Activity
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-500/20">
                <Download className="h-2.5 w-2.5" />
                <span className="tabular-nums font-semibold">{count}</span> downloads
              </span>
              {certDoc && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-500/20">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {certDoc.status}
                </span>
              )}
              {certDoc && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground border border-border">
                  <Info className="h-2.5 w-2.5" />
                  {certDoc.templateName}
                </span>
              )}
            </div>
            {certDoc && (
              <div className="mt-3 rounded-lg bg-muted/40 border border-border p-2.5">
                <div className="flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-[10px] text-muted-foreground leading-snug">
                    Generated by <strong className="text-foreground/80">{certDoc.generatedBy}</strong>{' '}
                    on <span className="tabular-nums">{formatDate(certDoc.generatedAt)}</span>.
                    {certDoc.admissionNo && (
                      <> Admission no. <span className="font-mono">{certDoc.admissionNo}</span>.</>
                    )}
                    {certDoc.class && (
                      <> Class <span className="font-medium text-foreground/80">{certDoc.class}</span>.</>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline" size="sm"
                  className="mt-2 h-7 text-[10px] gap-1.5"
                  onClick={() => handleRegenerate(doc)}
                >
                  <RotateCcw className="h-3 w-3" /> Regenerate
                </Button>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function MetaRow({
  icon, label, children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
        <span className="shrink-0">{icon}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider truncate">{label}</span>
      </div>
      <div className="text-right min-w-0">{children}</div>
    </div>
  )
}
