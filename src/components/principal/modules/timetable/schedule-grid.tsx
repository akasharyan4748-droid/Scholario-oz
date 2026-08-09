'use client'

/**
 * ScheduleGrid — the hero of the Timetable workspace.
 *
 * Brief section 5 + 6 + 7: Two clear states:
 *   VIEW MODE: clean, calm, slots show subject/teacher/room. Empty periods
 *     show subtle "+" Assign (but the page feels primarily like a viewer).
 *   EDIT MODE: empty periods become clearly actionable, existing slots
 *     become editable on click via a contextual Popover editor.
 *
 * Brief section 20-25: Change indicators on affected slots (data-driven,
 *   72h TTL, only on published-affected entries).
 *
 * Brief section 33: On mobile, switches to card-based layout.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MapPin, UserCheck, Coffee, CalendarDays, Copy, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTeacherById } from '@/lib/mock/teachers'
import { CLASSES, PERIODS, type DayType, type TimetableSlot } from './data'
import { type PublishedVersion } from './timetable-store'
import { ChangeIndicator } from './change-indicator'

interface ScheduleGridProps {
  selectedDay: DayType
  selectedClass: string
  filteredSlots: TimetableSlot[]
  editMode: boolean
  publications: PublishedVersion[]
  onEditSlot: (slot: TimetableSlot) => void
  onDuplicateSlot: (slot: TimetableSlot) => void
  onRemoveSlot: (slot: TimetableSlot) => void
  onAssignPeriod: (day: DayType, period: number) => void
}

export function ScheduleGrid({
  selectedDay,
  selectedClass,
  filteredSlots,
  editMode,
  publications,
  onEditSlot,
  onDuplicateSlot,
  onRemoveSlot,
  onAssignPeriod,
}: ScheduleGridProps) {
  const visibleClasses = CLASSES.filter(
    (c) => selectedClass === 'all' || selectedClass === c
  )

  const daySlots = filteredSlots.filter((s) => s.day === selectedDay)

  const resolveTeacherName = (slot: TimetableSlot) => {
    if (slot.teacherName) return slot.teacherName
    const t = getTeacherById(slot.teacherId)
    return t?.name || 'Assigned Faculty'
  }

  return (
    <>
      {/* Section heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{selectedDay} Routine</h3>
          <span className="text-[10px] text-muted-foreground">
            {selectedClass === 'all' ? 'All Classes' : selectedClass} · {daySlots.length} periods
          </span>
        </div>
        {editMode && (
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Editing
          </span>
        )}
      </div>

      {/* Desktop: table grid (hidden on mobile) */}
      <div className="hidden lg:block rounded-lg border border-border/60 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
              <th className="p-2.5 w-28 shrink-0 text-[10px] uppercase tracking-wider">Period</th>
              {visibleClasses.map((cls) => (
                <th key={cls} className="p-2.5 min-w-[180px] border-l border-border/50 font-bold text-foreground text-[10px] uppercase tracking-wider">
                  {cls}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {PERIODS.map((p) => {
                if (p.isBreak) {
                  return (
                    <tr key={`break-${p.number}`} className="bg-muted/20">
                      <td className="p-2.5 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <Coffee className="h-3 w-3 text-amber-500 shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold text-foreground">{p.name}</p>
                            <p className="text-[9px] text-muted-foreground">{p.time}</p>
                          </div>
                        </div>
                      </td>
                      <td
                        colSpan={visibleClasses.length}
                        className="p-2.5 text-center text-[10px] font-medium text-muted-foreground/60 italic border-l border-border/50 bg-amber-500/5"
                      >
                        — {p.name} ({p.time}) —
                      </td>
                    </tr>
                  )
                }

                return (
                  <motion.tr
                    key={`period-${p.number}`}
                    initial={false}
                    className={cn(
                      'border-t border-border/40 transition-colors',
                      editMode ? 'hover:bg-accent/20' : ''
                    )}
                  >
                    <td className="p-2.5 shrink-0">
                      <p className="text-[10px] font-bold text-foreground">{p.name}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{p.time}</p>
                    </td>
                    {visibleClasses.map((cls) => {
                      const slot = daySlots.find(
                        (s) => s.period === p.number && s.className === cls
                      )
                      return (
                        <td key={`${cls}-${p.number}`} className="p-1.5 border-l border-border/50 align-top">
                          {slot ? (
                            <SlotCard
                              slot={slot}
                              teacherName={resolveTeacherName(slot)}
                              editMode={editMode}
                              publications={publications}
                              onEdit={() => onEditSlot(slot)}
                              onDuplicate={() => onDuplicateSlot(slot)}
                              onRemove={() => onRemoveSlot(slot)}
                            />
                          ) : (
                            <button
                              onClick={() => editMode && onAssignPeriod(selectedDay, p.number)}
                              className={cn(
                                'w-full rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all group',
                                editMode
                                  ? 'h-14 border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary cursor-pointer'
                                  : 'h-14 border-transparent text-muted-foreground/30 cursor-default'
                              )}
                              disabled={!editMode}
                            >
                              {editMode ? (
                                <>
                                  <Plus className="h-3 w-3 group-hover:scale-110 transition-transform" />
                                  <span className="text-[9px] font-medium">Assign</span>
                                </>
                              ) : null}
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile: card-based layout (visible below lg) */}
      <div className="lg:hidden space-y-2">
        {PERIODS.map((p) => {
          if (p.isBreak) {
            return (
              <div key={`break-${p.number}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <Coffee className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.time}</p>
                </div>
              </div>
            )
          }

          const periodSlots = daySlots.filter((s) => s.period === p.number)
          return (
            <div key={`period-${p.number}`} className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-foreground">{p.name}</span>
                  <span className="text-[9px] text-muted-foreground">{p.time}</span>
                </div>
              </div>
              {periodSlots.length === 0 ? (
                editMode ? (
                  <button
                    onClick={() => onAssignPeriod(selectedDay, p.number)}
                    className="w-full py-2.5 rounded-lg border border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-all"
                  >
                    <Plus className="h-3 w-3" />
                    <span className="text-[10px] font-medium">Assign period</span>
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-lg border border-dashed border-border/20 text-center text-[9px] text-muted-foreground/30">
                    Empty
                  </div>
                )
              ) : (
                periodSlots.map((slot) => (
                  <MobileSlotCard
                    key={slot.id}
                    slot={slot}
                    teacherName={resolveTeacherName(slot)}
                    publications={publications}
                    editMode={editMode}
                    onEdit={() => onEditSlot(slot)}
                    onRemove={() => onRemoveSlot(slot)}
                  />
                ))
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* SlotCard — desktop table cell with polished subject card design     */
/* Brief section 8 + 9 + 10: Subject prominent, teacher+room with       */
/*   small icons, tiny × in edit mode (visible only in edit mode).     */
/* ------------------------------------------------------------------ */
function SlotCard({ slot, teacherName, editMode, publications, onEdit, onDuplicate, onRemove }: {
  slot: TimetableSlot
  teacherName: string
  editMode: boolean
  publications: PublishedVersion[]
  onEdit: () => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const isLab = slot.type === 'Lab'
  const isSports = slot.type === 'Sports'

  return (
    <div
      className={cn(
        'group relative rounded-lg border p-2 transition-all',
        editMode ? 'cursor-pointer hover:shadow-sm' : 'cursor-default',
        isLab
          ? 'border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40'
          : isSports
          ? 'border-teal-500/20 bg-teal-500/5 hover:border-teal-500/40'
          : 'border-primary/20 bg-primary/5 hover:border-primary/40'
      )}
      onClick={editMode ? onEdit : undefined}
    >
      {/* Change indicator (data-driven, 72h TTL, old → new) */}
      <ChangeIndicator slotId={slot.id} publications={publications} />

      {/* Subject — primary */}
      <div className="flex items-start justify-between gap-1">
        <span className={cn(
          'font-bold text-[11px] truncate',
          isLab ? 'text-violet-700 dark:text-violet-300' : isSports ? 'text-teal-700 dark:text-teal-300' : 'text-primary'
        )}>
          {slot.subject}
        </span>
        {/* Tiny × — visible only in edit mode (Brief section 10 + 12) */}
        {editMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            title="Remove assignment"
            aria-label="Remove assignment"
            className="p-0.5 -mr-0.5 -mt-0.5 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        )}
      </div>

      {/* Teacher — secondary */}
      <p className="text-[10px] font-medium text-foreground mt-1 flex items-center gap-0.5">
        <UserCheck className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
        <span className="truncate">{teacherName}</span>
      </p>

      {/* Room — tertiary */}
      <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
        <MapPin className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
        <span className="truncate">{slot.room}</span>
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* MobileSlotCard — touch-friendly card for phone/tablet               */
/* ------------------------------------------------------------------ */
function MobileSlotCard({ slot, teacherName, publications, editMode, onEdit, onRemove }: {
  slot: TimetableSlot
  teacherName: string
  publications: PublishedVersion[]
  editMode: boolean
  onEdit: () => void
  onRemove: () => void
}) {
  const isLab = slot.type === 'Lab'
  const isSports = slot.type === 'Sports'

  return (
    <div
      className={cn(
        'relative rounded-lg border p-2.5 transition-all',
        editMode ? 'cursor-pointer active:scale-[0.98]' : '',
        isLab
          ? 'border-violet-500/20 bg-violet-500/5'
          : isSports
          ? 'border-teal-500/20 bg-teal-500/5'
          : 'border-primary/20 bg-primary/5'
      )}
      onClick={editMode ? onEdit : undefined}
    >
      <ChangeIndicator slotId={slot.id} publications={publications} />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn(
            'text-sm font-bold truncate',
            isLab ? 'text-violet-700 dark:text-violet-300' : isSports ? 'text-teal-700 dark:text-teal-300' : 'text-primary'
          )}>
            {slot.subject}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{slot.className}</p>
        </div>
        {editMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="p-1.5 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
            aria-label="Remove slot"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-border/30">
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          <UserCheck className="h-2.5 w-2.5" /> {teacherName}
        </span>
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          <MapPin className="h-2.5 w-2.5" /> {slot.room}
        </span>
      </div>
    </div>
  )
}
