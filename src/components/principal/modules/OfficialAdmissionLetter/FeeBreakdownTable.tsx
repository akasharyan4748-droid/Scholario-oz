import { FileText } from 'lucide-react'
import { formatINR } from '@/lib/format'
import type { AdmissionLetterData } from './types'

/** Official fee breakdown table with subtotal, discount and final payable amount. */
export function FeeBreakdownTable({ data }: { data: AdmissionLetterData }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-emerald-600" /> Official Fee Summary & Receipt Status
        </h3>
        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          STATUS: PAID IN FULL (RCP-ADM-{data.admissionNo})
        </span>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
          {/* Detailed breakdown showing subtotal & discounts */}
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
              <tr>
                <th className="p-2.5">Fee Head / Component</th>
                <th className="p-2.5 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="p-2">Registration Fee</td>
                <td className="p-2 text-right font-mono">{formatINR(data.fees.registrationFee || 0)}</td>
              </tr>
              <tr>
                <td className="p-2">Admission Fee (One-Time)</td>
                <td className="p-2 text-right font-mono">{formatINR(data.fees.admissionFee)}</td>
              </tr>
              <tr>
                <td className="p-2">Annual Tuition Fee</td>
                <td className="p-2 text-right font-mono">{formatINR(data.fees.tuitionFee)}</td>
              </tr>
              {(data.fees.booksTotal || 0) > 0 && (
                <tr>
                  <td className="p-2">Selected Textbooks & Course Material Package</td>
                  <td className="p-2 text-right font-mono">{formatINR(data.fees.booksTotal || 0)}</td>
                </tr>
              )}
              {(data.fees.examFee || 0) > 0 && (
                <tr>
                  <td className="p-2">Examination & Assessment Group Charges</td>
                  <td className="p-2 text-right font-mono">{formatINR(data.fees.examFee || 0)}</td>
                </tr>
              )}
              <tr className="bg-slate-50 font-bold text-slate-800">
                <td className="p-2">Fee Subtotal</td>
                <td className="p-2 text-right font-mono">{formatINR(data.fees.subtotal || data.fees.totalAnnualFee || 0)}</td>
              </tr>
              {((data.fees.discountAmount || 0) > 0 || (data.fees.discountApplied || 0) > 0) && (
                <tr className="bg-emerald-50/70 text-emerald-900 font-bold">
                  <td className="p-2 flex items-center justify-between">
                    <span>Discount / Concession ({data.fees.discountName || 'Approved Concession'})</span>
                    <span className="text-[10px] font-mono text-emerald-700">AUTHORISED</span>
                  </td>
                  <td className="p-2 text-right font-mono text-emerald-800">- {formatINR(data.fees.discountAmount || data.fees.discountApplied || 0)}</td>
                </tr>
              )}
              <tr className="bg-slate-900 text-white font-extrabold text-sm">
                <td className="p-2.5 uppercase tracking-wider">Final Payable Amount Paid</td>
                <td className="p-2.5 text-right font-mono text-emerald-400">{formatINR(data.fees.finalPayable)}</td>
              </tr>
            </tbody>
          </table>
      </div>
    </div>
  )
}
