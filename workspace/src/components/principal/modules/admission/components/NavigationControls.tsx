'use client'

/**
 * Wizard navigation controls — Back / step dots / Next / Submit.
 * Extracted from the original admission.tsx monolith (Task ID: 21).
 */
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/shared/ui'
import type { WizardStep } from './StepperHeader'

export function NavigationControls({
  visibleSteps,
  step,
  currentVisibleIndex,
  onBack,
  onNext,
  onSubmit,
}: {
  visibleSteps: WizardStep[]
  step: number
  currentVisibleIndex: number
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
}) {
  return (
    <GlassCard className="p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={onBack} disabled={currentVisibleIndex === 0} className="min-w-[100px]">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <div className="hidden sm:flex items-center gap-1.5">
          {visibleSteps.map((s) => (
            <div
              key={s.id}
              className={`h-1.5 rounded-full transition-all ${
                step >= s.id ? 'bg-primary w-5' : 'bg-muted w-1.5'
              }`}
            />
          ))}
        </div>
        {currentVisibleIndex < visibleSteps.length - 1 ? (
          <Button
            onClick={onNext}
            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[110px] font-medium"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[150px] font-medium shadow-md shadow-primary/20"
          >
            <Sparkles className="h-4 w-4" /> Submit Application
          </Button>
        )}
      </div>
    </GlassCard>
  )
}
