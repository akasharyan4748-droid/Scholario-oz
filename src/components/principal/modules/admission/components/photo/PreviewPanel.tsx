'use client'

import { Check, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { GlassCard } from '@/components/shared/ui'
import { PREVIEW_H, PREVIEW_W, type Mode } from './types'

interface PreviewPanelProps {
  previewCanvasRef: React.RefObject<HTMLCanvasElement | null>
  applied: boolean
  mode: Mode
  hasImage: boolean
  hasPhotoOnFile: boolean
  onApply: () => void
  onEditCurrent: () => void
  onReplace: () => void
}

/**
 * Right-column preview panel: a "Live Preview" label with a Saved pill
 * (visible after apply), the small passport-size preview canvas (120×155),
 * the appropriate action button per mode (Use This Photo · Edit Current Photo
 * · Replace), and a tiny requirements hint footer.
 */
export function PreviewPanel({
  previewCanvasRef,
  applied,
  mode,
  hasImage,
  hasPhotoOnFile,
  onApply,
  onEditCurrent,
  onReplace,
}: PreviewPanelProps) {
  return (
    <GlassCard hover={false} className="p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Live Preview
        </Label>
        {applied && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success border border-success/20">
            <Check className="h-2.5 w-2.5" /> Saved
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="relative rounded-md overflow-hidden border border-border shadow-sm bg-card p-1.5">
          <canvas
            ref={previewCanvasRef}
            width={PREVIEW_W}
            height={PREVIEW_H}
            className="block rounded-sm"
            style={{ width: 120, height: 155 }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          Passport size · 3.5 × 4.5 cm
        </p>
      </div>

      {mode === 'editing' && (
        <Button type="button" size="sm" className="w-full h-9" onClick={onApply} disabled={!hasImage}>
          <Check className="h-4 w-4" />
          Use This Photo
        </Button>
      )}
      {mode === 'empty' && hasPhotoOnFile && (
        <Button type="button" size="sm" variant="outline" className="w-full h-9" onClick={onEditCurrent}>
          <RefreshCw className="h-3.5 w-3.5" />
          Edit Current Photo
        </Button>
      )}
      {mode === 'editing' && (
        <Button type="button" size="sm" variant="ghost" className="w-full h-8" onClick={onReplace}>
          <RefreshCw className="h-3.5 w-3.5" />
          Replace
        </Button>
      )}

      {/* Tiny requirements hint */}
      <div className="pt-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">
          Passport ratio · JPG/PNG · Max 5 MB
        </p>
      </div>
    </GlassCard>
  )
}
