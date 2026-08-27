'use client'

import { useCallback, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  AuditLogEntry,
  CompactEnterpriseDocCardProps,
} from './types'

/**
 * Owns the doc-card state, computed metadata, and event handlers.
 *
 * Computed values:
 *  - isUploaded / isLater — derived from statusState.status
 *  - effectiveFileName / effectiveOcr / effectiveVerifiedBy / effectiveVerificationTime
 *    — fall back to sensible defaults when the prop values are missing
 *  - statusLabel / statusBadgeStyle / StatusIcon — driving the top-right badge
 *
 * Handlers:
 *  - handleFileChange — simulates upload, generates random OCR score 95–99%,
 *    appends an audit log entry, fires onUpdateStatus + a success toast
 *  - handleDownload — guards on isUploaded, toasts a download message
 *  - handleDefer — fires onUpdateStatus('later') + an info toast
 */
export function useDocCard({
  doc,
  statusState,
  onUpdateStatus,
}: CompactEnterpriseDocCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const isUploaded = statusState.status === 'uploaded'
  const isLater = statusState.status === 'later'

  // Default computed metadata if not set
  const effectiveFileName = isUploaded
    ? statusState.fileName || `${doc.key}_Attested_Record.pdf`
    : isLater
    ? 'Deferred for later submission'
    : 'No file attached yet'

  const effectiveOcr = statusState.ocrConfidence ?? 98.5
  const effectiveVerifiedBy = statusState.verifiedBy || 'AI Vision OCR System'
  const effectiveVerificationTime = statusState.verificationTime || 'Today, 10:22 AM'

  // Simulated audit logs
  const [historyLogs, setHistoryLogs] = useState<AuditLogEntry[]>([
    {
      id: 'log-1',
      timestamp: 'Today, 10:20 AM',
      action: 'File Upload Initialized',
      actor: 'Applicant / Guardian',
      details: `Document candidate provided for ${doc.name}`,
    },
    {
      id: 'log-2',
      timestamp: 'Today, 10:21 AM',
      action: 'AI Vision OCR Analysis',
      actor: 'Automated OCR Engine',
      details: `Extracted key attributes with ${effectiveOcr}% confidence`,
    },
    {
      id: 'log-3',
      timestamp: 'Today, 10:22 AM',
      action: 'Status Marked Verified',
      actor: effectiveVerifiedBy,
      details: 'All mandatory seals and credentials validated successfully',
    },
  ])

  // Handle file selection / upload simulation
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      const selectedFileName = file ? file.name : `${doc.key}_Verified_Document.pdf`
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const timeString = `Today, ${nowTime}`
      const ocrScore = Math.floor(Math.random() * 5) + 95 // 95% - 99%

      onUpdateStatus(
        doc.key,
        'uploaded',
        selectedFileName,
        ocrScore,
        'AI Vision OCR System',
        timeString
      )

      setHistoryLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}`,
          timestamp: timeString,
          action: isUploaded ? 'Document Replaced' : 'Document Uploaded & Verified',
          actor: 'Current Admin User',
          details: `File "${selectedFileName}" processed with ${ocrScore}% OCR confidence.`,
        },
      ])

      toast.success(`${doc.name} uploaded successfully`, {
        description: `Verified with ${ocrScore}% OCR confidence`,
      })

      if (e.target) e.target.value = ''
    },
    [doc.key, doc.name, isUploaded, onUpdateStatus]
  )

  const handleDownload = useCallback(() => {
    if (!isUploaded) {
      toast.error('No document uploaded yet')
      return
    }
    toast.success(`Downloading ${effectiveFileName}`, {
      description: 'Document package generated for official record.',
    })
  }, [effectiveFileName, isUploaded])

  const handleDefer = useCallback(() => {
    onUpdateStatus(doc.key, 'later', '', 0, '', '')
    toast.info(`${doc.name} marked for later submission`, {
      description:
        'You can return to upload this certificate before final enrollment confirmation.',
    })
  }, [doc.key, doc.name, onUpdateStatus])

  // Determine top badge styling
  let statusLabel = 'Pending Upload'
  let statusBadgeStyle =
    'bg-muted/10 text-muted-foreground dark:text-muted-foreground border-muted-foreground/20'
  let StatusIcon: LucideIcon = AlertCircle

  if (isUploaded) {
    statusLabel = 'Verified'
    statusBadgeStyle =
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
    StatusIcon = CheckCircle2
  } else if (isLater) {
    statusLabel = 'Deferred'
    statusBadgeStyle =
      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
    StatusIcon = Clock
  }

  return {
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
  }
}

export type UseDocCardReturn = ReturnType<typeof useDocCard>
