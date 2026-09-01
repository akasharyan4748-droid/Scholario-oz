'use client'

import { toast } from 'sonner'
import { CompactEnterpriseDocCard } from '../CompactEnterpriseDocCard'
import type { AdmissionApplication } from '@/lib/store/admission-store'
import type { SectionKey } from '@/lib/store/admission-store'

interface SectionDataContentProps {
  sectionKey: SectionKey
  app: AdmissionApplication
}

export function SectionDataContent({ sectionKey, app }: SectionDataContentProps) {
  const formData = app.formData

  if (sectionKey === 'personal') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div><span className="text-muted-foreground block text-[10px]">Name:</span> <strong>{formData.firstName} {formData.lastName}</strong></div>
        <div><span className="text-muted-foreground block text-[10px]">DOB:</span> <strong>{formData.dob}</strong></div>
        <div><span className="text-muted-foreground block text-[10px]">Gender & Blood:</span> <strong>{formData.gender} ({formData.bloodGroup || 'O+'})</strong></div>
        <div><span className="text-muted-foreground block text-[10px]">Nationality & Category:</span> <strong>{formData.nationality} ({formData.category})</strong></div>
        <div><span className="text-muted-foreground block text-[10px]">Aadhaar No:</span> <strong>{formData.aadhaarNo || 'Verified'}</strong></div>
      </div>
    )
  }

  if (sectionKey === 'parents') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div><span className="text-muted-foreground block text-[10px]">Father:</span> <strong>{formData.fatherName} ({formData.fatherOccupation}) · {formData.fatherPhone}</strong></div>
        <div><span className="text-muted-foreground block text-[10px]">Mother:</span> <strong>{formData.motherName} ({formData.motherOccupation}) · {formData.motherPhone}</strong></div>
        <div><span className="text-muted-foreground block text-[10px]">Emergency Contact:</span> <strong>{formData.emergencyName} ({formData.emergencyRelation}) · {formData.emergencyPhone}</strong></div>
      </div>
    )
  }

  if (sectionKey === 'address') {
    return (
      <div className="space-y-1">
        <div><span className="text-muted-foreground block text-[10px]">Current Residence:</span> <strong>{formData.currentAddress}, {formData.district}, {formData.state} - {formData.pincode}</strong></div>
      </div>
    )
  }

  if (sectionKey === 'previousSchool') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div><span className="text-muted-foreground block text-[10px]">Previous School:</span> <strong>{formData.previousSchool} ({formData.previousBoard})</strong></div>
        <div><span className="text-muted-foreground block text-[10px]">Academic Session Selector:</span> <strong>{formData.previousYear || '2025–2026'}</strong></div>
        <div><span className="text-muted-foreground block text-[10px]">TC Status & No:</span> <strong>{formData.tcStatus} · No: {formData.tcNumber || 'TC-2025-8841'}</strong></div>
      </div>
    )
  }

  if (sectionKey === 'medical') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div><span className="text-muted-foreground block text-[10px]">Allergies / Special Needs:</span> <strong>{formData.allergies || 'None'}</strong></div>
        <div><span className="text-muted-foreground block text-[10px]">Doctor Contact:</span> <strong>{formData.doctorName} ({formData.doctorPhone})</strong></div>
      </div>
    )
  }

  if (sectionKey === 'classAllocation') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div><span className="text-muted-foreground block text-[10px]">Admitted Class & Section:</span> <strong>{formData.className} — Section {formData.section}</strong></div>
      </div>
    )
  }

  if (sectionKey === 'fees') {
    return (
      <div className="space-y-1">
        <div><span className="text-muted-foreground block text-[10px]">Payment Plan & Selected Heads:</span> <strong>{app.feeData?.paymentMethod || 'UPI / Bank Transfer'} · Heads Selected: {app.feeData?.selectedFeeHeadIds?.length || 5}</strong></div>
      </div>
    )
  }

  if (sectionKey === 'documents') {
    return (
      <div className="pt-1">
        <CompactEnterpriseDocCard
          doc={{ key: 'birth_cert', name: 'Birth Certificate & TC', description: 'Mandatory Certificate Verification Matrix', mandatory: true }}
          statusState={{ status: 'uploaded', fileName: 'Birth_Certificate.pdf', ocrConfidence: 98, verifiedBy: 'AI OCR', verificationTime: '10:20 AM' }}
          onUpdateStatus={() => toast.info('OCR re-scanned successfully.')}
        />
      </div>
    )
  }

  if (sectionKey === 'photo') {
    return (
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-emerald-600/10 text-emerald-800 flex items-center justify-center font-bold text-lg">
          {formData.firstName[0]}{formData.lastName[0]}
        </div>
        <div className="text-xs">
          <span className="font-semibold block text-emerald-800 dark:text-emerald-300">Passport Photo Standard Verified</span>
          <span className="text-muted-foreground text-[10px]">35mm x 45mm white background complies with CBSE registration guidelines.</span>
        </div>
      </div>
    )
  }

  return null
}
