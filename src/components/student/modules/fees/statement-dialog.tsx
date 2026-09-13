'use client'

/**
 * fees/statement-dialog — VIEW FEE STATEMENT (FEES-R §15).
 *
 * An accessible dialog (Radix → role=dialog + aria-modal + Escape close)
 * previewing the official fee statement document on an A4-style iframe,
 * with [Print] (iframe print — the pattern the report card uses) and
 * [Download] (real .html file via the shared download-file helper, the
 * same Blob mechanics as downloadReceiptA5). The document is built from
 * the CURRENT ledger state each time the dialog opens.
 */

import { useMemo, useRef } from 'react'
import { Download, Printer } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { downloadHTMLFile } from '@/lib/download-file'
import { buildFeeStatementHTML, statementFileName, type FeeStatementInput } from './statement-html'
import { sessionChipLabel } from './derive'

interface StatementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Ledger snapshot — assembled by the module from the ONE ledger. */
  input: FeeStatementInput | null
}

export function StatementDialog({ open, onOpenChange, input }: StatementDialogProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Rebuilt on every open — the statement always reflects the live ledger.
  const html = useMemo(() => (open && input ? buildFeeStatementHTML(input) : ''), [open, input])
  const fileName = input ? statementFileName(input.student.name, input.session) : 'fee_statement.html'

  const handleDownload = () => {
    downloadHTMLFile(html, fileName)
    toast.success('Fee statement downloaded', { description: `${fileName} — open it and print directly.` })
  }

  const handlePrint = () => {
    const w = iframeRef.current?.contentWindow
    if (w) {
      try {
        w.focus()
        w.print()
        return
      } catch {
        // fall through to the file download
      }
    }
    downloadHTMLFile(html, fileName)
    toast.info('Statement saved', { description: 'Open the downloaded file and print it.' })
  }

  if (!input) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400" aria-hidden>
              <Printer className="h-3.5 w-3.5" />
            </span>
            Fee Statement — {sessionChipLabel(input.session)}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Official ledger statement · {input.student.name} · {input.student.classSection}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto bg-muted/40 p-4">
          <iframe
            ref={iframeRef}
            title={`Fee statement preview — ${input.student.name}`}
            srcDoc={html}
            className={cn('h-[62vh] w-full rounded-lg border border-border bg-white shadow-sm')}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button size="sm" variant="outline" onClick={handlePrint} className="h-9 gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <Button size="sm" onClick={handleDownload} className="h-9 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
