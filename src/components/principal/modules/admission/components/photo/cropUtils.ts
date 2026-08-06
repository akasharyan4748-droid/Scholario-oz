import {
  CANVAS_SIZE,
  MIN_CROP_H,
  MIN_CROP_W,
  PASSPORT_RATIO,
  type CropRect,
  type DragState,
} from './types'

/**
 * Compute the default crop rectangle for the given image (already loaded into
 * an HTMLImageElement) at the given rotation. The crop is centered, fits the
 * passport ratio, and is bounded by the canvas size and minimum dimensions.
 */
export function computeInitialCrop(img: HTMLImageElement, rot: number): CropRect {
  const rotated = rot % 180 !== 0
  const baseImgW = rotated ? img.height : img.width
  const baseImgH = rotated ? img.width : img.height
  const baseScale = Math.min(CANVAS_SIZE / baseImgW, CANVAS_SIZE / baseImgH) * 0.92
  const displayedW = baseImgW * baseScale
  const displayedH = baseImgH * baseScale

  // Default crop fits passport ratio inside the displayed image
  let cw = displayedW * 0.78
  let ch = cw / PASSPORT_RATIO
  if (ch > displayedH * 0.95) {
    ch = displayedH * 0.95
    cw = ch * PASSPORT_RATIO
  }
  cw = Math.max(MIN_CROP_W, cw)
  ch = Math.max(MIN_CROP_H, cw / PASSPORT_RATIO)
  const cx = (CANVAS_SIZE - cw) / 2
  const cy = (CANVAS_SIZE - ch) / 2
  return { x: cx, y: cy, w: cw, h: ch }
}

/**
 * Translate a clientX/clientY pointer position into canvas pixel coordinates
 * accounting for the canvas's CSS scaling.
 */
export function getCanvasCoords(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

/**
 * Determine whether a pointer at (x, y) over the canvas hits the resize handle
 * (bottom-right corner with padding), the crop body (move), or nothing.
 */
export function hitTest(
  crop: CropRect,
  x: number,
  y: number
): 'resize' | 'move' | null {
  const pad = 18
  // Resize handle (bottom-right corner)
  if (
    x >= crop.x + crop.w - pad &&
    x <= crop.x + crop.w + pad &&
    y >= crop.y + crop.h - pad &&
    y <= crop.y + crop.h + pad
  ) {
    return 'resize'
  }
  // Inside crop rect
  if (x >= crop.x && x <= crop.x + crop.w && y >= crop.y && y <= crop.y + crop.h) {
    return 'move'
  }
  return null
}

/**
 * Compute the new crop x/y when moving the crop body, clamped to the canvas.
 */
export function computeMoveCrop(
  start: DragState,
  x: number,
  y: number
): { x: number; y: number } {
  const dx = x - start.startX
  const dy = y - start.startY
  let nx = start.cx + dx
  let ny = start.cy + dy
  nx = Math.max(0, Math.min(nx, CANVAS_SIZE - start.cw))
  ny = Math.max(0, Math.min(ny, CANVAS_SIZE - start.ch))
  return { x: nx, y: ny }
}

/**
 * Compute the new crop w/h when resizing from the bottom-right corner,
 * preserving the passport aspect ratio and clamping to canvas bounds.
 */
export function computeResizeCrop(
  start: DragState,
  x: number
): { w: number; h: number } {
  // Resize from bottom-right, preserve passport aspect ratio
  const newW = Math.max(MIN_CROP_W, start.cw + (x - (start.cx + start.cw)))
  let finalW = Math.min(newW, CANVAS_SIZE - start.cx)
  let finalH = finalW / PASSPORT_RATIO
  if (finalH > CANVAS_SIZE - start.cy) {
    finalH = CANVAS_SIZE - start.cy
    finalW = finalH * PASSPORT_RATIO
  }
  return { w: finalW, h: finalH }
}
