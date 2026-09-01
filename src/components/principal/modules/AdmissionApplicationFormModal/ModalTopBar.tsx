import { Printer, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Top control bar — title, print button and close (hidden on print). */
export function ModalTopBar({ onPrint, onClose }: { onPrint: () => void; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 no-print">
      <div className="flex items-center gap-2.5">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-base text-foreground">Admission Application Form</h3>
          <p className="text-xs text-muted-foreground">
            Official 2-Page A4 Printable Blank Form · Updates automatically with School Settings
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onPrint}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md"
        >
          <Printer className="h-4 w-4 mr-1.5" /> Print / Save as PDF (A4)
        </Button>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
