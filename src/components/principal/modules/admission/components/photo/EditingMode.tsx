'use client'

import {
  Crop as CropIcon,
  RefreshCw,
  RotateCcw,
  RotateCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CANVAS_SIZE } from './types'

interface EditingModeProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  isDragging: boolean
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onRotateLeft: () => void
  onRotateRight: () => void
  onRetake: () => void
}

/**
 * Editing-mode UI: square crop canvas (with pointer handlers + grab/grabbing
 * cursor), a small "Drag to reposition" pill overlay (top-left), and a
 * compact toolbar (Rotate L · Rotate R · Retake).
 */
export function EditingMode({
  canvasRef,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onRotateLeft,
  onRotateRight,
  onRetake,
}: EditingModeProps) {
  return (
    <div className="space-y-3">
      <div className="relative mx-auto w-full max-w-[320px]">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn('block w-full rounded-lg bg-card border border-border touch-none select-none shadow-sm', isDragging ? 'cursor-grabbing' : 'cursor-grab')}
          style={{ aspectRatio: '1 / 1' }}
        />
        <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur px-2 py-0.5">
          <CropIcon className="h-3 w-3 text-white" />
          <span className="text-[10px] font-medium text-white">Drag to reposition</span>
        </div>
      </div>

      {/* Compact toolbar */}
      <div className="flex items-center justify-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onRotateLeft} title="Rotate left" className="h-8">
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Rotate L</span>
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onRotateRight} title="Rotate right" className="h-8">
          <RotateCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Rotate R</span>
        </Button>
        <div className="h-5 w-px bg-border" />
        <Button type="button" variant="ghost" size="sm" onClick={onRetake} className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Retake</span>
        </Button>
      </div>
    </div>
  )
}
