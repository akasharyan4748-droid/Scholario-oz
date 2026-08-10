'use client'

/**
 * ScheduleGrid — the hero of the Timetable workspace.
 *
 * Brief section 25 + 26: Three completely different "+" interactions:
 *   A. CELL + → assign subject/teacher to that class+period
 *   B. ROW DIVIDER + → insert new structural row (Period/Break)
 *   C. AUTO TIMETABLE → generate timetable automatically
 *
 * Brief section 11-15: Per-row time editing — clickable time text opens
 *   a compact time picker popover. Each row has independent start/end.
 *
 * Brief section 14 + 15: Tiny × on period/break rows for deletion.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Plus, MapPin, UserCheck, Coffee, CalendarDays, X, Clock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CompactTimeControls } from './compact-time-picker'
import { cn } from '@/lib/utils'
import { getTeacherById } from '@/lib/mock/teachers'
import { CLASSES, PERIODS, type DayType, type TimetableSlot } from './data'
import { type PublishedVersion } from './timetable-store'
import { ChangeIndicator } from './change-indicator'

export interface TimetableRow {
  number: number
  name: string
  time: string
  isBreak: boolean
  breakType?: 'short' | 'lunch'
}

interface ScheduleGridProps {
  selectedDay: DayType
  selectedClass: string
  filteredSlots: TimetableSlot[]
  editMode: boolean
  publications: PublishedVersion[]
  conflictedSlotIds: Set<string>
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
  selectedDay,
  selectedClass,
  filteredSlots,
  editMode,
  publications,
  conflictedSlotIds,
  rows,
  onEditSlot,
  onDuplicateSlot,
  onRemoveSlot,
  onAssignPeriod,
  onInsertRow,
  onDeleteRow,
  onEditRowTime,
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

  // Determine which break options are available (Brief section 2)
  const hasShortBreak = rows.some((r) => r.breakType === 'short')
  const hasLunchBreak = rows.some((r) => r.breakType === 'lunch')

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
              <th className="p-2.5 w-32 shrink-0 text-[10px] uppercase tracking-wider">Period</th>
              {visibleClasses.map((cls) => (
                <th key={cls} className="p-2.5 min-w-[180px] border-l border-border/50 font-bold text-foreground text-[10px] uppercase tracking-wider">
                  {cls}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {rows.map((row, idx) => (
                <RowOrBreak
                  key={`row-${row.number}`}
                  row={row}
                  editMode={editMode}
                  visibleClasses={visibleClasses}
                  daySlots={daySlots}
                  selectedDay={selectedDay}
                  publications={publications}
                  conflictedSlotIds={conflictedSlotIds}
                  hasShortBreak={hasShortBreak}
                  hasLunchBreak={hasLunchBreak}
                  resolveTeacherName={resolveTeacherName}
                  onEditSlot={onEditSlot}
                  onDuplicateSlot={onDuplicateSlot}
                  onRemoveSlot={onRemoveSlot}
                  onAssignPeriod={onAssignPeriod}
                  onInsertRow={onInsertRow}
                  onDeleteRow={onDeleteRow}
                  onEditRowTime={onEditRowTime}
                  isLast={idx === rows.length - 1}
                />
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile: card-based layout (visible below lg) */}
      <div className="lg:hidden space-y-2">
        {rows.map((row) => {
          if (row.isBreak) {
            return (
              <div key={`break-${row.number}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <Coffee className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">{row.name}</p>
                  {editMode ? (
                    <TimeEditor
                      time={row.time}
                      onSave={(newTime) => onEditRowTime(row.number, newTime)}
                    />
                  ) : (
                    <p className="text-[10px] text-muted-foreground">{row.time}</p>
                  )}
                </div>
                {editMode && (
                  <button
                    onClick={() => onDeleteRow(row.number)}
                    className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete break"
                    aria-label="Delete break"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            )
          }

          const periodSlots = daySlots.filter((s) => s.period === row.number)
          return (
            <div key={`period-${row.number}`} className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-foreground">{row.name}</span>
                  {editMode ? (
                    <TimeEditor
                      time={row.time}
                      onSave={(newTime) => onEditRowTime(row.number, newTime)}
                    />
                  ) : (
                    <span className="text-[9px] text-muted-foreground">{row.time}</span>
                  )}
                </div>
                {editMode && (
                  <button
                    onClick={() => onDeleteRow(row.number)}
                    className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete period"
                    aria-label="Delete period"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              {periodSlots.length === 0 ? (
                editMode ? (
                  <button
                    onClick={() => onAssignPeriod(selectedDay, row.number, selectedClass !== 'all' ? selectedClass : 'Class 2-A')}
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
                    isConflicted={conflictedSlotIds.has(slot.id)}
                    editMode={editMode}
                    onEdit={() => onEditSlot(slot)}
                    onRemove={() => onRemoveSlot(slot)}
                  />
                ))
              )}
              {/* Row divider + (between rows and after last) */}
              {editMode && (
                <RowInsertButton
                  afterRowNumber={row.number}
                  hasShortBreak={hasShortBreak}
                  hasLunchBreak={hasLunchBreak}
                  onInsert={onInsertRow}
                />
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* RowOrBreak — renders a period row or a break row + the divider +    */
/* ------------------------------------------------------------------ */
function RowOrBreak({
  row, editMode, visibleClasses, daySlots, selectedDay, publications,
  conflictedSlotIds, hasShortBreak, hasLunchBreak, resolveTeacherName,
  onEditSlot, onDuplicateSlot, onRemoveSlot, onAssignPeriod,
  onInsertRow, onDeleteRow, onEditRowTime, isLast,
}: {
  row: TimetableRow
  editMode: boolean
  visibleClasses: string[]
  daySlots: TimetableSlot[]
  selectedDay: DayType
  publications: PublishedVersion[]
  conflictedSlotIds: Set<string>
  hasShortBreak: boolean
  hasLunchBreak: boolean
  resolveTeacherName: (slot: TimetableSlot) => string
  onEditSlot: (slot: TimetableSlot) => void
  onDuplicateSlot: (slot: TimetableSlot) => void
  onRemoveSlot: (slot: TimetableSlot) => void
  onAssignPeriod: (day: DayType, period: number, className: string) => void
  onInsertRow: (afterRowNumber: number, type: 'period' | 'short_break' | 'lunch_break') => void
  onDeleteRow: (rowNumber: number) => void
  onEditRowTime: (rowNumber: number, newTime: string) => void
  isLast: boolean
}) {
  if (row.isBreak) {
    return (
      <>
        <motion.tr
          key={`break-${row.number}`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-muted/20"
        >
          <td className="p-2.5 shrink-0 relative">
            {/* × at TOP-LEFT corner inside the break cell (Brief section 9) */}
            {editMode && (
              <button
                onClick={() => onDeleteRow(row.number)}
                className="absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full border border-border/60 bg-card text-muted-foreground hover:text-rose-500 hover:border-rose-400/40 transition-colors flex items-center justify-center shadow-sm z-10"
                title="Delete break"
                aria-label="Delete break"
              >
                <X className="h-2 w-2" />
              </button>
            )}
            <div className="flex items-center gap-1.5 pl-4">
              <Coffee className="h-3 w-3 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-foreground">{row.name}</p>
                {editMode ? (
                  <TimeEditor time={row.time} onSave={(newTime) => onEditRowTime(row.number, newTime)} />
                ) : (
                  <p className="text-[9px] text-muted-foreground">{row.time}</p>
                )}
              </div>
            </div>
          </td>
          <td
            colSpan={visibleClasses.length}
            className="p-2.5 text-center text-[10px] font-medium text-muted-foreground/60 italic border-l border-border/50 bg-amber-500/5"
          >
            — {row.name} ({row.time}) —
          </td>
        </motion.tr>
        {editMode && (
          <RowInsertDivider
            afterRowNumber={row.number}
            hasShortBreak={hasShortBreak}
            hasLunchBreak={hasLunchBreak}
            onInsert={onInsertRow}
          />
        )}
      </>
    )
  }

  return (
    <>
      <motion.tr
        key={`period-${row.number}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={cn('border-t border-border/40 transition-colors', editMode ? 'hover:bg-accent/20' : '')}
      >
        <td className="p-2.5 shrink-0 relative">
          {/* × at TOP-LEFT corner inside the period cell (Brief section 8-9) */}
          {editMode && (
            <button
              onClick={() => onDeleteRow(row.number)}
              className="absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full border border-border/60 bg-card text-muted-foreground hover:text-rose-500 hover:border-rose-400/40 transition-colors flex items-center justify-center shadow-sm z-10"
              title="Delete period"
              aria-label="Delete period"
            >
              <X className="h-2 w-2" />
            </button>
          )}
          <p className="text-[10px] font-bold text-foreground pl-4">{row.name}</p>
          {editMode ? (
            <TimeEditor time={row.time} onSave={(newTime) => onEditRowTime(row.number, newTime)} />
          ) : (
            <p className="text-[9px] text-muted-foreground mt-0.5">{row.time}</p>
          )}
        </td>
        {visibleClasses.map((cls) => {
          const slot = daySlots.find(
            (s) => s.period === row.number && s.className === cls
          )
          return (
            <td key={`${cls}-${row.number}`} className="p-1.5 border-l border-border/50 align-top">
              {slot ? (
                <SlotCard
                  slot={slot}
                  teacherName={resolveTeacherName(slot)}
                  editMode={editMode}
                  publications={publications}
                  isConflicted={conflictedSlotIds.has(slot.id)}
                  onEdit={() => onEditSlot(slot)}
                  onDuplicate={() => onDuplicateSlot(slot)}
                  onRemove={() => onRemoveSlot(slot)}
                />
              ) : (
                <button
                  onClick={() => editMode && onAssignPeriod(selectedDay, row.number, cls)}
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
      {editMode && (
        <RowInsertDivider
          afterRowNumber={row.number}
          hasShortBreak={hasShortBreak}
          hasLunchBreak={hasLunchBreak}
          onInsert={onInsertRow}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* RowInsertDivider — tiny + ON the divider between rows              */
/* Brief section 16 + 27: Clicking opens a compact menu.               */
/* ------------------------------------------------------------------ */
function RowInsertDivider({
  afterRowNumber, hasShortBreak, hasLunchBreak, onInsert,
}: {
  afterRowNumber: number
  hasShortBreak: boolean
  hasLunchBreak: boolean
  onInsert: (afterRowNumber: number, type: 'period' | 'short_break' | 'lunch_break') => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <tr className="border-t border-border/20">
      <td colSpan={99} className="p-0 h-0 relative">
        {/* + centered on the divider, inside the period column (Brief section 12-13) */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="h-4 w-4 rounded-full border border-border/60 bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors flex items-center justify-center shadow-sm"
                title="Insert row"
                aria-label="Insert row"
              >
                <Plus className="h-2 w-2" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-36 p-1" align="start" sideOffset={4} collisionPadding={8}>
              <button
                onClick={() => { onInsert(afterRowNumber, 'period'); setOpen(false) }}
                className="w-full px-2 py-1.5 flex items-center gap-1.5 text-left hover:bg-muted/40 transition-colors text-[10px] rounded"
              >
                <Plus className="h-2.5 w-2.5" /> Period
              </button>
              {!hasShortBreak && (
                <button
                  onClick={() => { onInsert(afterRowNumber, 'short_break'); setOpen(false) }}
                  className="w-full px-2 py-1.5 flex items-center gap-1.5 text-left hover:bg-muted/40 transition-colors text-[10px] rounded"
                >
                  <Coffee className="h-2.5 w-2.5" /> Short Break
                </button>
              )}
              {!hasLunchBreak && (
                <button
                  onClick={() => { onInsert(afterRowNumber, 'lunch_break'); setOpen(false) }}
                  className="w-full px-2 py-1.5 flex items-center gap-1.5 text-left hover:bg-muted/40 transition-colors text-[10px] rounded"
                >
                  <Coffee className="h-2.5 w-2.5" /> Lunch Break
                </button>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </td>
    </tr>
  )
}

/* ------------------------------------------------------------------ */
/* RowInsertButton — mobile version of the row divider +              */
/* ------------------------------------------------------------------ */
function RowInsertButton({
  afterRowNumber, hasShortBreak, hasLunchBreak, onInsert,
}: {
  afterRowNumber: number
  hasShortBreak: boolean
  hasLunchBreak: boolean
  onInsert: (afterRowNumber: number, type: 'period' | 'short_break' | 'lunch_break') => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex justify-center py-0.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="h-4 w-4 rounded-full border border-border/60 bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors flex items-center justify-center"
            title="Insert row"
            aria-label="Insert row"
          >
            <Plus className="h-2 w-2" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-36 p-1" align="center" sideOffset={4}>
          <button
            onClick={() => { onInsert(afterRowNumber, 'period'); setOpen(false) }}
            className="w-full px-2 py-1.5 flex items-center gap-1.5 text-left hover:bg-muted/40 transition-colors text-[10px] rounded"
          >
            <Plus className="h-2.5 w-2.5" /> Period
          </button>
          {!hasShortBreak && (
            <button
              onClick={() => { onInsert(afterRowNumber, 'short_break'); setOpen(false) }}
              className="w-full px-2 py-1.5 flex items-center gap-1.5 text-left hover:bg-muted/40 transition-colors text-[10px] rounded"
            >
              <Coffee className="h-2.5 w-2.5" /> Short Break
            </button>
          )}
          {!hasLunchBreak && (
            <button
              onClick={() => { onInsert(afterRowNumber, 'lunch_break'); setOpen(false) }}
              className="w-full px-2 py-1.5 flex items-center gap-1.5 text-left hover:bg-muted/40 transition-colors text-[10px] rounded"
            >
              <Coffee className="h-2.5 w-2.5" /> Lunch Break
            </button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* TimeEditor — ONE compact popover with Start + End selects.           */
/* Brief section 1-4: NO nested popovers. NO manual typing.             */
/* ------------------------------------------------------------------ */
function TimeEditor({ time, onSave }: {
  time: string
  onSave: (newTime: string) => void
}) {
  const [open, setOpen] = useState(false)
  const parts = time.split(' - ')
  const [start, setStart] = useState(parts[0] || '08:30 AM')
  const [end, setEnd] = useState(parts[1] || '09:15 AM')

  const handleSave = () => {
    onSave(`${start} - ${end}`)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-[9px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
          title="Edit time"
        >
          <Clock className="h-2.5 w-2.5" />
          {time}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-2" align="start" sideOffset={4} collisionPadding={8}>
        <div className="flex items-center gap-3">
          <CompactTimeControls label="Start" value={start} onChange={setStart} />
          <CompactTimeControls label="End" value={end} onChange={setEnd} />
        </div>
        <Button size="sm" className="w-full h-7 text-[10px] mt-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave}>
          Done
        </Button>
      </PopoverContent>
    </Popover>
  )
}

/* ------------------------------------------------------------------ */
/* SlotCard — desktop table cell with polished subject card design     */
/* ------------------------------------------------------------------ */
function SlotCard({ slot, teacherName, editMode, publications, isConflicted, onEdit, onDuplicate, onRemove }: {
  slot: TimetableSlot
  teacherName: string
  editMode: boolean
  publications: PublishedVersion[]
  isConflicted: boolean
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
          : 'border-primary/20 bg-primary/5 hover:border-primary/40',
        isConflicted && 'ring-1 ring-rose-400/40 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
      )}
      onClick={editMode ? onEdit : undefined}
    >
      <ChangeIndicator slotId={slot.id} publications={publications} />
      <div className="flex items-start justify-between gap-1">
        <span className={cn(
          'font-bold text-[11px] truncate',
          isLab ? 'text-violet-700 dark:text-violet-300' : isSports ? 'text-teal-700 dark:text-teal-300' : 'text-primary'
        )}>
          {slot.subject}
        </span>
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
      <p className="text-[10px] font-medium text-foreground mt-1 flex items-center gap-0.5">
        <UserCheck className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
        <span className="truncate">{teacherName}</span>
      </p>
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
function MobileSlotCard({ slot, teacherName, publications, isConflicted, editMode, onEdit, onRemove }: {
  slot: TimetableSlot
  teacherName: string
  publications: PublishedVersion[]
  isConflicted: boolean
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
          : 'border-primary/20 bg-primary/5',
        isConflicted && 'ring-1 ring-rose-400/40 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
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
            <X className="h-3.5 w-3.5" />
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
