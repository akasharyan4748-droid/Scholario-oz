export interface PhotoStepProps {
  photoDataUrl: string | null
  onChange: (dataUrl: string | null) => void
}

export type Mode = 'empty' | 'camera' | 'editing'

export interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

export interface DragState {
  startX: number
  startY: number
  cx: number
  cy: number
  cw: number
  ch: number
}

// Internal canvas pixel size — square for clean rotation behaviour
export const CANVAS_SIZE = 600
export const PREVIEW_W = 120
export const PREVIEW_H = 155
export const PASSPORT_RATIO = 3.5 / 4.5 // w/h
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
export const MIN_CROP_W = 100
export const MIN_CROP_H = MIN_CROP_W / PASSPORT_RATIO
export const OUTPUT_W = 420
export const OUTPUT_H = 540
