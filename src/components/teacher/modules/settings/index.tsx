'use client'

/**
 * TeacherSettingsModule (TS-SETTINGS).
 *
 * Personal settings for the signed-in teacher — NOT School Settings
 * (that belongs to the Principal). Layout mirrors the student Settings:
 * a compact grouped rail + one focused content area.
 *   · Desktop (lg+): sticky grouped rail + content column.
 *   · Mobile/tablet: grouped list → detail with a back affordance.
 */
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCurrentUser } from '@/lib/store/current-user-store'
import { cn } from '@/lib/utils'
import {
  TEACHER_SETTINGS_NAV,
  type TeacherSettingsSectionId,
} from './settings-nav'
import { ProfileSection } from './section-profile'
import { SecuritySection } from './section-security'
import { DevicesSection } from './section-devices'
import { NotificationsSection } from './section-notifications'
import { AppearanceSection } from './section-appearance'
import { WorkspaceSection } from './section-workspace'
import { AboutSection } from './section-about'

export function TeacherSettingsModule() {
  const [section, setSection] = useState<TeacherSettingsSectionId>('profile')
  // Mobile drill-in: list first; desktop shows rail + content together.
  const [showList, setShowList] = useState(true)

  // Server identity for the account surfaces (one fetch per mount).
  const refresh = useCurrentUser((s) => s.refresh)
  useEffect(() => { void refresh() }, [refresh])

  const goTo = (id: TeacherSettingsSectionId) => {
    setSection(id)
    setShowList(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Compact context line — the product rule: no repeated giant headings */}
      <p className="text-xs text-muted-foreground mb-4 lg:mb-5">
        Your account, preferences and workspace — everything in one place.
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
              <SettingsContent section={section} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─── Content router ─────────────────────────────────────────────────

function SettingsContent({ section }: { section: TeacherSettingsSectionId }) {
  switch (section) {
    case 'profile': return <ProfileSection />
    case 'security': return <SecuritySection />
    case 'devices': return <DevicesSection />
    case 'notifications': return <NotificationsSection />
    case 'appearance': return <AppearanceSection />
    case 'workspace': return <WorkspaceSection />
    case 'about': return <AboutSection />
    default: return <ProfileSection />
  }
}

// ─── Mobile grouped list ────────────────────────────────────────────

function SectionList({
  active, onOpen,
}: {
  active: TeacherSettingsSectionId
  onOpen: (id: TeacherSettingsSectionId) => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 overflow-hidden divide-y divide-border/70">
      {TEACHER_SETTINGS_NAV.map((group) => (
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

function RailNav({
  section, onSelect,
}: {
  section: TeacherSettingsSectionId
  onSelect: (id: TeacherSettingsSectionId) => void
}) {
  return (
    <div className="space-y-5">
      {TEACHER_SETTINGS_NAV.map((group) => (
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
                        layoutId="teacher-settings-rail"
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
