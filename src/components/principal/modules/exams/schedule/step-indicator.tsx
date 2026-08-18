'use client'

/**
 * StepIndicator — 3-step progress indicator (Spec §9).
 *
 *   1. Examination Setup
 *   2. Timetable Preview
 *   3. Final Confirmation
 *
 * Shows the current step, completed steps (checkmark), and labels.
 */

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StepIndicatorProps {
  current: 1 | 2 | 3
}

const STEPS = [
  { num: 1, label: 'Examination Setup' },
  { num: 2, label: 'Timetable Preview' },
  { num: 3, label: 'Final Confirmation' },
] as const

export function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 max-w-2xl mx-auto">
      {STEPS.map((step, i) => {
        const isComplete = step.num < current
        const isActive = step.num === current
        return (
          <div key={step.num} className="flex items-center gap-1 sm:gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold border transition-colors shrink-0',
                  isComplete && 'bg-emerald-600 text-white border-emerald-600',
                  isActive && 'bg-primary text-primary-foreground border-primary',
                  !isComplete && !isActive && 'bg-muted text-muted-foreground border-border',
                )}
              >
                {isComplete ? <Check className="h-3 w-3" /> : step.num}
              </div>
              <span
                className={cn(
                  'text-[10px] sm:text-xs font-medium whitespace-nowrap',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px flex-1 min-w-[12px] sm:min-w-[24px] transition-colors',
                  step.num < current ? 'bg-emerald-500/50' : 'bg-border',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
