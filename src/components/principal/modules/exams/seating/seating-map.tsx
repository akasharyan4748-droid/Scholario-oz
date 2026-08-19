'use client'

/**
 * SeatingMap — visual room layout with row/column labels.
 *
 * Single-seat: one tile per position. Double-seat: two tiles (L/R) per position.
 * Each tile shows: seat number (small), student name, roll, class.
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

  // Build grid: [row][col] → Seat[] (1 for single, 2 for double)
  const grid: Seat[][][] = []
  for (let r = 0; r < room.rows; r++) {
    grid[r] = []
    for (let c = 0; c < room.cols; c++) {
      const cellSeats = seats.filter((s) => s.rowIdx === r && s.colIdx === c)
        .sort((a, b) => (a.position ?? '').localeCompare(b.position ?? ''))
      grid[r][c] = cellSeats
    }
  }

  return (
    <div className="space-y-3">
      {/* Invigilator desk */}
      <div className="flex justify-center">
        <div className="px-6 py-1 rounded-md bg-muted/60 border border-border text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">
          Invigilator Desk
        </div>
      </div>

      {/* Grid with column headers */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-fit mx-auto">
          {/* Column numbers */}
          <div className="flex items-center gap-1.5 mb-1.5 ml-6">
            {Array.from({ length: room.cols }, (_, c) => (
              <div key={c} className="w-[52px] text-center text-[9px] font-medium text-muted-foreground/50">
                {c + 1}
              </div>
            ))}
          </div>
          {/* Rows */}
          {grid.map((row, ri) => (
            <div key={ri} className="flex items-center gap-1.5 mb-1.5">
              <div className="w-5 text-right text-[9px] font-medium text-muted-foreground/50">
                {String.fromCharCode(65 + ri)}
              </div>
              {row.map((cellSeats, ci) => (
                <div key={ci} className="flex gap-0.5">
                  {cellSeats.length === 0 && <div className="w-[52px]" />}
                  {cellSeats.map((seat) => (
                    <SeatTile key={seat.id} seat={seat} type={room.seatingType} />
                  ))}
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

function SeatTile({ seat, type }: { seat: Seat; type: 'single' | 'double' }) {
  const occupied = seat.studentId !== null
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-md border transition-colors',
        type === 'double' ? 'w-[48px] h-[56px]' : 'w-[52px] h-[56px]',
        occupied
          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
          : 'bg-muted/20 border-border/50',
      )}
      title={occupied ? `${seat.studentName} · ${seat.className}` : 'Empty'}
    >
      <span className={cn('text-[7px] font-mono leading-none', occupied ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-muted-foreground/30')}>
        {seat.seatNumber}
      </span>
      {occupied ? (
        <>
          <span className="text-[8px] text-foreground/80 leading-tight mt-0.5 text-center px-0.5 truncate max-w-full">
            {seat.studentName?.split(' ').map(w => w[0]).join('')}
          </span>
          <span className="text-[7px] text-muted-foreground leading-none">{seat.studentRollNo}</span>
        </>
      ) : (
        <span className="text-[7px] text-muted-foreground/20 leading-none mt-0.5">Empty</span>
      )}
    </div>
  )
}
