'use client'

/**
 * StudentSettingsModule — SS-1 (Settings Experience 2.0)
 *
 * Layout: a compact settings navigation + one focused content area
 * (no giant module headings — the shell header already says Settings):
 *   · Desktop (lg+): sticky grouped rail + content column.
 *   · Mobile/tablet: a grouped list → detail with a back affordance
 *     (no horizontal overflow, pure CSS state — no resize listeners).
 *
 * Sections live in ./section-*.tsx; the registry in ./settings-nav.ts
 * also feeds the palette deep-links (student-panel remaps the pseudo
 * keys settings-<section> → this module's initialSection prop).
 */
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCurrentUser } from '@/lib/store/current-user-store'
import { hydrateNotifPrefsFromServer } from '@/lib/store/student-notif-prefs-store'
import { cn } from '@/lib/utils'
import { SETTINGS_NAV, type SettingsSectionId } from './settings-nav'
import { ProfileSection } from './section-profile'
import { SecuritySection } from './section-security'
import { DevicesSection } from './section-devices'
import { NotificationsSection } from './section-notifications'
import { AppearanceSection } from './section-appearance'
import { AccessibilitySection } from './section-accessibility'
import { LearningSection } from './section-learning'
import { PrivacySection } from './section-privacy'
import { SafetySection } from './section-account-safety'
import { SupportSection } from './section-support'
import { AboutSection } from './section-about'

export function StudentSettingsModule({ initialSection }: { initialSection?: string }) {
  const start = (initialSection && isValidSection(initialSection) ? initialSection : 'profile') as SettingsSectionId
  const [section, setSection] = useState<SettingsSectionId>(start)
  // Mobile drill-in: list first, unless a deep-link opened a section.
  const [showList, setShowList] = useState(!initialSection)

  // Deep-link changes while mounted (palette actions).
  useEffect(() => {
    if (initialSection && isValidSection(initialSection)) {
      setSection(initialSection as SettingsSectionId)
      setShowList(false)
    }
  }, [initialSection])

  // Server identity for account surfaces + prefs hydration (one fetch each).
  const refresh = useCurrentUser((s) => s.refresh)
  useEffect(() => {
    void refresh()
    void hydrateNotifPrefsFromServer()
  }, [refresh])

  const goTo = (id: SettingsSectionId) => {
    setSection(id)
    setShowList(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Compact context line — the product rule: no repeated giant headings */}
      <p className="text-xs text-muted-foreground mb-4 lg:mb-5">
        Your account, preferences and privacy — everything in one place.
      </p>

      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        {/* ── Navigation ── */}
        <nav aria-label="Settings sections" className="lg:sticky lg:top-2 lg:self-start">
          {/* Mobile: grouped list (drill-in) */}
          <div className={cn(showList ? 'block' : 'hidden', 'lg:hidden')}>
            <SectionList active={section} onOpen={goTo} />
          </div>
          {/* Desktop: grouped rail */}
          <div className="hidden lg:block">
            <RailNav section={section} onSelect={setSection} />
          </div>
        </nav>

        {/* ── Content ── */}
        <div className={cn(showList ? 'hidden' : 'block', 'lg:block mt-0 min-w-0')}>
          <button
            onClick={() => setShowList(true)}
            className="lg:hidden mb-3 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded px-1 py-0.5"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> All settings
          </button>
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <SettingsContent section={section} goTo={goTo} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─── Content router ─────────────────────────────────────────────────

function SettingsContent({
  section, goTo,
}: {
  section: SettingsSectionId
  goTo: (id: SettingsSectionId) => void
}) {
  switch (section) {
    case 'profile': return <ProfileSection />
    case 'security': return <SecuritySection />
    case 'devices': return <DevicesSection />
    case 'notifications': return <NotificationsSection />
    case 'appearance': return <AppearanceSection />
    case 'accessibility': return <AccessibilitySection />
    case 'learning': return <LearningSection />
    case 'privacy': return <PrivacySection />
    case 'safety': return <SafetySection goTo={goTo} />
    case 'support': return <SupportSection />
    case 'about': return <AboutSection />
    default: return <ProfileSection />
  }
}

// ─── Mobile grouped list ────────────────────────────────────────────

function SectionList({ active, onOpen }: { active: SettingsSectionId; onOpen: (id: SettingsSectionId) => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 overflow-hidden divide-y divide-border/70">
      {SETTINGS_NAV.map((group) => (
        <div key={group.label} className="p-3">
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onOpen(item.id)}
                  aria-current={active === item.id ? 'true' : undefined}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors',
                    active === item.id ? 'bg-primary/8 text-primary' : 'hover:bg-muted/50 text-foreground',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold">{item.label}</span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5 truncate">{item.caption}</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

// ─── Desktop rail ───────────────────────────────────────────────────

function RailNav({ section, onSelect }: { section: SettingsSectionId; onSelect: (id: SettingsSectionId) => void }) {
  return (
    <div className="space-y-5">
      {SETTINGS_NAV.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = section === item.id
              return (
                <li key={item.id} className="relative">
                  <button
                    onClick={() => onSelect(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors',
                      active ? 'bg-primary/8 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="settings-rail"
                        className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary"
                        aria-hidden
                      />
                    )}
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="text-xs">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

function isValidSection(s: string): boolean {
  return SETTINGS_NAV.some((g) => g.items.some((i) => i.id === s))
}
