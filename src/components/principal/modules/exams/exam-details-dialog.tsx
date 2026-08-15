'use client'

// Exam Details dialog — shows full info for a single exam and offers
// Schedule export + View Results / Generate Result actions.

import { Calendar, BookOpen, Users, Download, Award, BarChart3 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/ui'
import { subjects } from '@/lib/mock/school'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import type { Exam } from '@/lib/mock/academics'
import { examStatusVariant, emeraldGradientBtn } from './data'
import { ExamTypeBadge, InfoTile } from './shared'

export function ExamDetailsDialog({
  exam,
  onOpenChange,
  onOpenResult,
}: {
  exam: Exam | null
  onOpenChange: (o: boolean) => void
  onOpenResult: (examId: string) => void
}) {
  return (
    <Dialog open={!!exam} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-lg">
        {exam && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <ExamTypeBadge type={exam.type} />
                <StatusBadge status={exam.status} variant={examStatusVariant[exam.status]} dot />
              </div>
              <DialogTitle>{exam.name}</DialogTitle>
              <DialogDescription>{exam.classes.join(', ')} · {exam.subjects} subjects</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2">
              <InfoTile icon={<Calendar className="h-2.5 w-2.5" />} label="Start Date" value={formatDate(exam.startDate)} />
              <InfoTile icon={<Calendar className="h-2.5 w-2.5" />} label="End Date" value={formatDate(exam.endDate)} />
              <InfoTile icon={<BookOpen className="h-2.5 w-2.5" />} label="Subjects" value={`${exam.subjects} subjects`} />
              <InfoTile icon={<Users className="h-2.5 w-2.5" />} label="Classes" value={`${exam.classes.length} class groups`} />
            </div>
            <div>
              <p className="text-xs font-semibold mb-2">Subjects Included</p>
              <div className="flex flex-wrap gap-1.5">
                {subjects.slice(0, exam.subjects).map((s) => (
                  <Badge key={s.id} variant="outline" className="text-xs">{s.name}</Badge>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => toast.success('Exam schedule exported', { description: `${exam.name}.pdf` })}
              >
                <Download className="h-3.5 w-3.5" /> Schedule
              </Button>
              <Button
                className={emeraldGradientBtn}
                onClick={() => { onOpenResult(exam.id); onOpenChange(false) }}
              >
                {exam.status === 'Result Declared' ? (
                  <><Award className="h-3.5 w-3.5" /> View Results</>
                ) : (
                  <><BarChart3 className="h-3.5 w-3.5" /> Generate Result</>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
