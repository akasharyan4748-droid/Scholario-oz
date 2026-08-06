import { Lock, QrCode, ShieldCheck } from 'lucide-react'
import type { AdmissionLetterData } from './types'

/** Student portal access & onboarding credentials card with QR code and security notice. */
export function PortalCredentialsCard({ data }: { data: AdmissionLetterData }) {
  return (
    <div className="mb-6 p-5 rounded-2xl border-2 border-teal-200 bg-gradient-to-r from-teal-50/80 via-white to-emerald-50/80 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-3 border-b border-teal-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-600 text-white shadow-xs">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-950">
              Student Portal Access & Onboarding Credentials
            </h3>
            <p className="text-[10px] text-slate-500">Official Login Passkey for Scholario Student Mobile App & Web Portal</p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded border border-teal-200">
          ID: {data.credentials?.loginId || data.admissionNo}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs mb-3">
        <div className="bg-white p-3 rounded-xl border border-teal-100 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Portal Web Address</span>
          <span className="font-mono font-bold text-teal-950 text-xs">portal.scholario.app</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-teal-100 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Student Login ID</span>
          <span className="font-mono font-black text-slate-900 text-xs">{data.credentials?.loginId || data.admissionNo}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-teal-100 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Temporary Password</span>
          <span className="font-mono font-black text-emerald-700 text-xs">{data.credentials?.tempPassword || 'Pass@2026'}</span>
        </div>
        <div className="bg-slate-900 text-white p-2.5 rounded-xl flex items-center justify-between gap-2">
          <div>
            <span className="text-[9px] font-bold text-teal-300 uppercase block">QR Login</span>
            <span className="text-[10px] text-slate-300">Scan to auto-fill</span>
          </div>
          <div className="h-9 w-9 rounded-md bg-white p-1 shrink-0 flex items-center justify-center">
            <QrCode className="h-7 w-7 text-slate-900" />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-900">
        <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong className="font-bold">Security Notice:</strong> Please log in at <span className="underline font-semibold">portal.scholario.app</span> immediately and change your temporary password. Do not disclose these credentials to unauthorized personnel.
        </p>
      </div>
    </div>
  )
}
