import { OUTPUT_H, OUTPUT_W, type CropRect } from './types'

/**
 * Render the main editing canvas: white backdrop, rotated image, darkened
 * overlay outside the crop rectangle, emerald crop border, rule-of-thirds
 * grid lines, dashed face oval guide, and emerald corner handles.
 *
 * Pure function — accepts the canvas + image + crop + rotation directly.
 */
export function drawMainCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  crop: CropRect,
  rotation: number
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const W = canvas.width
  const H = canvas.height

  // Light backdrop (banking-app feel — no dark canvas)
  ctx.save()
  ctx.filter = 'none'
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)
  ctx.restore()

  // Draw image with rotation
  ctx.save()
  ctx.filter = 'none'
  const rotated = rotation % 180 !== 0
  const baseImgW = rotated ? image.height : image.width
  const baseImgH = rotated ? image.width : image.height
  const baseScale = Math.min(W / baseImgW, H / baseImgH) * 0.92
  ctx.translate(W / 2, H / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.scale(baseScale, baseScale)
  ctx.drawImage(image, -image.width / 2, -image.height / 2)
  ctx.restore()

  // Crop overlay
  ctx.save()
  ctx.filter = 'none'
  ctx.fillStyle = 'rgba(15, 23, 42, 0.5)' // darken outside crop (slate)
  ctx.fillRect(0, 0, W, crop.y)
  ctx.fillRect(0, crop.y, crop.x, crop.h)
  ctx.fillRect(crop.x + crop.w, crop.y, W - crop.x - crop.w, crop.h)
  ctx.fillRect(0, crop.y + crop.h, W, H - crop.y - crop.h)

  ctx.strokeStyle = 'oklch(0.55 0.14 162)' // emerald border
  ctx.lineWidth = 2
  ctx.strokeRect(crop.x, crop.y, crop.w, crop.h)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)' // rule of thirds
  ctx.lineWidth = 1
  for (let i = 1; i < 3; i++) {
    const xv = crop.x + (crop.w * i) / 3
    ctx.beginPath(); ctx.moveTo(xv, crop.y); ctx.lineTo(xv, crop.y + crop.h); ctx.stroke()
    const yv = crop.y + (crop.h * i) / 3
    ctx.beginPath(); ctx.moveTo(crop.x, yv); ctx.lineTo(crop.x + crop.w, yv); ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)' // face oval guide
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.ellipse(crop.x + crop.w / 2, crop.y + crop.h * 0.42, crop.w * 0.32, crop.h * 0.3, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = 'oklch(0.55 0.14 162)' // corner handles (emerald)
  const hs = 12
  ;[
    [crop.x, crop.y],
    [crop.x + crop.w, crop.y],
    [crop.x, crop.y + crop.h],
    [crop.x + crop.w, crop.y + crop.h],
  ].forEach(([px, py]) => ctx.fillRect(px - hs / 2, py - hs / 2, hs, hs))

  ctx.restore()
}

/**
 * Render the small passport-size preview canvas by extracting the crop region
 * from the main canvas and scaling it to the preview dimensions.
 */
export function drawPreviewCanvas(
  pc: HTMLCanvasElement,
  main: HTMLCanvasElement,
  image: HTMLImageElement | null,
  crop: CropRect
): void {
  const ctx = pc.getContext('2d')
  if (!ctx) return

  ctx.save()
  ctx.filter = 'none'
  ctx.clearRect(0, 0, pc.width, pc.height)
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, pc.width, pc.height)

  if (!image) {
    ctx.fillStyle = 'oklch(0.6 0.012 160)'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('No photo', pc.width / 2, pc.height / 2)
    ctx.restore()
    return
  }

  const sx = Math.max(0, crop.x)
  const sy = Math.max(0, crop.y)
  const sw = Math.min(main.width - sx, crop.w)
  const sh = Math.min(main.height - sy, crop.h)
  if (sw <= 0 || sh <= 0) {
    ctx.restore()
    return
  }
  ctx.drawImage(main, sx, sy, sw, sh, 0, 0, pc.width, pc.height)
  ctx.restore()
}

/**
 * Export the current crop region from the main canvas as a 420x540 passport
 * JPEG data URL. Returns null if the crop region is invalid or export fails.
 */
export function exportCroppedImage(
  main: HTMLCanvasElement,
  crop: CropRect
): string | null {
  const out = document.createElement('canvas')
  out.width = OUTPUT_W
  out.height = OUTPUT_H
  const octx = out.getContext('2d')
  if (!octx) return null

  // White passport background
  octx.fillStyle = '#ffffff'
  octx.fillRect(0, 0, OUTPUT_W, OUTPUT_H)

  const sx = Math.max(0, crop.x)
  const sy = Math.max(0, crop.y)
  const sw = Math.min(main.width - sx, crop.w)
  const sh = Math.min(main.height - sy, crop.h)
  if (sw <= 0 || sh <= 0) return null
  octx.drawImage(main, sx, sy, sw, sh, 0, 0, OUTPUT_W, OUTPUT_H)
  try {
    return out.toDataURL('image/jpeg', 0.92)
  } catch {
    return null
  }
}
