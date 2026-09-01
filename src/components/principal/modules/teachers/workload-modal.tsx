'use client'

import { BookOpen } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { TeacherRecord } from '@/lib/store/teachers-store'
import { workloadClassOptions, workloadSubjectOptions } from './add-teacher-data'

interface Props {
  open: boolean
  onClose: () => void
  selectedTeacher: TeacherRecord | null
  teachers: TeacherRecord[]
  selectedClasses: string[]
  setSelectedClasses: React.Dispatch<React.SetStateAction<string[]>>
  selectedSubjects: string[]
  setSelectedSubjects: React.Dispatch<React.SetStateAction<string[]>>
  onReplaceConflictTeacher: (conflictTeacherId: string, newSubjects: string[], newClasses: string[]) => void
  onSave: () => void
}

/**
 * Class & Subject Allocation modal — lets the principal reassign a
 * teacher's subjects and classes, with live conflict detection against
 * other active teachers and a one-click "Replace Teacher" action.
 */
export function WorkloadAllocationModal({
  open, onClose, selectedTeacher, teachers,
  selectedClasses, setSelectedClasses,
  selectedSubjects, setSelectedSubjects,
  onReplaceConflictTeacher, onSave,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-base font-bold">
            <BookOpen className="h-5 w-5 text-primary" /> Class & Subject Allocation
          </DialogTitle>
          <DialogDescription className="text-xs">
            Assign classes and subjects for {selectedTeacher?.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Registration Powers & Roles */}
          {selectedTeacher && (
            <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Faculty Designation & Roles</p>
                  <p className="font-bold text-foreground text-xs mt-0.5">{selectedTeacher.designation} · {selectedTeacher.department}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedTeacher.positions.filter(p => p.status === 'Active').map(p => (
                    <Badge key={p.id} variant="secondary" className="text-[10px] bg-emerald-600 text-white font-semibold">
                      {p.positionTitle} {p.classAssigned ? `(${p.classAssigned})` : ''}
                    </Badge>
                  ))}
                  {selectedTeacher.positions.filter(p => p.status === 'Pending Acceptance').map(p => (
                    <Badge key={p.id} variant="outline" className="text-[10px] border-amber-500 text-amber-700 bg-amber-50">
                      Pending: {p.positionTitle} {p.classAssigned ? `(${p.classAssigned})` : ''}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                💡 <strong>Permissions Sync:</strong> Assigned subjects & classes grant <strong>Marks Entry</strong> for those specific classes. Class Teacher / Assistant Class Teacher appointments (assigned via Classes & Sections) grant <strong>Full Class Marksheets</strong>, <strong>Fee Status Monitoring</strong>, and <strong>Fee Payment Collection</strong>.
              </p>
            </div>
          )}

          {/* Assigned Classes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-bold">Assigned Classes ({selectedClasses.length})</Label>
              <span className="text-[10px] text-muted-foreground font-mono">Multiple allowed</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
              {workloadClassOptions.map((cls) => {
                const isAssigned = selectedClasses.includes(cls)
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => {
                      setSelectedClasses((prev) =>
                        isAssigned ? prev.filter((c) => c !== cls) : [...prev, cls]
                      )
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                      isAssigned
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                        : 'border-border bg-card/40 hover:bg-accent text-muted-foreground'
                    )}
                  >
                    {cls} {isAssigned && '✓'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Assigned Subjects */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-bold">Assigned Subjects ({selectedSubjects.length})</Label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {workloadSubjectOptions.map((sub) => {
                const isAssigned = selectedSubjects.includes(sub)
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      setSelectedSubjects((prev) =>
                        isAssigned ? prev.filter((s) => s !== sub) : [...prev, sub]
                      )
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                      isAssigned
                        ? 'bg-primary text-primary-foreground border-primary font-bold'
                        : 'border-border bg-card/40 hover:bg-accent text-muted-foreground'
                    )}
                  >
                    {sub} {isAssigned && '✓'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Class & Subject Conflict Detection & Replacement Matrix */}
          {selectedClasses.length > 0 && selectedSubjects.length > 0 && selectedTeacher && (
            <div className="pt-2 border-t border-border space-y-2">
              <Label className="text-xs font-bold text-foreground">Allocation Status & Conflicts Check</Label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {selectedClasses.flatMap((cls) =>
                  selectedSubjects.map((sub) => {
                    const conflictTeacher = teachers.find(
                      (t) => t.id !== selectedTeacher.id && t.status === 'Active' && t.classes.includes(cls) && t.subjects.includes(sub)
                    )

                    return (
                      <div
                        key={`${cls}-${sub}`}
                        className={cn(
                          'p-2 rounded-lg border text-xs flex items-center justify-between gap-2',
                          conflictTeacher
                            ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                            : 'border-border bg-muted/30 text-muted-foreground'
                        )}
                      >
                        <div>
                          <span className="font-bold text-foreground">{cls}</span> · <span>{sub}</span>
                          {conflictTeacher ? (
                            <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5">
                              Assigned to: <strong>{conflictTeacher.name}</strong> ({conflictTeacher.employeeId})
                            </p>
                          ) : (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                              Available for allocation
                            </p>
                          )}
                        </div>

                        {conflictTeacher && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[10px] h-7 px-2 border-amber-400 hover:bg-amber-100 text-amber-900"
                            onClick={() => {
                              onReplaceConflictTeacher(
                                conflictTeacher.id,
                                conflictTeacher.subjects.filter((s) => s !== sub),
                                conflictTeacher.classes
                              )
                              toast.success(`Replaced ${conflictTeacher.name}`, {
                                description: `${sub} in ${cls} is now allocated to ${selectedTeacher.name}.`,
                              })
                            }}
                          >
                            Replace Teacher
                          </Button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} className="bg-primary text-primary-foreground font-semibold">
            Save Allocations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
