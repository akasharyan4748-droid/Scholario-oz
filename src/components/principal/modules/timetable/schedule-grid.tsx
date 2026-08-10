'use client'

/**
 * ScheduleGrid — the hero of the Timetable workspace.
 * VIEW MODE: clean, calm. EDIT MODE: actionable slots + structural controls.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Coffee, CalendarDays, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTeacherById } from '@/lib/mock/teachers'
import { CLASSES, type DayType, type TimetableSlot } from './data'
import { type PublishedVersion } from './timetable-store'
import { TimeEditor } from './time-editor'
import { RowDeleteButton, RowInsertDivider, RowInsertButton } from './structural-row-controls'
import { SlotCard, MobileSlotCard } from './slot-cards'

export interface TimetableRow {
  number: number; name: string; time: string; isBreak: boolean; breakType?: 'short' | 'lunch'
}

interface ScheduleGridProps {
  selectedDay: DayType; selectedClass: string; filteredSlots: TimetableSlot[]
  editMode: boolean; publications: PublishedVersion[]; conflictedSlotIds: Set<string>
  rows: TimetableRow[]
  onEditSlot: (slot: TimetableSlot) => void
  onDuplicateSlot: (slot: TimetableSlot) => void
  onRemoveSlot: (slot: TimetableSlot) => void
  onAssignPeriod: (day: DayType, period: number, className: string) => void
  onInsertRow: (afterRowNumber: number, type: 'period' | 'short_break' | 'lunch_break') => void
  onDeleteRow: (rowNumber: number) => void
  onEditRowTime: (rowNumber: number, newTime: string) => void
}

export function ScheduleGrid({
  selectedDay, selectedClass, filteredSlots, editMode, publications, conflictedSlotIds, rows,
  onEditSlot, onDuplicateSlot, onRemoveSlot, onAssignPeriod, onInsertRow, onDeleteRow, onEditRowTime,
}: ScheduleGridProps) {
  const visibleClasses = CLASSES.filter((c) => selectedClass === 'all' || selectedClass === c)
  const daySlots = filteredSlots.filter((s) => s.day === selectedDay)
  const resolveTeacherName = (slot: TimetableSlot) => slot.teacherName || getTeacherById(slot.teacherId)?.name || 'Assigned Faculty'
  const hasShortBreak = rows.some((r) => r.breakType === 'short')
  const hasLunchBreak = rows.some((r) => r.breakType === 'lunch')

  return (
    <>
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
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Editing
          </span>
        )}
      </div>

      {/* Desktop table — clean bordered scroll container. touch-action: pan-x
          allows horizontal touch scroll but lets vertical gestures pass to the page. */}
      <div className="hidden lg:block rounded-lg border border-border/60 overflow-x-auto overflow-y-hidden overscroll-x-contain overscroll-y-none [touch-action:pan-x]">
        <table className="text-left text-xs border-collapse w-full">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
              <th className="p-2.5 w-32 shrink-0 text-[10px] uppercase tracking-wider">Period</th>
              {visibleClasses.map((cls) => (
                <th key={cls} className={cn('p-2.5 border-l border-border/50 font-bold text-foreground text-[10px] uppercase tracking-wider', visibleClasses.length === 1 ? 'w-full' : 'min-w-[180px]')}>{cls}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {rows.map((row) => {
                if (row.isBreak) {
                  return (
                    <BreakRowDesktop key={`break-${row.number}`} row={row} editMode={editMode} colCount={visibleClasses.length}
                      onDeleteRow={onDeleteRow} onEditRowTime={onEditRowTime} onInsertRow={onInsertRow}
                      hasShortBreak={hasShortBreak} hasLunchBreak={hasLunchBreak} />
                  )
                }
                return (
                  <PeriodRowDesktop key={`period-${row.number}`} row={row} editMode={editMode} visibleClasses={visibleClasses}
                    daySlots={daySlots} selectedDay={selectedDay} publications={publications} conflictedSlotIds={conflictedSlotIds}
                    resolveTeacherName={resolveTeacherName} onEditSlot={onEditSlot} onDuplicateSlot={onDuplicateSlot}
                    onRemoveSlot={onRemoveSlot} onAssignPeriod={onAssignPeriod} onDeleteRow={onDeleteRow} onEditRowTime={onEditRowTime}
                    onInsertRow={onInsertRow} hasShortBreak={hasShortBreak} hasLunchBreak={hasLunchBreak} />
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-2">
        {rows.map((row) => row.isBreak ? (
          <BreakRowMobile key={`break-${row.number}`} row={row} editMode={editMode} onDeleteRow={onDeleteRow}
            onEditRowTime={onEditRowTime} onInsertRow={onInsertRow} hasShortBreak={hasShortBreak} hasLunchBreak={hasLunchBreak} />
        ) : (
          <PeriodRowMobile key={`period-${row.number}`} row={row} editMode={editMode} daySlots={daySlots} selectedDay={selectedDay}
            selectedClass={selectedClass} publications={publications} conflictedSlotIds={conflictedSlotIds}
            resolveTeacherName={resolveTeacherName} onEditSlot={onEditSlot} onRemoveSlot={onRemoveSlot}
            onAssignPeriod={onAssignPeriod} onDeleteRow={onDeleteRow} onEditRowTime={onEditRowTime}
            onInsertRow={onInsertRow} hasShortBreak={hasShortBreak} hasLunchBreak={hasLunchBreak} />
        ))}
      </div>
    </>
  )
}

/* ── Desktop Period Row ── */
function PeriodRowDesktop({ row, editMode, visibleClasses, daySlots, selectedDay, publications, conflictedSlotIds,
  resolveTeacherName, onEditSlot, onDuplicateSlot, onRemoveSlot, onAssignPeriod, onDeleteRow, onEditRowTime,
  onInsertRow, hasShortBreak, hasLunchBreak }: any) {
  return (
    <>
      <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
        className={cn('border-t border-border/40 transition-colors', editMode ? 'hover:bg-accent/20' : '')}>
        <td className="p-2.5 shrink-0 relative">
          {editMode && <RowDeleteButton onDelete={() => onDeleteRow(row.number)} label="period" />}
          <p className="text-[10px] font-bold text-foreground pl-4">{row.name}</p>
          {editMode ? <TimeEditor time={row.time} onSave={(t: string) => onEditRowTime(row.number, t)} />
                    : <p className="text-[9px] text-muted-foreground mt-0.5">{row.time}</p>}
        </td>
        {visibleClasses.map((cls: string) => {
          const slot = daySlots.find((s: TimetableSlot) => s.period === row.number && s.className === cls)
          return (
            <td key={`${cls}-${row.number}`} className="p-1.5 border-l border-border/50 align-top">
              {slot ? (
                <SlotCard slot={slot} teacherName={resolveTeacherName(slot)} editMode={editMode} publications={publications}
                  isConflicted={conflictedSlotIds.has(slot.id)} onEdit={() => onEditSlot(slot)}
                  onDuplicate={() => onDuplicateSlot(slot)} onRemove={() => onRemoveSlot(slot)} />
              ) : (
                <button onClick={() => editMode && onAssignPeriod(selectedDay, row.number, cls)} disabled={!editMode}
                  className={cn('w-full rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all group',
                    editMode ? 'h-14 border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary cursor-pointer'
                            : 'h-14 border-transparent text-muted-foreground/30 cursor-default')}>
                  {editMode && <><Plus className="h-3 w-3 group-hover:scale-110 transition-transform" /><span className="text-[9px] font-medium">Assign</span></>}
                </button>
              )}
            </td>
          )
        })}
      </motion.tr>
      {editMode && <RowInsertDivider afterRowNumber={row.number} hasShortBreak={hasShortBreak} hasLunchBreak={hasLunchBreak} onInsert={onInsertRow} />}
    </>
  )
}

/* ── Desktop Break Row ── */
function BreakRowDesktop({ row, editMode, colCount, onDeleteRow, onEditRowTime, onInsertRow, hasShortBreak, hasLunchBreak }: any) {
  return (
    <>
      <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-muted/20">
        <td className="p-2.5 shrink-0 relative">
          {editMode && <RowDeleteButton onDelete={() => onDeleteRow(row.number)} label="break" />}
          <div className="flex items-center gap-1.5 pl-4">
            <Coffee className="h-3 w-3 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-foreground">{row.name}</p>
              {editMode ? <TimeEditor time={row.time} onSave={(t: string) => onEditRowTime(row.number, t)} />
                        : <p className="text-[9px] text-muted-foreground">{row.time}</p>}
            </div>
          </div>
        </td>
        <td colSpan={colCount} className="p-2.5 text-center text-[10px] font-medium text-muted-foreground/60 italic border-l border-border/50 bg-amber-500/5">
          — {row.name} ({row.time}) —
        </td>
      </motion.tr>
      {editMode && <RowInsertDivider afterRowNumber={row.number} hasShortBreak={hasShortBreak} hasLunchBreak={hasLunchBreak} onInsert={onInsertRow} />}
    </>
  )
}

/* ── Mobile Period Row ── */
function PeriodRowMobile({ row, editMode, daySlots, selectedDay, selectedClass, publications, conflictedSlotIds,
  resolveTeacherName, onEditSlot, onRemoveSlot, onAssignPeriod, onDeleteRow, onEditRowTime, onInsertRow, hasShortBreak, hasLunchBreak }: any) {
  const periodSlots = daySlots.filter((s: TimetableSlot) => s.period === row.number)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-foreground">{row.name}</span>
          {editMode ? <TimeEditor time={row.time} onSave={(t: string) => onEditRowTime(row.number, t)} />
                    : <span className="text-[9px] text-muted-foreground">{row.time}</span>}
        </div>
        {editMode && <button onClick={() => onDeleteRow(row.number)} className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors" title="Delete period" aria-label="Delete period"><Trash2 className="h-3 w-3" /></button>}
      </div>
      {periodSlots.length === 0 ? (
        editMode ? (
          <button onClick={() => onAssignPeriod(selectedDay, row.number, selectedClass !== 'all' ? selectedClass : 'Class 2-A')}
            className="w-full py-2.5 rounded-lg border border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-all">
            <Plus className="h-3 w-3" /><span className="text-[10px] font-medium">Assign period</span>
          </button>
        ) : <div className="w-full py-2.5 rounded-lg border border-dashed border-border/20 text-center text-[9px] text-muted-foreground/30">Empty</div>
      ) : periodSlots.map((slot: TimetableSlot) => (
        <MobileSlotCard key={slot.id} slot={slot} teacherName={resolveTeacherName(slot)} publications={publications}
          isConflicted={conflictedSlotIds.has(slot.id)} editMode={editMode} onEdit={() => onEditSlot(slot)} onRemove={() => onRemoveSlot(slot)} />
      ))}
      {editMode && <RowInsertButton afterRowNumber={row.number} hasShortBreak={hasShortBreak} hasLunchBreak={hasLunchBreak} onInsert={onInsertRow} />}
    </div>
  )
}

/* ── Mobile Break Row ── */
function BreakRowMobile({ row, editMode, onDeleteRow, onEditRowTime, onInsertRow, hasShortBreak, hasLunchBreak }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
        <Coffee className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground">{row.name}</p>
          {editMode ? <TimeEditor time={row.time} onSave={(t: string) => onEditRowTime(row.number, t)} />
                    : <p className="text-[10px] text-muted-foreground">{row.time}</p>}
        </div>
        {editMode && <button onClick={() => onDeleteRow(row.number)} className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors" title="Delete break" aria-label="Delete break"><Trash2 className="h-3 w-3" /></button>}
      </div>
      {editMode && <RowInsertButton afterRowNumber={row.number} hasShortBreak={hasShortBreak} hasLunchBreak={hasLunchBreak} onInsert={onInsertRow} />}
    </div>
  )
}
