'use client'

/**
 * SeatingMap — visual room layout (Spec: cinema/exam-hall style).
 *
 * Renders seats as a grid with clear seat numbers. Supports single + double
 * seating types. Color states: occupied (emerald), empty (muted), selected.
 */

import { cn } from '@/lib/utils'
import type { Seat, ExamRoom } from '@/lib/exams/seating/types'
import { seatsForRoom, roomOccupancy } from '@/lib/exams/seating/generator'
import type { SeatingPlan } from '@/lib/exams/seating/types'

interface Props {
  room: ExamRoom
  plan: SeatingPlan
}

export function SeatingMap({ room, plan }: Props) {
  const seats = seatsForRoom(plan, room.id)
  const { occupied, capacity } = roomOccupancy(plan, room.id)

  // Build a 2D grid: [row][col] → Seat[] (1 for single, 2 for double)
  const grid: Seat[][][] = []
  for (let r = 0; r < room.rows; r++) {
    grid[r] = []
    for (let c = 0; c < room.cols; c++) {
      const cellSeats = seats.filter((s) => s.rowIdx === r && s.colIdx === c)
      grid[r][c] = cellSeats.sort((a, b) => (a.position ?? '').localeCompare(b.position ?? ''))
    }
  }

  return (
    <div className="space-y-3">
      {/* Invigilator desk marker */}
      <div className="flex justify-center">
        <div className="px-6 py-1 rounded-md bg-muted/60 border border-border text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">
          Invigilator Desk
        </div>
      </div>

      {/* Seating grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-fit mx-auto" style={{ width: `calc(${room.cols} * ${room.seatingType === 'double' ? 88 : 56}px + ${(room.cols - 1) * 8}px)` }}>
          {grid.map((row, ri) => (
            <div key={ri} className="flex items-center justify-center gap-1.5 mb-1.5">
              <span className="text-[8px] text-muted-foreground/50 w-4 text-right">{String.fromCharCode(65 + ri)}</span>
              {row.map((cellSeats, ci) => (
                <div key={ci} className="flex gap-0.5">
                  {cellSeats.map((seat) => (
                    <SeatCard key={seat.id} seat={seat} type={room.seatingType} />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Occupancy summary */}
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

function SeatCard({ seat, type }: { seat: Seat; type: 'single' | 'double' }) {
  const occupied = seat.studentId !== null
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-md border transition-colors',
        type === 'double' ? 'w-[40px] h-[44px]' : 'w-[48px] h-[48px]',
        occupied
          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
          : 'bg-muted/30 border-border/60',
      )}
      title={occupied ? `${seat.studentName} · ${seat.className}` : `Seat ${seat.seatNumber} (empty)`}
    >
      <span className={cn('text-[8px] font-mono leading-none', occupied ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground/50')}>
        {seat.seatNumber}
      </span>
      {occupied ? (
        <span className="text-[7px] text-foreground/80 leading-tight mt-0.5 truncate max-w-full px-0.5">
          {seat.studentName?.split(' ').map(w => w[0]).join('')}
        </span>
      ) : (
        <span className="text-[7px] text-muted-foreground/30 leading-none mt-0.5">—</span>
      )}
    </div>
  )
}
