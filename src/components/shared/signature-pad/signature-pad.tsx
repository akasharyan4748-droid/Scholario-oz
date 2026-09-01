'use client'

/**
 * SignaturePad — draw OR type a signature (spec PART 19).
 *
 * Used in the student/guardian submission flow wherever a form requires a
 * digital signature. The captured value is stored on the submission and
 * printed verbatim on the official A4 document — the school never fabricates
 * a signature.
 *
 *   • DRAW — a hi-DPI <canvas> with pointer events (mouse + touch + pen),
 *     round strokes, Clear button. Exports a trimmed PNG data-URL.
 *   • TYPE — a name field previewed in an italic serif hand.
 *
 * Purely controlled: the parent owns the state and validation.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Eraser, PenTool, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface SignatureValue {
  mode: 'drawn' | 'typed'
  /** PNG data-URL (drawn) or the typed name. */
  data: string
  signerName: string
  signedAt: string
}

/** True when the value is a usable signature. */
export function signatureComplete(v: SignatureValue | null): boolean {
  if (!v) return false
  if (v.mode === 'typed') return v.data.trim().length > 1
  // Drawn: a real PNG with ink (data-URL longer than a blank canvas export).
  return v.data.startsWith('data:image/png') && v.data.length > 1500
}

const CANVAS_W = 560
const CANVAS_H = 150

export function SignaturePad({
  value,
  onChange,
  defaultSigner,
  label = 'Guardian signature',
  error,
}: {
  value: SignatureValue | null
  onChange: (v: SignatureValue | null) => void
  /** Prefills the typed-name field (guardian name from the school record). */
  defaultSigner?: string
  label?: string
  error?: string
}) {
  const [mode, setMode] = useState<'drawn' | 'typed'>(value?.mode ?? 'drawn')
  const [typedName, setTypedName] = useState(value?.mode === 'typed' ? value.data : defaultSigner ?? '')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const drawnRef = useRef<boolean>(!!value && value.mode === 'drawn') // seeded (edit case)

  // ── Canvas setup: hi-DPI scaling + initial paint of an existing value ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
    canvas.width = CANVAS_W * ratio
    canvas.height = CANVAS_H * ratio
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0f172a'
    // Restore a previously drawn signature (review/re-render case).
    if (value?.mode === 'drawn' && value.data.startsWith('data:image/png')) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H)
      img.src = value.data
      drawnRef.current = true
    } else if (!drawnRef.current) {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    }
  }, [mode]) // re-init when switching back to draw mode

  const posOf = (e: PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    drawingRef.current = true
    drawnRef.current = true
    canvasRef.current?.setPointerCapture(e.pointerId)
    const { x, y } = posOf(e.nativeEvent)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = posOf(e.nativeEvent)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const onPointerUp = useCallback(() => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    // Export trimmed PNG — the ink box only, not the whole blank canvas.
    const data = trimCanvasToDataURL(canvas)
    onChange({
      mode: 'drawn',
      data: data ?? canvas.toDataURL('image/png'),
      signerName: value?.signerName ?? defaultSigner ?? '',
      signedAt: value?.signedAt ?? new Date().toISOString(),
    })
  }, [onChange, defaultSigner, value?.signerName, value?.signedAt])

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    drawnRef.current = false
    onChange(null)
  }

  const commitTyped = (name: string) => {
    setTypedName(name)
    onChange(
      name.trim().length > 1
        ? { mode: 'typed', data: name.trim(), signerName: name.trim(), signedAt: value?.signedAt ?? new Date().toISOString() }
        : null,
    )
  }

  const complete = signatureComplete(value)

  return (
    <div className={cn('rounded-lg border bg-card p-3', error ? 'border-rose-300' : 'border-border')}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold">
          {label}
          <span className="ml-1 text-rose-500">*</span>
        </p>
        {/* Mode switch */}
        <div className="inline-flex h-6 items-center rounded-full bg-muted/70 p-0.5" role="group" aria-label="Signature input mode">
          {([['drawn', 'Draw', PenTool], ['typed', 'Type', Type]] as const).map(([v, lbl, Icon]) => (
            <button
              key={v}
              type="button"
              onClick={() => setMode(v)}
              aria-pressed={mode === v}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 h-5 text-[10px] font-medium transition-all',
                mode === v ? 'bg-white dark:bg-white/10 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3 w-3" /> {lbl}
            </button>
          ))}
        </div>
      </div>

      {mode === 'drawn' ? (
        <div className="mt-2">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Signature drawing area — draw with your mouse, pen or finger"
            className="w-full h-[150px] rounded-md border border-dashed border-slate-300 bg-white cursor-crosshair touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-[9.5px] text-muted-foreground">
              {complete ? 'Signature captured — it prints on the official form.' : 'Draw the guardian\u2019s signature above.'}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] gap-1 text-muted-foreground"
              onClick={clear}
              aria-label="Clear signature"
            >
              <Eraser className="h-3 w-3" /> Clear
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-2">
          <Input
            value={typedName}
            onChange={(e) => commitTyped(e.target.value)}
            placeholder="Type the guardian's full name"
            aria-label="Typed signature — guardian's full name"
            className="h-9 text-xs"
            maxLength={60}
          />
          <div className="mt-2 rounded-md border border-dashed border-slate-300 bg-white px-4 py-2">
            <p
              className="truncate text-center font-serif text-[22px] italic leading-none text-slate-800"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {typedName.trim() || '\u00A0'}
            </p>
          </div>
          <p className="mt-1.5 text-[9.5px] text-muted-foreground">
            {complete ? 'Typed signature recorded — it prints on the official form.' : 'Type the name; it will be rendered as the signature.'}
          </p>
        </div>
      )}

      {error && <p className="mt-1.5 text-[10px] text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  )
}

/** Crops the transparent margin off a signature canvas → compact data-URL. */
function trimCanvasToDataURL(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const { width, height } = canvas
  const img = ctx.getImageData(0, 0, width, height)
  const alpha = img.data
  let minX = width, minY = height, maxX = -1, maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (alpha[(y * width + x) * 4 + 3] > 10) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null // blank canvas
  const pad = 8
  minX = Math.max(0, minX - pad)
  minY = Math.max(0, minY - pad)
  maxX = Math.min(width - 1, maxX + pad)
  maxY = Math.min(height - 1, maxY + pad)
  const w = maxX - minX + 1
  const h = maxY - minY + 1
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const octx = out.getContext('2d')
  if (!octx) return null
  octx.drawImage(canvas, minX, minY, w, h, 0, 0, w, h)
  return out.toDataURL('image/png')
}
