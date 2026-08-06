'use client'

import { useCallback, useRef, useState } from 'react'
import type { CropRect, DragState } from './types'
import {
  computeMoveCrop,
  computeResizeCrop,
  getCanvasCoords,
  hitTest,
} from './cropUtils'

interface UseCropInteractionArgs {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  crop: CropRect
  setCrop: React.Dispatch<React.SetStateAction<CropRect>>
  hasImage: boolean
}

/**
 * Wires pointer events on the editing canvas to crop move/resize logic.
 *
 * Pointer-down hit-tests the crop rect: the bottom-right pad region triggers
 * resize; the crop body triggers move. Pointer-move updates the crop via the
 * pure computeMoveCrop / computeResizeCrop helpers, using `setCrop`'s
 * functional updater so the callback never needs to depend on `crop` itself.
 * Pointer-up releases the pointer capture and clears the drag state refs.
 */
export function useCropInteraction({
  canvasRef,
  crop,
  setCrop,
  hasImage,
}: UseCropInteractionArgs) {
  const [isDragging, setIsDragging] = useState(false)
  const dragModeRef = useRef<'move' | 'resize' | null>(null)
  const dragRef = useRef<DragState | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!hasImage || !canvasRef.current) return
      const { x, y } = getCanvasCoords(canvasRef.current, e.clientX, e.clientY)
      const hit = hitTest(crop, x, y)
      if (!hit) return
      e.preventDefault()
      try {
        ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      const start: DragState = {
        startX: x,
        startY: y,
        cx: crop.x,
        cy: crop.y,
        cw: crop.w,
        ch: crop.h,
      }
      setIsDragging(true)
      dragModeRef.current = hit
      dragRef.current = start
    },
    [canvasRef, crop, hasImage]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const m = dragModeRef.current
      const start = dragRef.current
      if (!m || !start || !canvasRef.current) return
      e.preventDefault()
      const { x, y } = getCanvasCoords(canvasRef.current, e.clientX, e.clientY)
      if (m === 'move') {
        const next = computeMoveCrop(start, x, y)
        setCrop((c) => ({ ...c, x: next.x, y: next.y }))
      } else if (m === 'resize') {
        const next = computeResizeCrop(start, x)
        setCrop((c) => ({ ...c, w: next.w, h: next.h }))
      }
    },
    [canvasRef, setCrop]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (isDragging) {
        try {
          ;(e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      }
      setIsDragging(false)
      dragModeRef.current = null
      dragRef.current = null
    },
    [isDragging]
  )

  return {
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }
}
