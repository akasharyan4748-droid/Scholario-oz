'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/shared/ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { school } from '@/lib/mock/school'
import { formatNumber } from '@/lib/format'
import { toast } from 'sonner'
import { useStudentsStore, getVirtualOccupied, type StudentRecord, type ClassRecord } from '@/lib/store/students-store'
import { ModuleHeader } from './shared/module-header'
import { SegmentedTabs } from './shared/segmented-tabs'
import { OverviewTab } from './students/overview-tab'
import { DirectoryTab } from './students/directory-tab'
import { ArchivedTab } from './students/archived-tab'
import { StudentProfileSheet } from './students/student-profile'
import { ClassesView } from './classes'
import { ClassDetailsPage } from './classes/class-details'

export type UnifiedTab = 'overview' | 'directory' | 'classes' | 'archived'

export function StudentsClassesModule({ initialTab = 'overview' }: { initialTab?: UnifiedTab }) {
  const store = useStudentsStore()
  const [activeTab, setActiveTab] = useState<UnifiedTab>(initialTab)
  const [selectedClass, setSelectedClass] = useState<ClassRecord | null>(null)
  const [profileStudent, setProfileStudent] = useState<StudentRecord | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<StudentRecord | null>(null)
  const [archiveReason, setArchiveReason] = useState('Graduation')
  const [transferTarget, setTransferTarget] = useState<StudentRecord | null>(null)
  const [transferToClass, setTransferToClass] = useState('')

  useEffect(() => { if (initialTab) setActiveTab(initialTab) }, [initialTab])

  const openProfile = (student: StudentRecord) => {
    const fresh = store.students.find((s) => s.id === student.id) ?? student
    setProfileStudent(fresh); setProfileOpen(true)
  }
  const confirmArchive = () => {
    if (!archiveTarget) return
    store.archiveStudent(archiveTarget.id, archiveReason, 'Dr. Ananya Iyer')
    toast.success(`${archiveTarget.name} archived`)
    setProfileOpen(false); setArchiveTarget(null)
  }
  const handleRestore = (s: StudentRecord) => {
    store.restoreStudent(s.id, 'Dr. Ananya Iyer')
    toast.success(`${s.name} restored`); setProfileOpen(false)
  }
  const confirmTransfer = () => {
    if (!transferTarget || !transferToClass) { toast.error('Select target class'); return }
    store.transferStudent(transferTarget.id, 'Class Change', transferToClass, 'Class Change requested', 'Dr. Ananya Iyer')
    toast.success(`${transferTarget.name} transferred`); setTransferTarget(null); setProfileOpen(false)
  }

  const totalStudents = store.classes.reduce(
    (a, c) => a + c.sections.reduce((sa, s) => sa + getVirtualOccupied(s.id, s.capacity), 0), 0,
  )

  // ─── CLASS DETAILS: full-page, no parent tabs ───
  if (selectedClass) {
    return (
      <ClassDetailsPage
        cls={selectedClass}
        onBack={() => setSelectedClass(null)}
        store={store}
      />
    )
  }

  return (
    <PageTransition className="space-y-4">
      <ModuleHeader
        meta={[`${formatNumber(totalStudents)} students`, `${store.classes.length} classes`, `AY ${school.academicYear}`]}
        actions={
          <SegmentedTabs
            tabs={[
              { value: 'overview', label: 'Overview' },
              { value: 'directory', label: 'Directory' },
              { value: 'classes', label: 'Classes' },
              { value: 'archived', label: 'Archived' },
            ]}
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as UnifiedTab)}
          />
        }
      />

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
          {activeTab === 'overview' && (
            <OverviewTab store={store} onStudentClick={openProfile} onNavigateToClasses={() => setActiveTab('classes')} />
          )}
          {activeTab === 'directory' && (
            <DirectoryTab students={store.students.filter((s) => s.status === 'Active')} classes={store.classes} onStudentClick={openProfile} />
          )}
          {activeTab === 'classes' && (
            <ClassesView onOpenClass={setSelectedClass} />
          )}
          {activeTab === 'archived' && (
            <UnifiedArchivedView
              archivedStudents={store.students.filter((s) => s.status === 'Archived')}
              archivedClasses={store.classes.filter((c) => c.status === 'Archived')}
              onRestoreStudent={handleRestore}
              onViewStudent={openProfile}
              onOpenClass={setSelectedClass}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <StudentProfileSheet
        student={profileStudent} open={profileOpen} onOpenChange={setProfileOpen}
        onArchive={(s) => { setArchiveTarget(s); setArchiveReason('Graduation') }}
        onRestore={handleRestore}
        onTransfer={(s) => { setTransferTarget(s); setTransferToClass('') }}
      />

      {/* Archive Dialog */}
      <Dialog open={!!archiveTarget} onOpenChange={(o) => !o && setArchiveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Archive Student</DialogTitle>
            <DialogDescription className="text-xs">{archiveTarget?.name} will be moved to Archived. All records preserved.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs font-medium mb-1.5 block">Reason</Label>
            <Select value={archiveReason} onValueChange={setArchiveReason}>
              <SelectTrigger className="w-full text-xs h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Graduation">Graduation</SelectItem>
                <SelectItem value="School Transfer">School Transfer</SelectItem>
                <SelectItem value="Relocation">Family Relocation</SelectItem>
                <SelectItem value="Withdrawal">Withdrawal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setArchiveTarget(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={confirmArchive}>Archive Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={!!transferTarget} onOpenChange={(o) => !o && setTransferTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Transfer Student</DialogTitle>
            <DialogDescription className="text-xs">Move {transferTarget?.name} to a different class.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs font-medium mb-1.5 block">Target Class</Label>
            <Select value={transferToClass} onValueChange={setTransferToClass}>
              <SelectTrigger className="w-full text-xs h-9"><SelectValue placeholder="Select class…" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {store.classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
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

/* ============================================================
   UNIFIED ARCHIVED VIEW — Students + Classes with session selector
   ============================================================ */
function UnifiedArchivedView({
  archivedStudents, archivedClasses, onRestoreStudent, onViewStudent, onOpenClass,
}: {
  archivedStudents: StudentRecord[]
  archivedClasses: ClassRecord[]
  onRestoreStudent: (s: StudentRecord) => void
  onViewStudent: (s: StudentRecord) => void
  onOpenClass: (c: ClassRecord) => void
}) {
  const [session, setSession] = useState('2025-2026')

  return (
    <div className="space-y-4">
      {/* Session selector — compact, secondary */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Academic Session:</span>
        <Select value={session} onValueChange={setSession}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2025-2026">2025–2026</SelectItem>
            <SelectItem value="2024-2025">2024–2025</SelectItem>
            <SelectItem value="2023-2024">2023–2024</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Archived Students */}
      <div>
        <h3 className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Archived Students ({archivedStudents.length})</h3>
        {archivedStudents.length > 0 ? (
          <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
            {archivedStudents.map((s) => (
              <div key={s.id} className="px-4 py-2.5 bg-card hover:bg-muted/30 transition-colors flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs font-semibold">{s.avatar}</div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.admissionNo} · {s.className}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => onViewStudent(s)}>View</Button>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onRestoreStudent(s)}>Restore</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-4">No archived students for {session}.</p>
        )}
      </div>

      {/* Archived Classes */}
      <div className="pt-3 border-t border-border">
        <h3 className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Archived Classes ({archivedClasses.length})</h3>
        {archivedClasses.length > 0 ? (
          <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
            {archivedClasses.map((c) => (
              <div key={c.id} onClick={() => onOpenClass(c)} className="px-4 py-2.5 bg-card hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs font-semibold">{c.name.slice(0, 2)}</div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.level} · {c.sections.length} sections</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">Archived</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-4">No archived classes for {session}.</p>
        )}
      </div>
    </div>
  )
}
