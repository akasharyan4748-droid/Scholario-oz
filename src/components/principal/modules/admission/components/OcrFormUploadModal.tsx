'use client'

/**
 * OCR Assisted Filled Form Upload Modal.
 * Extracted from the original admission.tsx monolith (Task ID: 21).
 *
 * Simulates an AI OCR scan of a handwritten admission form and lets the user
 * review / edit the extracted field values before applying them to the
 * admission wizard.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud, X, RefreshCw, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { FormData } from '../constants'

export function OcrFormUploadModal({
  open,
  onClose,
  onApplyData,
}: {
  open: boolean
  onClose: () => void
  onApplyData: (data: Partial<FormData>, attachment: { fileName: string; date: string; confidence: number }) => void
}) {
  const [fileUploaded, setFileUploaded] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanStep, setScanStep] = useState('')
  const [extractedFields, setExtractedFields] = useState<
    Array<{ fieldKey: keyof FormData; label: string; value: string; confidence: number }>
  >([])

  const handleSimulateScan = (fileName: string) => {
    setFileUploaded(fileName)
    setIsScanning(true)
    setScanStep('Detecting form layout & handwriting orientation…')

    setTimeout(() => {
      setScanStep('Extracting key-value pairs using AI Vision OCR…')
    }, 1000)

    setTimeout(() => {
      setScanStep('Cross-referencing address, district, & school metadata…')
    }, 2000)

    setTimeout(() => {
      setIsScanning(false)
      setExtractedFields([
        { fieldKey: 'firstName', label: 'First Name', value: 'Aarav', confidence: 98 },
        { fieldKey: 'lastName', label: 'Last Name', value: 'Sharma', confidence: 96 },
        { fieldKey: 'dob', label: 'Date of Birth', value: '2016-04-12', confidence: 95 },
        { fieldKey: 'religion', label: 'Religion', value: 'Hindu', confidence: 97 },
        { fieldKey: 'category', label: 'Category', value: 'General', confidence: 99 },
        { fieldKey: 'fatherName', label: "Father's Name", value: 'Vikram Sharma', confidence: 94 },
        { fieldKey: 'fatherPhone', label: "Father's Phone", value: '+91 98112 33445', confidence: 92 },
        { fieldKey: 'emergencyName', label: 'Emergency Person', value: 'Rajesh Sharma', confidence: 93 },
        { fieldKey: 'currentAddress', label: 'Address', value: 'B-102, Sector 45, Noida', confidence: 89 },
        { fieldKey: 'district', label: 'District', value: 'Gautam Buddha Nagar', confidence: 93 },
        { fieldKey: 'state', label: 'State', value: 'Uttar Pradesh', confidence: 97 },
        { fieldKey: 'pincode', label: 'Pincode', value: '201303', confidence: 99 },
        { fieldKey: 'previousSchool', label: 'Previous School', value: 'DPS Noida Primary', confidence: 88 },
        { fieldKey: 'previousClass', label: 'Last Class', value: 'Class 3', confidence: 91 },
        { fieldKey: 'previousYear', label: 'Attended Session', value: '2023–2025', confidence: 95 },
        { fieldKey: 'className', label: 'Applying Class', value: 'Class 4', confidence: 95 },
      ])
      toast.success('AI OCR Scan Complete', { description: '16 fields extracted. Review before populating form.' })
    }, 3000)
  }

  const handleFieldValueChange = (index: number, val: string) => {
    setExtractedFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, value: val } : f))
    )
  }

  const handleApply = () => {
    const updated: Partial<FormData> = {}
    extractedFields.forEach((f) => {
      ;(updated as any)[f.fieldKey] = f.value
    })

    onApplyData(updated, {
      fileName: fileUploaded || 'Scanned_Admission_Form.pdf',
      date: formatDate(new Date().toISOString()),
      confidence: 94,
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-foreground">Upload Filled Form (AI OCR Assisted)</h3>
              <p className="text-xs text-muted-foreground">Scan physical handwritten filled forms & auto-populate admission wizard</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Upload Zone */}
        {!fileUploaded && (
          <div className="space-y-4">
            <div
              onClick={() => handleSimulateScan('Scanned_Form_Aarav_Sharma.pdf')}
              className="border-2 border-dashed border-border hover:border-emerald-500 bg-card/40 hover:bg-emerald-500/5 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-2 group"
            >
              <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground group-hover:text-emerald-600 transition-colors" />
              <p className="text-sm font-semibold">Click to upload scanned admission form image / PDF</p>
              <p className="text-xs text-muted-foreground">Supports JPG, PNG, or PDF scans of handwritten physical forms</p>
            </div>
          </div>
        )}

        {/* Scanning Indicator */}
        {isScanning && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin" />
            <p className="font-semibold text-sm">{scanStep}</p>
            <p className="text-xs text-muted-foreground">AI OCR Vision is parsing handwriting and matching admission fields...</p>
          </div>
        )}

        {/* Extracted Results Table */}
        {!isScanning && extractedFields.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">Extracted Fields Review (Edit if necessary)</p>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                Average Confidence: 94%
              </Badge>
            </div>

            <div className="max-h-60 overflow-y-auto border border-border rounded-xl divide-y divide-border/50 text-xs">
              {extractedFields.map((f, i) => (
                <div key={f.fieldKey} className="p-2.5 flex items-center justify-between gap-3 hover:bg-muted/30">
                  <span className="w-32 font-semibold text-muted-foreground shrink-0">{f.label}</span>
                  <input
                    type="text"
                    value={f.value}
                    onChange={(e) => handleFieldValueChange(i, e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground outline-none focus:border-primary"
                  />
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[9px] shrink-0',
                      f.confidence >= 90
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    )}
                  >
                    {f.confidence}%
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setFileUploaded(null)}>
                Rescan Different File
              </Button>
              <Button onClick={handleApply} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                Apply to Admission Wizard <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
