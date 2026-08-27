'use client'

// Teacher Assignments module — composition root.
//
// Owns the assignment selection state (shared with the submissions dialog),
// the grade-target state (shared with the grade dialog), the create dialog
// open state, and the per-assignment submission state map (graded rows are
// patched in-place when the teacher submits a grade).

import { useState } from 'react'
import { ClipboardList, Plus } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { assignments, type Assignment } from '@/lib/mock/academics'
import { toast } from 'sonner'
import { makeSubmissions, type Submission } from './data'
import { AssignmentsKpiRow } from './kpi-row'
import { AssignmentCard } from './assignment-card'
import { SubmissionsDialog } from './submissions-dialog'
import { CreateAssignmentDialog, initialCreateForm, type CreateFormState } from './create-dialog'
import { GradeSubmissionDialog, type GradeFormState } from './grade-dialog'

export function AssignmentsModule() {
  const myAssignments = assignments.filter((a) => a.subject === 'Mathematics' || a.subject === 'Computer Science')
  const allAssignments = assignments
  const [selected, setSelected] = useState<Assignment | null>(null)
  const [gradeTarget, setGradeTarget] = useState<{ asg: Assignment; sub: Submission } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>(() => {
    const init: Record<string, Submission[]> = {}
    allAssignments.forEach((a) => { init[a.id] = makeSubmissions(a.id, a.marks) })
    return init
  })

  const [createForm, setCreateForm] = useState<CreateFormState>(initialCreateForm)

  const [gradeForm, setGradeForm] = useState<GradeFormState>({
    obtained: '', remarks: '',
    rubricScores: ['8', '4', '4', '4'],
  })

  const handleCreate = () => {
    if (!createForm.title.trim() || !createForm.dueDate) {
      toast.error('Please fill title and due date')
      return
    }
    const validRubric = createForm.rubric.filter((r) => r.trim())
    if (validRubric.length < 2) {
      toast.error('Add at least 2 rubric criteria')
      return
    }
    toast.success('Assignment created', {
      description: `${createForm.title} · ${createForm.marks} marks · ${validRubric.length} rubric criteria`,
    })
    setCreateOpen(false)
    setCreateForm(initialCreateForm)
  }

  const openGrade = (asg: Assignment, sub: Submission) => {
    setGradeForm({
      obtained: sub.obtained?.toString() ?? '',
      remarks: sub.remarks ?? '',
      rubricScores: asg.rubric.map((r) => {
        const m = parseInt(r.match(/\((\d+)\)/)?.[1] ?? '5')
        return Math.max(0, m - (sub.obtained ? Math.floor((asg.marks - sub.obtained) / asg.rubric.length) : 0)).toString()
      }),
    })
    setGradeTarget({ asg, sub })
  }

  const handleGrade = () => {
    if (!gradeTarget) return
    const total = gradeForm.rubricScores.reduce((a, b) => a + (parseInt(b) || 0), 0)
    setSubmissions((prev) => ({
      ...prev,
      [gradeTarget.asg.id]: prev[gradeTarget.asg.id].map((s) =>
        s.rollNo === gradeTarget.sub.rollNo
          ? { ...s, status: 'Graded', obtained: total, remarks: gradeForm.remarks || 'Graded.' }
          : s
      ),
    }))
    toast.success('Submission graded', {
      description: `${gradeTarget.sub.name} · ${total}/${gradeTarget.asg.marks} marks`,
    })
    setGradeTarget(null)
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Assignments"
        subtitle="Create graded assignments, define rubrics & evaluate submissions"
        icon={<ClipboardList className="h-5 w-5" />}
        action={
          <Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600">
            <Plus className="h-4 w-4" /> Create Assignment
          </Button>
        }
      />

      <AssignmentsKpiRow myAssignments={myAssignments} toGrade={9} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {myAssignments.map((a, i) => (
          <AssignmentCard
            key={a.id}
            a={a}
            submissions={submissions[a.id] ?? []}
            onSelect={() => setSelected(a)}
            index={i}
          />
        ))}
      </div>

      <SubmissionsDialog
        selected={selected}
        submissions={selected ? (submissions[selected.id] ?? []) : []}
        onClose={() => setSelected(null)}
        onGrade={openGrade}
      />

      <CreateAssignmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        form={createForm}
        setForm={setCreateForm}
        onCreate={handleCreate}
      />

      <GradeSubmissionDialog
        target={gradeTarget}
        form={gradeForm}
        setForm={setGradeForm}
        onClose={() => setGradeTarget(null)}
        onGrade={handleGrade}
      />
    </div>
  )
}

export default AssignmentsModule
