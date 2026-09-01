import { CheckCircle2 } from 'lucide-react'
import { school } from '@/lib/mock/school'
import type { AdmissionLetterData } from './types'

/** Digital verification panel: document ID, verification id, and seal/stamp placeholder. */
export function DigitalVerification({ data }: { data: AdmissionLetterData }) {
  return (
    <div className="mb-6 p-4 rounded-2xl border border-slate-200 bg-slate-50/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase block">Document Identification</span>
        <p className="font-mono font-bold text-slate-800">DOC-ADM-2026-{data.admissionNo}</p>
        <p className="text-[10px] text-slate-500 font-mono">Generated: 27-JUL-2026 10:22:18 UTC</p>
      </div>

      <div className="space-y-1 sm:border-x border-slate-200 sm:px-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase block">Digital Verification ID</span>
        <p className="font-mono text-[10px] text-slate-600 truncate">{data.digitalVerificationId || `VER-2026-${data.admissionNo.slice(-4)}`}</p>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
          <CheckCircle2 className="h-3 w-3" /> Digitally Verified
        </span>
      </div>

      {/* Institutional Seal Placeholder */}
      <div className="flex items-center justify-center sm:justify-end">
        <div className="h-16 w-16 rounded-full border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-center p-1 text-slate-400 relative">
          <div className="h-12 w-12 rounded-full border border-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-500 uppercase leading-tight tracking-tighter">
            SEAL & STAMP
          </div>
        </div>
      </div>
    </div>
  )
}

/** Statutory declaration paragraph. */
export function StatutoryDeclaration({ data }: { data: AdmissionLetterData }) {
  return (
    <p className="text-[10px] text-slate-500 leading-relaxed mb-8 italic text-center">
      &quot;I hereby confirm that the above student has been formally admitted to {school.name} for the Academic Session {data.academicSession}. All documents submitted have been verified against original CBSE & State Board specifications.&quot;
    </p>
  )
}

/** Signatures area — parent / guardian and principal. */
export function Signatures({ data, principalName }: { data: AdmissionLetterData; principalName: string }) {
  return (
    <div className="grid grid-cols-2 gap-8 text-center border-t border-slate-300 pt-6">
      <div>
        <div className="h-12 flex items-end justify-center">
          <span className="font-serif italic font-bold text-slate-800 text-sm border-b border-slate-400 px-4">
            {data.parents.fatherName || 'Rajiv M.'}
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase text-slate-600 block mt-1">Parent / Guardian Signature</span>
      </div>

      <div>
        <div className="h-12 flex items-end justify-center">
          <span className="font-serif italic font-bold text-slate-800 text-sm border-b border-slate-400 px-4">
            {principalName}
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase text-slate-600 block mt-1">Principal Signature</span>
      </div>
    </div>
  )
}
