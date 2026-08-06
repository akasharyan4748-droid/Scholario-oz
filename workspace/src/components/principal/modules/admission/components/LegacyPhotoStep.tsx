'use client'

/**
 * Legacy inline Photo step (preserved for byte-for-byte fidelity).
 *
 * NOTE: This component is currently NOT referenced by the wizard — the
 * production Photo step is the rich editor at `./PhotoStep.tsx`, which is
 * imported into admission.tsx as `PhotoStepEditor`. This file preserves the
 * original inline `PhotoStep` definition that existed in the admission.tsx
 * monolith (Task ID: 21) so that no code is silently dropped during the
 * modular split.
 */
import { Camera, UploadCloud, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GradientAvatar } from '@/components/shared/ui'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useAdmissionFeatureFlags,
} from '../lib/admission-utils'
import type { FormData } from '../constants'
import { StepHeader } from './StepShared'

export function LegacyPhotoStep({ data, set, flags }: { data: FormData; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void; flags: ReturnType<typeof useAdmissionFeatureFlags> }) {
  const handleToggle = () => {
    const nextVal = !data.photoUploaded
    set('photoUploaded', nextVal)
    if (nextVal) {
      toast.success('Photograph uploaded successfully!')
    } else {
      toast.info('Photograph removed.')
    }
  }

  return (
    <div className="space-y-4">
      <StepHeader title="Passport Photograph" subtitle="Upload recent student passport size photograph" icon={<Camera className="h-5 w-5" />} />

      <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-border bg-card/60 text-center space-y-4">
        {/* Requirement F: Passport Photo Container properly fitted */}
        <div
          onClick={handleToggle}
          className={cn(
            'flex h-44 w-36 items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all relative overflow-hidden group shrink-0 shadow-xs',
            data.photoUploaded
              ? 'border-emerald-500/80 bg-emerald-500/10'
              : 'border-border bg-muted/20 hover:border-primary hover:bg-primary/5'
          )}
        >
          {data.photoUploaded ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-1 text-center">
              <GradientAvatar name={`${data.firstName} ${data.lastName}`} size="xl" className="h-full w-full rounded-lg text-3xl shadow-xs" />
            </div>
          ) : (
            <div className="text-center px-2">
              <Camera className="h-8 w-8 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="text-xs font-semibold mt-2 text-foreground">Click to Upload</p>
            </div>
          )}
        </div>

        {/* Requirement F: Minimal small action button & requirement specs */}
        <div className="space-y-2">
          {data.photoUploaded ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleToggle}
              className="text-xs h-7 px-2.5 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <X className="h-3 w-3 mr-1" /> Re-upload / Remove
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleToggle}
              className="bg-primary text-primary-foreground font-semibold text-xs h-8 px-4"
            >
              <UploadCloud className="h-3.5 w-3.5 mr-1" /> Choose Photo File
            </Button>
          )}

          {/* Simple Requirements Text */}
          <p className="text-[11px] text-muted-foreground font-mono pt-1">
            Photo Requirements: Passport Ratio (3.5 × 4.5 cm) · JPG or PNG · Max size 2MB
          </p>
        </div>
      </div>
    </div>
  )
}
