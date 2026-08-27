'use client'

import { useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import JsBarcode from 'jsbarcode'
import { Badge } from '@/components/ui/badge'
import type { StudentRecord } from '@/lib/store/students-store'

export function StudentIdentityCodes({ student }: { student: StudentRecord }) {
  const qrValue = `SCHOLARIO:STU:${student.id}`
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-primary uppercase tracking-wider">Student Identity</p>
        <Badge variant="outline" className="text-[9px] font-mono">{student.admissionNo}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">QR Code</p>
          <div className="rounded-lg border border-border/60 bg-white p-3">
            <QRCodeSVG value={qrValue} size={96} level="M" marginSize={2} className="rounded" />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Barcode</p>
          <div className="rounded-lg border border-border/60 bg-white p-3 w-full flex flex-col items-center">
            <BarcodeDisplay value={student.admissionNo} height={32} width={1.2} />
            <p className="text-[9px] font-mono text-muted-foreground mt-1">{student.admissionNo}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function BarcodeDisplay({ value, height = 40, width = 2 }: { value: string; height?: number; width?: number }) {
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (!ref.current || !value) return
    try { JsBarcode(ref.current, value, { format: 'CODE128', height, width, displayValue: false, margin: 4, background: '#ffffff' }) } catch {}
  }, [value, height, width])
  return <svg ref={ref} className="max-w-full" />
}
