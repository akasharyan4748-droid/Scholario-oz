'use client'

import { useState } from 'react'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useAdmissionStore,
  SectionKey,
} from '@/lib/store/admission-store'
import { toast } from 'sonner'

import { SECTIONS_CONFIG } from './verification/sections-config'
import { VerificationHeader } from './verification/VerificationHeader'
import { VerificationSectionCard } from './verification/VerificationSectionCard'
import { VerificationSidebar } from './verification/VerificationSidebar'
import { CorrectionDialog } from './verification/CorrectionDialog'
import { RejectionDialog } from './verification/RejectionDialog'

interface VerificationWorkspaceProps {
  appId: string
  onBack: () => void
  onApprovedNext: (appId: string) => void
  onOpenWizardToEdit: (appId: string) => void
}

export function VerificationWorkspace({
  appId,
  onBack,
  onApprovedNext,
  onOpenWizardToEdit,
}: VerificationWorkspaceProps) {
  const store = useAdmissionStore()
  const app = store.applications.find((a) => a.id === appId)

  const [overallRemarks, setOverallRemarks] = useState(app?.generalRemarks || '')
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false)

  if (!app) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-muted-foreground">Application record not found.</p>
        <Button onClick={onBack}>Back to Dashboard</Button>
      </div>
    )
  }

  const sectionReviews = app.sectionReviews || {}

  const handleSectionStatusChange = (key: SectionKey, status: 'Complete' | 'Incomplete' | 'Needs Review') => {
    store.updateSectionReview(app.id, key, { status })
    toast.success(`Section status updated to ${status}`)
  }

  const handleSectionRemarkChange = (key: SectionKey, remarks: string) => {
    store.updateSectionReview(app.id, key, { remarks })
  }

  const handleApprove = () => {
    store.approveApplication(app.id, overallRemarks)
    toast.success('Application Approved! Opening Admission Issuance Workspace...')
    onApprovedNext(app.id)
  }

  const handleConfirmCorrection = () => {
    if (!overallRemarks.trim()) {
      toast.error('Please enter overall correction instructions for the applicant.')
      return
    }
    store.requestCorrection(app.id, overallRemarks)
    toast.success('Application returned for correction with section remarks.')
    setCorrectionDialogOpen(false)
    onBack()
  }

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please specify a rejection reason for compliance auditing.')
      return
    }
    store.rejectApplication(app.id, rejectionReason, 60)
    toast.success('Application moved to Rejected Queue (Retention active).')
    setRejectDialogOpen(false)
    onBack()
  }

  // Count flagged sections
  const flaggedCount = Object.values(sectionReviews).filter(
    (s) => s.status === 'Needs Review' || s.status === 'Incomplete'
  ).length

  return (
    <div className="space-y-5">
      {/* Back button — standalone, clean */}
      <Button variant="outline" size="sm" onClick={onBack} className="h-8 gap-1.5 text-xs w-fit">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Button>

      <VerificationHeader
        app={app}
        flaggedCount={flaggedCount}
        onOpenWizardToEdit={onOpenWizardToEdit}
        onNeedCorrection={() => setCorrectionDialogOpen(true)}
        onReject={() => setRejectDialogOpen(true)}
        onApprove={handleApprove}
      />

      {/* Main Grid: Section Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              9-Section Official Verification Checklist
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              {9 - flaggedCount} / 9 Sections Verified
            </span>
          </div>

          {SECTIONS_CONFIG.map(({ key, title, icon }) => {
            const review = sectionReviews[key] || { status: 'Complete', remarks: '' }
            return (
              <VerificationSectionCard
                key={key}
                app={app}
                sectionKey={key}
                title={title}
                icon={icon}
                review={review}
                onStatusChange={handleSectionStatusChange}
                onRemarkChange={handleSectionRemarkChange}
              />
            )
          })}
        </div>

        {/* Sidebar: Overall Audit Trail & Summary */}
        <div className="lg:col-span-4 space-y-4">
          <VerificationSidebar
            app={app}
            flaggedCount={flaggedCount}
            overallRemarks={overallRemarks}
            onOverallRemarksChange={setOverallRemarks}
          />
        </div>
      </div>

      {/* Need Correction Confirmation Dialog */}
      <CorrectionDialog
        open={correctionDialogOpen}
        onOpenChange={setCorrectionDialogOpen}
        overallRemarks={overallRemarks}
        onOverallRemarksChange={setOverallRemarks}
        onConfirm={handleConfirmCorrection}
      />

      {/* Rejection Confirmation Dialog */}
      <RejectionDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        onConfirm={handleConfirmReject}
      />
    </div>
  )
}
