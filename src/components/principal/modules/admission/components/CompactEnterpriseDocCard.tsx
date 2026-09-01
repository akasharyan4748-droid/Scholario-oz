'use client'

import { useDocCard } from './doc-card/useDocCard'
import { DocCardBody } from './doc-card/DocCardBody'
import { PreviewDialog } from './doc-card/PreviewDialog'
import { HistoryDialog } from './doc-card/HistoryDialog'
import type {
  CompactEnterpriseDocCardProps,
  DocItem,
  DocStatusState,
} from './doc-card/types'

// Re-export the public types so existing deep imports keep working.
export type { CompactEnterpriseDocCardProps, DocItem, DocStatusState }

export function CompactEnterpriseDocCard({
  doc,
  statusState,
  onUpdateStatus,
}: CompactEnterpriseDocCardProps) {
  const {
    fileInputRef,
    isPreviewOpen,
    setIsPreviewOpen,
    isHistoryOpen,
    setIsHistoryOpen,
    historyLogs,
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
  } = useDocCard({ doc, statusState, onUpdateStatus })

  return (
    <>
      <DocCardBody
        doc={doc}
        state={{
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
        }}
        onOpenPreview={() => setIsPreviewOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* PREVIEW MODAL */}
      <PreviewDialog
        doc={doc}
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        effectiveFileName={effectiveFileName}
        effectiveOcr={effectiveOcr}
        effectiveVerifiedBy={effectiveVerifiedBy}
        effectiveVerificationTime={effectiveVerificationTime}
        onDownload={handleDownload}
      />

      {/* VIEW HISTORY MODAL */}
      <HistoryDialog
        doc={doc}
        isOpen={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        historyLogs={historyLogs}
      />
    </>
  )
}
