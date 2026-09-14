'use client'

/**
 * SS-1 — Settings → Appearance.
 *
 * Uses the application's own theme system (theme-store v2): Light /
 * Dark / System (follows the OS, live) + the existing 8 accent colours.
 * Device-local by design — rendering preferences belong to the device
 * that renders them.
 */
import { motion } from 'framer-motion'
import { Check, Monitor, Moon, Palette, Sun } from 'lucide-react'
import { useTheme, ACCENT_NAMES, ACCENT_SWATCHES, systemPrefersDark, type ThemeMode } from '@/lib/store/theme-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { SectionCard } from './primitives'

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun; caption: string }[] = [
  { mode: 'light', label: 'Light', icon: Sun, caption: 'Bright & clean surfaces' },
  { mode: 'dark', label: 'Dark', icon: Moon, caption: 'Easy on the eyes at night' },
  { mode: 'system', label: 'System', icon: Monitor, caption: `Follows your device (${systemPrefersDark() ? 'dark' : 'light'} now)` },
]

export function AppearanceSection() {
  const theme = useTheme((s) => s.theme)
  const setTheme = useTheme((s) => s.set)
  const hydrated = useTheme((s) => s.hydrated)
  const accent = useTheme((s) => s.accentColor)
  const setAccent = useTheme((s) => s.setAccentColor)

  return (
    <SectionCard icon={Palette} title="Appearance" caption="How Scholario looks on this device">
      <div className="grid grid-cols-3 gap-3">
        {THEME_OPTIONS.map((opt) => {
          const active = hydrated && theme === opt.mode
          return (
            <button
              key={opt.mode}
              onClick={() => setTheme(opt.mode)}
              aria-pressed={active}
              className={cn(
                'relative rounded-2xl border p-3 sm:p-4 text-left transition-all duration-200',
                active
                  ? 'border-primary/40 bg-primary/5 shadow-xs'
                  : 'border-border bg-card/40 hover:border-primary/20 hover:bg-muted/30',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              )}
            >
              {active && (
                <motion.span
                  layoutId="theme-check"
                  className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  <Check className="h-2.5 w-2.5" aria-hidden />
                </motion.span>
              )}
              <opt.icon className={cn('h-4.5 w-4.5 mb-2', active ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
              <p className="text-xs font-semibold">{opt.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug hidden sm:block">{opt.caption}</p>
            </button>
          )
        })}
      </div>

      <div className="mt-6 pt-5 border-t border-border/70">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Accent colour
        </h4>
        <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Accent colour">
          {ACCENT_NAMES.map((name) => {
            const active = accent === name
            return (
              <button
                key={name}
                role="radio"
                aria-checked={active}
                aria-label={`${name} accent`}
                title={name.charAt(0).toUpperCase() + name.slice(1)}
                onClick={() => { setAccent(name); toast.success('Preferences saved') }}
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-150',
                  active ? 'ring-2 ring-ring ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                )}
              >
                <span className={cn('h-5.5 w-5.5 rounded-full', ACCENT_SWATCHES[name] ?? 'bg-emerald-500')} aria-hidden />
                {active && <Check className="h-3 w-3 text-white absolute" aria-hidden />}
              </button>
            )
          })}
        </div>
        <p className="text-[10px] text-muted-foreground/80 mt-2.5">
          Used for buttons, highlights and charts across your workspace.
        </p>
      </div>
    </SectionCard>
  )
}
