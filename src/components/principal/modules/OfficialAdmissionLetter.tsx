'use client'

import { useRef } from 'react'
import { toast } from 'sonner'
import { school } from '@/lib/mock/school'
import { TopActionBar } from './OfficialAdmissionLetter/TopActionBar'
import { Watermark, SchoolHeader } from './OfficialAdmissionLetter/SchoolHeader'
import { StudentProfileGrid } from './OfficialAdmissionLetter/StudentProfileGrid'
import { FeeBreakdownTable } from './OfficialAdmissionLetter/FeeBreakdownTable'
import { PortalCredentialsCard } from './OfficialAdmissionLetter/PortalCredentialsCard'
import { DigitalVerification, StatutoryDeclaration, Signatures } from './OfficialAdmissionLetter/DigitalVerification'
import type { OfficialAdmissionLetterProps as Props } from './OfficialAdmissionLetter/types'

export type { AdmissionLetterData } from './OfficialAdmissionLetter/types'

export function OfficialAdmissionLetter({ data, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = () => {
    toast.success('Admission Letter PDF Generated', {
      description: `Saved as Admission_Letter_${data.admissionNo}.pdf`,
    })
  }

  const fullName = `${data.student.firstName} ${data.student.lastName}`
  const principalName = school.principal || 'Principal'

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden on print) */}
      <TopActionBar
        admissionNo={data.admissionNo}
        onPrint={handlePrint}
        onDownloadPdf={handleDownloadPdf}
        onClose={onClose}
      />

      {/* Printable Institutional Document Box */}
      <div
        ref={printRef}
        className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-200 relative overflow-hidden font-sans print:shadow-none print:border-none print:p-0 print:m-0"
      >
        {/* Subtle Diagonal Watermark */}
        <Watermark />

        {/* School Header */}
        <SchoolHeader data={data} />

        {/* Student Profile Overview Grid */}
        <StudentProfileGrid data={data} fullName={fullName} />

        {/* Section: Official Fee Breakdown Table */}
        <FeeBreakdownTable data={data} />

        {/* Student Portal Login Credentials & Onboarding Card */}
        <PortalCredentialsCard data={data} />

        {/* Digital Verification & School Seal Area */}
        <DigitalVerification data={data} />

        {/* Statutory Declaration */}
        <StatutoryDeclaration data={data} />

        {/* Official Signatures Area */}
        <Signatures data={data} principalName={principalName} />
      </div>
    </div>
  )
}
