'use client'

/**
 * Wizard Step 8 — Verification Documents.
 * Extracted from the original admission.tsx monolith (Task ID: 21).
 */
import { useMemo, useRef, useState } from 'react'
import { FileText, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { DocStatus } from '../types'
import {
  useAdmissionFeatureFlags,
} from '../lib/admission-utils'
import type { FormData } from '../constants'
import { StepHeader, SummaryPill } from './StepShared'
import { DocumentCard, type DocDescriptor } from './DocumentCard'

const DOCS_LIST: DocDescriptor[] = [
  { key: 'birthCert', name: 'Birth Certificate', description: 'Official municipal or hospital record', mandatory: true },
  { key: 'tc', name: 'Transfer Certificate (TC)', description: 'Previous school leaving certificate', mandatory: true },
  { key: 'aadhaar', name: 'Student Aadhaar Card', description: 'UIDAI Govt identity card copy', mandatory: true },
  { key: 'marksheet', name: 'Previous Class Marksheet', description: 'Report card from last academic year', mandatory: true },
  { key: 'migration', name: 'Migration Certificate', description: 'Board migration certificate (Class IX+)', mandatory: false },
  { key: 'character', name: 'Character Certificate', description: 'Conduct certificate from previous school', mandatory: false },
]

const nowTimeStr = () =>
  new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export function DocumentsStep({ data, set, flags }: { data: FormData; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void; flags: ReturnType<typeof useAdmissionFeatureFlags> }) {
  const verificationEnabled = !!flags.enableDocumentVerification
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeUploadKey, setActiveUploadKey] = useState<string | null>(null)

  const handleUpdateDoc = (key: string, patch: Partial<DocStatus>) => {
    const existing = data.docStatuses[key] || { status: 'pending' as const }
    set('docStatuses', {
      ...data.docStatuses,
      [key]: { ...existing, ...patch },
    })
  }

  const handleUploadClick = (key: string) => {
    setActiveUploadKey(key)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!activeUploadKey) return
    const doc = DOCS_LIST.find((d) => d.key === activeUploadKey)
    const fileName = file ? file.name : `${activeUploadKey}_Verified_Document.pdf`
    const ocrScore = Math.floor(Math.random() * 5) + 95
    handleUpdateDoc(activeUploadKey, {
      status: 'uploaded',
      fileName,
      ocrConfidence: ocrScore,
      verificationStatus: verificationEnabled ? 'pending' : undefined,
      verifiedBy: undefined,
      verificationTime: undefined,
      rejectionReason: undefined,
    })
    toast.success(`${doc?.name} uploaded`, {
      description: `OCR confidence ${ocrScore}%${verificationEnabled ? ' · Awaiting verifier review' : ''}`,
    })
    setActiveUploadKey(null)
    if (e.target) e.target.value = ''
  }

  const handleDefer = (key: string) => {
    const doc = DOCS_LIST.find((d) => d.key === key)
    handleUpdateDoc(key, { status: 'later', fileName: '' })
    toast.info(`${doc?.name} deferred`, {
      description: 'You can return to upload this before final enrollment confirmation.',
    })
  }

  const handleVerify = (key: string) => {
    const timeStr = nowTimeStr()
    handleUpdateDoc(key, {
      verificationStatus: 'verified',
      verifiedBy: 'Dr. Ananya Iyer',
      verificationTime: timeStr,
      rejectionReason: undefined,
    })
    toast.success('Document verified', {
      description: `Verified by Dr. Ananya Iyer · ${timeStr}`,
    })
  }

  const handleVerifyAll = () => {
    const timeStr = nowTimeStr()
    const updated: Record<string, DocStatus> = { ...data.docStatuses }
    let count = 0
    for (const doc of DOCS_LIST) {
      const existing = updated[doc.key]
      if (
        existing &&
        existing.status === 'uploaded' &&
        (!existing.verificationStatus ||
          existing.verificationStatus === 'pending' ||
          existing.verificationStatus === 'replace_requested')
      ) {
        updated[doc.key] = {
          ...existing,
          verificationStatus: 'verified',
          verifiedBy: 'Dr. Ananya Iyer',
          verificationTime: timeStr,
          rejectionReason: undefined,
        }
        count++
      }
    }
    set('docStatuses', updated)
    if (count > 0) {
      toast.success(`${count} ${count === 1 ? 'document' : 'documents'} verified`, {
        description: `Verified by Dr. Ananya Iyer · ${timeStr}`,
      })
    } else {
      toast.info('No pending documents to verify')
    }
  }

  const summary = useMemo(() => {
    let verified = 0, pending = 0, rejected = 0, replaceRequested = 0, uploaded = 0, deferred = 0, notUploaded = 0
    for (const doc of DOCS_LIST) {
      const s = data.docStatuses[doc.key]
      if (!s || s.status === 'pending') { notUploaded++; continue }
      if (s.status === 'later') { deferred++; continue }
      if (s.status === 'uploaded') {
        uploaded++
        if (verificationEnabled) {
          if (s.verificationStatus === 'verified') verified++
          else if (s.verificationStatus === 'rejected') rejected++
          else if (s.verificationStatus === 'replace_requested') replaceRequested++
          else pending++
        }
      }
    }
    return { verified, pending, rejected, replaceRequested, uploaded, deferred, notUploaded }
  }, [data.docStatuses, verificationEnabled])

  const pendingVerifyCount = summary.pending + summary.replaceRequested

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg"
      />

      <StepHeader
        title="Verification Documents"
        subtitle={
          verificationEnabled
            ? 'Upload, verify, and manage student certificates with OCR-backed audit trail'
            : 'Upload mandatory student certificates with automated OCR checks'
        }
        icon={<FileText className="h-5 w-5" />}
      />

      {/* Summary bar + Verify All */}
      <div className="rounded-xl border border-border/70 bg-card/70 backdrop-blur-md p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <SummaryPill label="Uploaded" value={summary.uploaded} className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25" />
          {verificationEnabled && (
            <>
              <SummaryPill label="Verified" value={summary.verified} className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25" />
              <SummaryPill label="Pending" value={summary.pending} className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25" />
              <SummaryPill label="Rejected" value={summary.rejected} className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25" />
              <SummaryPill label="Replace" value={summary.replaceRequested} className="bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25" />
            </>
          )}
          {summary.deferred > 0 && (
            <SummaryPill label="Deferred" value={summary.deferred} className="bg-muted/40 text-muted-foreground border-border" />
          )}
          {summary.notUploaded > 0 && (
            <SummaryPill label="Not Uploaded" value={summary.notUploaded} className="bg-muted/30 text-muted-foreground border-border/60" />
          )}
        </div>
        {verificationEnabled && (
          <Button
            type="button"
            size="sm"
            onClick={handleVerifyAll}
            disabled={pendingVerifyCount === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-3 gap-1.5 shadow-sm disabled:opacity-50"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Verify All Pending{pendingVerifyCount > 0 ? ` (${pendingVerifyCount})` : ''}
          </Button>
        )}
      </div>

      {/* Doc cards */}
      <div className="space-y-3">
        {DOCS_LIST.map((doc) => {
          const st: DocStatus = data.docStatuses[doc.key] || { status: 'pending' }
          return (
            <DocumentCard
              key={doc.key}
              doc={doc}
              st={st}
              verificationEnabled={verificationEnabled}
              onUploadClick={handleUploadClick}
              onDefer={handleDefer}
              onVerify={handleVerify}
            />
          )
        })}
      </div>
    </div>
  )
}
