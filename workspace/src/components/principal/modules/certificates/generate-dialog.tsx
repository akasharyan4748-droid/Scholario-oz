'use client'

import { Search } from 'lucide-react'
import { GradientAvatar } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { students } from '@/lib/mock/students'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { CERTS, type CertType, type Student } from './data'
import { BonafideCert, TransferCert, CharacterCert, MigrationCert } from './document-certs'
import { IdCardCert, FeeReceipt } from './card-certs'
import { Printer, Download } from 'lucide-react'

interface GenerateDialogProps {
  activeType: CertType | null
  onClose: () => void
  student: Student
  studentId: string
  onStudentIdChange: (id: string) => void
}

/** Renders the correct preview component for the active cert type. */
function CertPreview({ type, student }: { type: CertType; student: Student }) {
  switch (type) {
    case 'bonafide': return <BonafideCert student={student} />
    case 'tc': return <TransferCert student={student} />
    case 'character': return <CharacterCert student={student} />
    case 'id': return <IdCardCert student={student} />
    case 'fee': return <FeeReceipt student={student} />
    case 'migration': return <MigrationCert student={student} />
    default: return null
  }
}

/**
 * The "Generate <CertificateType>" dialog — left rail student search/select +
 * right-pane live certificate preview + Print/Download PDF footer actions.
 */
export function GenerateDialog({
  activeType, onClose, student, studentId, onStudentIdChange,
}: GenerateDialogProps) {
  const meta = CERTS.find((c) => c.key === activeType)
  return (
    <Dialog open={!!activeType} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {meta?.icon}
            Generate {meta?.title}
          </DialogTitle>
          <DialogDescription>Select a student to preview the certificate. Download or print after preview.</DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-[200px_1fr] gap-4 items-start">
          {/* Student selector */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1.5 block">Search Student</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Name / admission no" className="pl-8 text-xs h-8" />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Select Student</Label>
              <Select value={studentId} onValueChange={onStudentIdChange}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name} · {s.className}-{s.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <GradientAvatar name={student.name} size="sm" />
                <div>
                  <p className="font-semibold">{student.name}</p>
                  <p className="text-[11px] text-muted-foreground">{student.admissionNo}</p>
                </div>
              </div>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <p><span className="text-foreground font-medium">Class:</span> {student.className}-{student.section}</p>
                <p><span className="text-foreground font-medium">Roll:</span> {student.rollNo}</p>
                <p><span className="text-foreground font-medium">Father:</span> {student.fatherName}</p>
                <p><span className="text-foreground font-medium">DOB:</span> {formatDate(student.dob)}</p>
              </div>
            </div>
          </div>

          {/* Certificate preview */}
          <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 p-4">
            {activeType && <CertPreview type={activeType} student={student} />}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => toast.success('Certificate printed', { description: `Sent to HP-LaserJet-Admin` })}
          >
            <Printer className="h-4 w-4 mr-1.5" /> Print
          </Button>
          <Button
            onClick={() => toast.success('Certificate downloaded', { description: `PDF saved to /downloads/${activeType}-${student.admissionNo}.pdf` })}
          >
            <Download className="h-4 w-4 mr-1.5" /> Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
