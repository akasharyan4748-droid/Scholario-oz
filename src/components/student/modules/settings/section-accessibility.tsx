'use client'

/**
 * SS-1 — Settings → Accessibility.
 *
 * Practical, effective controls (not cosmetic): reduce-motion disables
 * animations/transitions app-wide via a root attribute + CSS (the OS
 * prefers-reduced-motion setting is ALWAYS honored independently);
 * larger text scales the root rem ~6% so the whole layout scales
 * proportionally. Both persist per device.
 */
import { Accessibility } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '@/lib/store/theme-store'
import { SectionCard, ToggleRow } from './primitives'

export function AccessibilitySection() {
  const reduceMotion = useTheme((s) => s.reduceMotion)
  const setReduceMotion = useTheme((s) => s.setReduceMotion)
  const textSize = useTheme((s) => s.textSize)
  const setTextSize = useTheme((s) => s.setTextSize)
  const hydrated = useTheme((s) => s.hydrated)

  return (
    <SectionCard icon={Accessibility} title="Accessibility" caption="Motion and reading comfort on this device">
      <div className="divide-y divide-border/60">
        <ToggleRow
          label="Reduce motion"
          caption="Turn off animations and transitions across Scholario"
          checked={hydrated && reduceMotion}
          onChange={(v) => { setReduceMotion(v); toast.success('Preferences saved') }}
          ariaLabel="Reduce motion"
        />
        <ToggleRow
          label="Larger text"
          caption="Slightly larger text and spacing throughout the app"
          checked={hydrated && textSize === 'large'}
          onChange={(v) => { setTextSize(v ? 'large' : 'default'); toast.success('Preferences saved') }}
          ariaLabel="Larger text"
        />
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
        Your device&apos;s own reduced-motion setting is always respected automatically — this
        switch lets you apply it to Scholario even when the device setting is off.
      </p>
    </SectionCard>
  )
}
