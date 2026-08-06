'use client'

import { Camera, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyModeProps {
  photoDataUrl: string | null
  cameraSupported: boolean
  onUploadClick: () => void
  onCameraClick: () => void
  onRemove: () => void
}

/**
 * Empty-state UI: two compact choice cards (Upload / Camera) and, when a
 * photo already exists on file, a thin "Current photo on file" row with a
 * Remove button.
 */
export function EmptyMode({
  photoDataUrl,
  cameraSupported,
  onUploadClick,
  onCameraClick,
  onRemove,
}: EmptyModeProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {/* Upload card */}
        <button type="button" onClick={onUploadClick} className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 p-4 text-center transition-all hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold">Upload</p>
            <p className="text-[10px] text-muted-foreground">JPG / PNG · 5 MB</p>
          </div>
        </button>

        {/* Camera card */}
        <button type="button" onClick={onCameraClick} disabled={!cameraSupported} className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 p-4 text-center transition-all hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold">Camera</p>
            <p className="text-[10px] text-muted-foreground">{cameraSupported ? 'Live capture' : 'Not supported'}</p>
          </div>
        </button>
      </div>

      {photoDataUrl && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2 max-w-md mx-auto">
          <img
            src={photoDataUrl}
            alt="Current"
            className="h-12 w-10 rounded-md object-cover border border-border"
          />
          <div className="flex-1 text-left">
            <p className="text-[11px] font-semibold text-foreground">Current photo on file</p>
            <p className="text-[10px] text-muted-foreground">Re-capture or upload to replace</p>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onRemove} className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <X className="h-3 w-3" /> Remove
          </Button>
        </div>
      )}
    </div>
  )
}
