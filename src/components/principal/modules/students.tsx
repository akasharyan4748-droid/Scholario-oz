'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, Users, Layers, RotateCcw, ShieldCheck, Bus } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { school } from '@/lib/mock/school'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useStudentsStore, getVirtualOccupied, type StudentRecord } from '@/lib/store/students-store'
import { ModuleHeader } from './shared/module-header'
import { OverviewTab } from './students/overview-tab'
import { DirectoryTab } from './students/directory-tab'
import { ArchivedTab } from './students/archived-tab'
import { StudentProfileSheet } from './students/student-profile'

export type StudentsTabKey = 'overview' | 'directory' | 'archived'

interface StudentsModuleProps {
  initialTab?: StudentsTabKey
}

export function StudentsModule({ initialTab = 'overview' }: StudentsModuleProps) {
  const store = useStudentsStore()
  const [activeTab, setActiveTab] = useState<StudentsTabKey>(initialTab)
  const [profileStudent, setProfileStudent] = useState<StudentRecord | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<StudentRecord | null>(null)
  const [archiveReason, setArchiveReason] = useState('Graduation')
  const [transferTarget, setTransferTarget] = useState<StudentRecord | null>(null)
  const [transferToClass, setTransferToClass] = useState('')

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  const openProfile = (student: StudentRecord) => {
    const fresh = store.students.find((s) => s.id === student.id) ?? student
    setProfileStudent(fresh)
    setProfileOpen(true)
  }

  const confirmArchive = () => {
    if (!archiveTarget) return
    store.archiveStudent(archiveTarget.id, archiveReason, 'Dr. Ananya Iyer')
    toast.success(`${archiveTarget.name} archived`, { description: `Reason: ${archiveReason}` })
    setProfileOpen(false)
    setArchiveTarget(null)
  }

  const handleRestore = (student: StudentRecord) => {
    store.restoreStudent(student.id, 'Dr. Ananya Iyer')
    toast.success(`${student.name} restored`)
    setProfileOpen(false)
  }

  const confirmTransfer = () => {
    if (!transferTarget || !transferToClass) {
      toast.error('Select target class')
      return
    }
    store.transferStudent(transferTarget.id, 'Class Change', transferToClass, 'Class Change requested', 'Dr. Ananya Iyer')
    toast.success(`${transferTarget.name} transferred`)
    setTransferTarget(null)
    setProfileOpen(false)
  }

  const totalStudents = store.classes.reduce(
    (a, c) => a + c.sections.reduce((sa, s) => sa + getVirtualOccupied(s.id, s.capacity), 0),
    0
  )

  return (
    <PageTransition className="space-y-4">
      <ModuleHeader
        meta={[`${formatNumber(totalStudents)} students`, `${store.classes.length} classes`, `AY ${school.academicYear}`]}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              store={store}
              onStudentClick={openProfile}
              onNavigateToClasses={() => {}}
            />
          )}

          {activeTab === 'directory' && (
            <DirectoryTab
              students={store.students.filter((s) => s.status === 'Active')}
              classes={store.classes}
              onStudentClick={openProfile}
            />
          )}

          {activeTab === 'archived' && (
            <ArchivedTab
              students={store.students.filter((s) => s.status === 'Archived')}
              onRestore={handleRestore}
              onView={openProfile}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <StudentProfileSheet
        student={profileStudent}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onArchive={(s) => { setArchiveTarget(s); setArchiveReason('Graduation') }}
        onRestore={handleRestore}
        onTransfer={(s) => { setTransferTarget(s); setTransferToClass('') }}
      />

      <Dialog open={!!archiveTarget} onOpenChange={(o) => !o && setArchiveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4.5 w-4.5 text-amber-600" /> Archive Student
            </DialogTitle>
            <DialogDescription className="text-xs">
              {archiveTarget?.name} will be moved to Archived Students. All records preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Reason</Label>
              <Select value={archiveReason} onValueChange={setArchiveReason}>
                <SelectTrigger className="w-full text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Graduation">Graduation</SelectItem>
                  <SelectItem value="School Transfer">School Transfer</SelectItem>
                  <SelectItem value="Relocation">Family Relocation</SelectItem>
                  <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-amber-300/50 bg-amber-500/10 p-2.5 text-xs text-amber-900 dark:text-amber-200">
              <ShieldCheck className="h-3.5 w-3.5 inline mr-1" />
              Records preserved: attendance, results, fees, documents, timeline.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setArchiveTarget(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={confirmArchive}>Archive Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!transferTarget} onOpenChange={(o) => !o && setTransferTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <Bus className="h-4.5 w-4.5 text-primary" /> Transfer Student
            </DialogTitle>
            <DialogDescription className="text-xs">
              Move {transferTarget?.name} to a different class.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Target Class</Label>
              <Select value={transferToClass} onValueChange={setTransferToClass}>
                <SelectTrigger className="w-full text-xs h-9"><SelectValue placeholder="Select class…" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {store.classes.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTransferTarget(null)}>Cancel</Button>
            <Button size="sm" onClick={confirmTransfer}>Confirm Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
