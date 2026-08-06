'use client'

import { Printer, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatINR, formatDate } from '@/lib/format'
import { school } from '@/lib/mock/school'
import type { TeacherRecord, AppointmentLetterData } from '@/lib/store/teachers-store'

interface Props {
  letter: AppointmentLetterData
  teacher: TeacherRecord
  onClose: () => void
}

/**
 * Official printable appointment letter document — letterhead, body,
 * terms, QR verification block, signature & seal, print/download action.
 */
export function AppointmentLetterDocument({ letter, teacher, onClose }: Props) {
  return (
    <div className="p-6 sm:p-8 space-y-6 bg-white text-slate-900 rounded-2xl">
      {/* Letterhead */}
      <div className="border-b-2 border-emerald-700 pb-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-white font-display text-3xl font-extrabold shadow-md">
            {school.logo}
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-emerald-900 tracking-tight">{school.name}</h1>
            <p className="text-xs text-slate-600 font-medium">{school.affiliation} · Code: {school.code}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{school.address} · Phone: {school.phone}</p>
          </div>
        </div>

        <div className="text-right text-xs">
          <p className="font-bold text-emerald-800 font-mono">Ref: {letter.officialLetterNo || letter.id}</p>
          <p className="text-slate-500">Date: {formatDate(letter.generatedDate)}</p>
        </div>
      </div>

      {/* Letter Title */}
      <div className="text-center py-2">
        <h2 className="font-display text-xl font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-300 inline-block px-4 pb-1">
          LETTER OF APPOINTMENT
        </h2>
      </div>

      {/* Salutation & Body */}
      <div className="space-y-4 text-xs sm:text-sm text-slate-800 leading-relaxed">
        <p>To,<br /><strong className="text-base text-slate-950">{letter.teacherName}</strong><br />{teacher.currentAddress}</p>

        <p>Dear <strong>{letter.teacherName}</strong>,</p>

        <p>
          With reference to your application and subsequent interview, the Management of <strong>{school.name}</strong> is pleased to offer you the position of <strong>{letter.designation}</strong> in the Department of <strong>{letter.department}</strong> on the following terms and conditions:
        </p>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs">
          <div><span className="text-slate-500">Employee ID:</span> <strong>{letter.employeeId || teacher.employeeId}</strong></div>
          <div><span className="text-slate-500">Designation:</span> <strong>{letter.designation}</strong></div>
          <div><span className="text-slate-500">Department:</span> <strong>{letter.department}</strong></div>
          <div><span className="text-slate-500">Date of Joining:</span> <strong>{formatDate(letter.joiningDate)}</strong></div>
          <div><span className="text-slate-500">Gross Salary:</span> <strong>{formatINR(letter.monthlySalary)} / month</strong></div>
          <div><span className="text-slate-500">Annual CTC:</span> <strong>{formatINR(letter.annualSalary)} / annum</strong></div>
          <div><span className="text-slate-500">Working Hours:</span> <strong>{letter.workingHours}</strong></div>
          <div><span className="text-slate-500">Reporting To:</span> <strong>{letter.reportingAuthority || 'Principal'}</strong></div>
        </div>

        {/* Initial Portal Credentials Block */}
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 space-y-2">
          <p className="font-bold text-xs uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-700" /> OFFICIAL INITIAL PORTAL ACCESS CREDENTIALS
          </p>
          <div className="grid grid-cols-3 gap-2 font-mono text-xs bg-white p-3 rounded-lg border border-emerald-200">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Employee ID</p>
              <p className="font-bold text-slate-900">{teacher.employeeId}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Username</p>
              <p className="font-bold text-slate-900">{teacher.loginCredentials.username}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Initial Temp Passcode</p>
              <p className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded inline-block">{teacher.loginCredentials.tempPassword}</p>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div>
          <p className="font-bold text-xs uppercase text-slate-900 mb-2">Terms & Conditions:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
            {letter.termsAndConditions.map((term, idx) => (
              <li key={idx}>{term}</li>
            ))}
          </ul>
        </div>

        <p className="pt-2">We welcome you to our academic family and look forward to your valuable contribution.</p>
      </div>

      {/* QR Verification & Digital ID */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="text-xs">
          <p className="font-bold text-slate-700 uppercase tracking-wider">Digital Verification</p>
          <p className="font-mono text-[10px] text-slate-500 mt-1">{letter.qrVerificationId || `QR-APT-${teacher.employeeId}`}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Scan to verify authenticity at verify.scholario.app</p>
        </div>
        <div className="h-14 w-14 rounded-lg bg-white border-2 border-slate-300 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-10 w-10 text-slate-900">
            <rect x="10" y="10" width="30" height="30" fill="currentColor" />
            <rect x="60" y="10" width="30" height="30" fill="currentColor" />
            <rect x="10" y="60" width="30" height="30" fill="currentColor" />
            <rect x="50" y="50" width="10" height="10" fill="currentColor" />
            <rect x="65" y="55" width="8" height="8" fill="currentColor" />
            <rect x="55" y="70" width="15" height="15" fill="currentColor" />
            <rect x="75" y="65" width="10" height="10" fill="currentColor" />
            <rect x="70" y="80" width="12" height="12" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* Signatures & Seal */}
      <div className="pt-8 border-t border-slate-200 flex items-center justify-between flex-wrap gap-6">
        <div>
          <div className="h-10 border-b border-dashed border-slate-400 w-48 mb-1" />
          <p className="font-bold text-xs text-slate-900">{letter.teacherName}</p>
          <p className="text-[10px] text-slate-500">Teacher Signature & Acceptance</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-emerald-600 bg-emerald-50 text-[10px] font-bold text-emerald-800 text-center uppercase p-1">
            Official School Stamp
          </div>
          <div>
            <div className="h-10 border-b border-dashed border-slate-400 w-48 mb-1 flex items-end justify-center pb-1 text-xs font-serif italic font-bold text-emerald-900">
              {letter.principalName}
            </div>
            <p className="font-bold text-xs text-slate-900">{letter.principalName}</p>
            <p className="text-[10px] text-slate-500">Principal, {school.name}</p>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onClose} className="text-slate-700 border-slate-300">Close</Button>
        <Button
          onClick={() => {
            toast.success('Appointment letter sent to print stream / PDF download triggered')
          }}
          className="bg-emerald-700 hover:bg-emerald-800 text-white"
        >
          <Printer className="h-3.5 w-3.5" /> Download / Print Official Letter PDF
        </Button>
      </div>
    </div>
  )
}
