'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { FileText, Send } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { exams } from '@/lib/mock/academics'
import { students } from '@/lib/mock/students'
import { toast } from 'sonner'
import { MAX_MARKS, seededMark, type MarksStats } from './data'
import { SaveIndicator } from './save-indicator'
import { SelectorsBar } from './selectors-bar'
import { StatStrip } from './stat-strip'
import { MarksTable } from './marks-table'
import { PublishDialog } from './publish-dialog'

// Teacher Marks Entry module entry point.
//
// `teacher-panel/module-router.tsx` imports the named `MarksEntryModule`:
//   import { MarksEntryModule } from '../modules/marks'
//
// This index owns all state (selected exam, subject, per-student mark map,
// auto-save indicator, publish dialog flow) and composes the presentational
// sub-components: SelectorsBar, StatStrip, MarksTable, PublishDialog. The
// auto-save state machine + debounced timer live here so they stay
// coordinated with mark edits.
export function MarksEntryModule() {
  const [examId, setExamId] = useState('EX02')
  const [subject, setSubject] = useState('Mathematics')
  const [marks, setMarks] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    students.forEach((s, i) => {
      init[s.id] = seededMark(i + 1, MAX_MARKS.Mathematics).toString()
    })
    return init
  })
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('saved')
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset marks when subject or exam changes — invoked directly from change handlers (no effect)
  const resetMarks = useCallback((nextSubject: string) => {
    const init: Record<string, string> = {}
    students.forEach((s, i) => {
      init[s.id] = seededMark(i + 1 + (nextSubject === 'Computer Science' ? 100 : 0), MAX_MARKS[nextSubject]).toString()
    })
    setMarks(init)
    setSaveState('saved')
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
  }, [])

  const changeSubject = (next: string) => {
    setSubject(next)
    resetMarks(next)
  }

  const changeExam = (next: string) => {
    setExamId(next)
    resetMarks(subject)
  }

  const setMark = (id: string, value: string) => {
    const num = parseInt(value)
    if (value !== '' && (isNaN(num) || num < 0 || num > MAX_MARKS[subject])) return
    setMarks((prev) => ({ ...prev, [id]: value }))
    setSaveState('idle')
  }

  // Auto-save indicator — schedule 'saved' state when entering 'idle' (debounced via timeout)
  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveState('saving')
    saveTimer.current = setTimeout(() => {
      setSaveState('saved')
      saveTimer.current = null
    }, 900)
  }, [])

  // When saveState becomes 'idle' (user typed), trigger the saving flow via a microtask
  useEffect(() => {
    if (saveState === 'idle') {
      const id = setTimeout(() => scheduleSave(), 0)
      return () => clearTimeout(id)
    }
  }, [saveState, scheduleSave])

  const stats: MarksStats = useMemo(() => {
    const valid = Object.values(marks).map((v) => parseInt(v)).filter((v) => !isNaN(v))
    const total = valid.reduce((a, b) => a + b, 0)
    const avg = valid.length ? total / valid.length : 0
    const highest = valid.length ? Math.max(...valid) : 0
    const lowest = valid.length ? Math.min(...valid) : 0
    const passCount = valid.filter((v) => v >= MAX_MARKS[subject] * 0.4).length
    return { avg, highest, lowest, passCount, total: valid.length }
  }, [marks, subject])

  const handleAutoFill = () => {
    const init: Record<string, string> = {}
    students.forEach((s, i) => {
      init[s.id] = seededMark(i + 1, MAX_MARKS[subject]).toString()
    })
    setMarks(init)
    setSaveState('idle')
    toast.success('Marks auto-filled', { description: 'Random plausible scores generated.' })
  }

  const handlePublish = () => {
    setPublishing(true)
    setTimeout(() => {
      setPublishing(false)
      setPublishOpen(false)
      toast.success('Results published successfully', {
        description: `${students.length} students · ${subject} · ${exams.find((e) => e.id === examId)?.name}`,
      })
    }, 1500)
  }

  const exam = exams.find((e) => e.id === examId)

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Marks Entry"
        subtitle="Enter & publish exam marks for your subjects"
        icon={<FileText className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2">
            <SaveIndicator state={saveState} />
            <Button onClick={() => setPublishOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600">
              <Send className="h-4 w-4" /> Publish Results
            </Button>
          </div>
        }
      />

      <SelectorsBar
        examId={examId}
        subject={subject}
        onExamChange={changeExam}
        onSubjectChange={changeSubject}
        exam={exam}
      />

      <StatStrip stats={stats} maxMarks={MAX_MARKS[subject]} />

      <MarksTable
        subject={subject}
        marks={marks}
        maxMarks={MAX_MARKS[subject]}
        onMarkChange={setMark}
        onAutoFill={handleAutoFill}
        onPublish={() => setPublishOpen(true)}
      />

      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        exam={exam}
        subject={subject}
        stats={stats}
        maxMarks={MAX_MARKS[subject]}
        publishing={publishing}
        onConfirm={handlePublish}
      />
    </div>
  )
}
