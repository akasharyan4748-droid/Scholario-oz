'use client'

import { FileText } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { exams, type Exam } from '@/lib/mock/academics'
import { students } from '@/lib/mock/students'

// Examination + Subject + Class selectors shown above the marks table.
// `exam` (the resolved Exam object) is used to render the meta row below the
// selectors (type, dates, status badge).
export function SelectorsBar({
  examId,
  subject,
  onExamChange,
  onSubjectChange,
  exam,
}: {
  examId: string
  subject: string
  onExamChange: (id: string) => void
  onSubjectChange: (s: string) => void
  exam: Exam | undefined
}) {
  return (
    <GlassCard className="p-3 sm:p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider">Examination</Label>
          <Select value={examId} onValueChange={onExamChange}>
            <SelectTrigger className="w-full h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {exams.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider">Subject</Label>
          <Select value={subject} onValueChange={onSubjectChange}>
            <SelectTrigger className="w-full h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Mathematics">Mathematics</SelectItem>
              <SelectItem value="Computer Science">Computer Science</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider">Class · Section</Label>
          <div className="flex h-9 items-center rounded-md border border-input bg-muted/30 px-3 text-sm">
            <span className="font-medium">Class 2-A</span>
            <span className="ml-auto text-xs text-muted-foreground">{students.length} students</span>
          </div>
        </div>
      </div>
      {exam && (
        <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Type: <span className="font-medium text-foreground">{exam.type}</span></span>
          <span>·</span>
          <span>Dates: <span className="font-medium text-foreground">{new Date(exam.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(exam.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
          <span>·</span>
          <StatusBadge status={exam.status} variant={exam.status === 'Result Declared' ? 'success' : exam.status === 'Completed' ? 'info' : 'warning'} dot />
        </div>
      )}
    </GlassCard>
  )
}
