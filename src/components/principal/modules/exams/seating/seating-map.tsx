'use client'

/**
 * SeatingMap — top-down room layout with benches, aisle gaps, row/col labels.
 */

import { cn } from '@/lib/utils'
import type { Seat, ExamRoom, SeatingPlan } from '@/lib/exams/seating/types'
import { seatsForRoom, roomOccupancy } from '@/lib/exams/seating/generator'

interface Props {
  room: ExamRoom
  plan: SeatingPlan
}

export function SeatingMap({ room, plan }: Props) {
  const seats = seatsForRoom(plan, room.id)
  const { occupied, capacity } = roomOccupancy(plan, room.id)

  // Build grid: [row][col] → Seat[]
  const grid: Seat[][][] = []
  for (let r = 0; r < room.rows; r++) {
    grid[r] = []
    for (let c = 0; c < room.cols; c++) {
      const cellSeats = seats.filter((s) => s.rowIdx === r && s.colIdx === c)
        .sort((a, b) => (a.position ?? '').localeCompare(b.position ?? ''))
      grid[r][c] = cellSeats
    }
  }

  const benchWidth = room.seatingType === 'triple' ? 144 : room.seatingType === 'double' ? 100 : 56

  return (
    <div className="space-y-4">
      {/* Invigilator desk + front */}
      <div className="flex flex-col items-center gap-1">
        <div className="px-8 py-1.5 rounded-md bg-muted/60 border border-border text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">
          Invigilator Desk
        </div>
        <span className="text-[8px] text-muted-foreground/40 uppercase tracking-widest">Front / Board</span>
      </div>

      {/* Column numbers */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-fit mx-auto">
          <div className="flex items-center gap-3 mb-2 ml-6">
            {Array.from({ length: room.cols }, (_, c) => (
              <div key={c} className="text-center text-[9px] font-medium text-muted-foreground/40" style={{ width: `${benchWidth}px` }}>
                {c + 1}
              </div>
            ))}
          </div>

          {/* Rows with aisle gaps */}
          {grid.map((row, ri) => (
            <div key={ri} className="flex items-center gap-3 mb-4 last:mb-0 ml-6">
              {/* Row label */}
              <div className="w-5 text-right text-[10px] font-bold text-muted-foreground/40 -ml-6">
                {String.fromCharCode(65 + ri)}
              </div>
              {/* Bench tiles with column gaps */}
              {row.map((cellSeats, ci) => (
                <div key={ci} style={{ width: `${benchWidth}px` }}>
                  <Bench seats={cellSeats} type={room.seatingType} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Occupancy */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
        <span className={cn('font-semibold', occupied === capacity ? 'text-emerald-600' : occupied > 0 ? 'text-foreground' : 'text-muted-foreground')}>
          {occupied}
        </span>
        <span>/</span>
        <span>{capacity} seats</span>
      </div>
    </div>
  )
}

function Bench({ seats, type }: { seats: Seat[]; type: string }) {
  if (seats.length === 0) return <div className="h-[60px]" />
  return (
    <div className={cn(
      'flex rounded-md border overflow-hidden',
      type === 'triple' ? 'border-border/60' : type === 'double' ? 'border-border/60' : 'border-border/60',
    )}>
      {seats.map((seat, si) => (
        <SeatPosition key={seat.id} seat={seat} isLast={si === seats.length - 1} />
      ))}
    </div>
  )
}

function SeatPosition({ seat, isLast }: { seat: Seat; isLast: boolean }) {
  const occupied = seat.studentId !== null
  return (
    <div
      className={cn(
        'flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-w-0',
        !isLast && 'border-r border-border/40',
        occupied
          ? 'bg-emerald-50 dark:bg-emerald-950/20'
          : 'bg-muted/15',
      )}
      title={occupied ? `${seat.studentName} · Roll ${seat.studentRollNo} · ${seat.className}` : 'Empty'}
    >
      {occupied ? (
        <>
          <span className="text-[9px] font-medium text-foreground text-center leading-tight truncate max-w-full">
            {seat.studentName}
          </span>
          <span className="text-[7px] text-muted-foreground leading-none mt-0.5">
            Roll {seat.studentRollNo}
          </span>
          <span className="text-[7px] text-emerald-600/70 dark:text-emerald-400/70 leading-none">
            {seat.className}
          </span>
        </>
      ) : (
        <span className="text-[7px] text-muted-foreground/25">Empty</span>
      )}
    </div>
  )
}
