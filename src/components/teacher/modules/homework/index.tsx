'use client'

import { useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { homeworks, type Homework } from '@/lib/mock/academics'
import { type HomeworkForm, initialHomeworkForm, makeSubmissions, type Submission } from './data'
import { StatStrip } from './stat-strip'
import { HomeworkList } from './homework-list'
import { SubmissionsDialog } from './submissions-dialog'
import { CreateHomeworkDialog } from './create-dialog'

export function HomeworkModule() {
  const myHomeworks = homeworks.filter((h) => h.assignedBy === 'Rohan Mehta')
  const [selected, setSelected] = useState<Homework | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>(() => {
    const init: Record<string, Submission[]> = {}
    myHomeworks.forEach((h) => { init[h.id] = makeSubmissions(h.id) })
    return init
  })

  const [form, setForm] = useState<HomeworkForm>(initialHomeworkForm)

  // setSubmissions is kept for future mutation hooks; referenced to avoid unused warnings.
  void setSubmissions

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Homework"
        subtitle="Create, track & review homework assigned to your classes"
        icon={<BookOpen className="h-5 w-5" />}
        action={
          <Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600">
            <Plus className="h-4 w-4" /> Create Homework
          </Button>
        }
      />

      <StatStrip myHomeworks={myHomeworks} />

      <HomeworkList myHomeworks={myHomeworks} onSelect={setSelected} />

      <SubmissionsDialog
        selected={selected}
        onClose={() => setSelected(null)}
        submissions={submissions}
      />

      <CreateHomeworkDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        form={form}
        setForm={setForm}
      />
    </div>
  )
}
