import { Camera } from 'lucide-react'

/**
 * Compact step header for the Passport Photograph section: small primary
 * camera icon tile + title/subtitle.
 */
export function PhotoStepHeader() {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Camera className="h-4 w-4" />
      </div>
      <div>
        <h2 className="font-display text-sm font-bold tracking-tight">Passport Photograph</h2>
        <p className="text-[11px] text-muted-foreground">Capture or upload a recent passport-size photo</p>
      </div>
    </div>
  )
}
