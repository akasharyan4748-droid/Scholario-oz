import { Printer, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AdmissionLetterData } from './types'

/** Top action bar — confirmation badge + print/download/close buttons (hidden on print). */
export function TopActionBar({
  admissionNo,
  onPrint,
  onDownloadPdf,
  onClose,
}: {
  admissionNo: string
  onPrint: () => void
  onDownloadPdf: () => void
  onClose?: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white text-slate-900 p-4 rounded-xl print:hidden shadow-2xs border border-gray-200">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold border border-emerald-300">
          ✓
        </div>
        <div>
          <h4 className="text-sm font-bold font-display text-slate-900">Official Institutional Admission Confirmation</h4>
          <p className="text-xs text-slate-500">CBSE Affiliation Formatted Document · Admission #{admissionNo}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onPrint} size="sm" variant="outline" className="border-gray-200 bg-white text-slate-800 hover:bg-gray-50 gap-1.5 text-xs font-semibold">
          <Printer className="h-3.5 w-3.5" />
          Print Document
        </Button>
        <Button onClick={onDownloadPdf} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs font-semibold">
          <Download className="h-3.5 w-3.5" />
          Download PDF
        </Button>
        {onClose && (
          <Button onClick={onClose} size="sm" variant="ghost" className="text-slate-400 hover:text-white text-xs">
            Close
          </Button>
        )}
      </div>
    </div>
  )
}

export type { AdmissionLetterData }
