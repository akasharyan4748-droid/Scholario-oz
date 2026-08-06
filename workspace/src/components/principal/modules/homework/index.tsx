'use client'

import { useMemo, useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { SectionHeading, PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { homeworks, type Homework } from '@/lib/mock/academics'
import { HomeworkKpiRow } from './kpi-row'
import { HomeworkAnalytics } from './analytics'
import { HomeworkFilterBar } from './filter-bar'
import { HomeworkList } from './homework-list'
import { SubmissionsDialog } from './submissions-dialog'
import { CreateHomeworkDialog, type HomeworkForm } from './create-dialog'
import { getHomeworkMetrics, makeSubmissions, type Submission } from './data'

export function HomeworkModule() {
  const [selected, setSelected] = useState<Homework | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [subFilter, setSubFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>(() => {
    const init: Record<string, Submission[]> = {}
    homeworks.forEach((h) => { init[h.id] = makeSubmissions(h.id) })
    return init
  })

  const [form, setForm] = useState<HomeworkForm>({
    title: '', subject: 'Mathematics', className: 'Class 2-A',
    description: '', dueDate: '', attachment: '',
  })

  const filtered = useMemo(() => {
    return homeworks.filter((h) => {
      const mSub = subFilter === 'all' || h.subject === subFilter
      const mClass = classFilter === 'all' || h.className === classFilter
      const q = search.toLowerCase()
      const mSearch = !q || h.title.toLowerCase().includes(q) || h.assignedBy.toLowerCase().includes(q)
      return mSub && mClass && mSearch
    })
  }, [subFilter, classFilter, search])

  const metrics = getHomeworkMetrics()
  const uniqueSubjects = Array.from(new Set(homeworks.map((h) => h.subject)))
  const uniqueClasses = Array.from(new Set(homeworks.map((h) => h.className)))

  // setSubmissions is kept for future mutation hooks; referenced to avoid unused warnings.
  void setSubmissions

  return (
    <PageTransition className="space-y-6">
      <SectionHeading
        title="Homework Oversight"
        subtitle="Monitor homework across all teachers, classes & subjects"
        icon={<BookOpen className="h-5 w-5" />}
        action={
          <Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md">
            <Plus className="h-4 w-4" /> Assign Homework
          </Button>
        }
      />

      <HomeworkKpiRow metrics={metrics} />

      <HomeworkAnalytics totalHomework={homeworks.length} avgCompletion={metrics.avgCompletion} />

      <HomeworkFilterBar
        search={search}
        setSearch={setSearch}
        subFilter={subFilter}
        setSubFilter={setSubFilter}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
        uniqueSubjects={uniqueSubjects}
        uniqueClasses={uniqueClasses}
      />

      <HomeworkList filtered={filtered} totalCount={homeworks.length} onSelect={setSelected} />

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
        uniqueSubjects={uniqueSubjects}
      />
    </PageTransition>
  )
}
