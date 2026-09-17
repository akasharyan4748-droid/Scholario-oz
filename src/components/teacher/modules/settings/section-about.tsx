'use client'

/**
 * TS-SETTINGS → About.
 *
 * Minimal and honest: product name, workspace version (APP_VERSION),
 * current school and academic year from the server session.
 */
import { Info } from 'lucide-react'
import { APP_VERSION } from '@/lib/app-version'
import { useCurrentUser } from '@/lib/store/current-user-store'
import { SectionCard, InfoRow } from './primitives'

export function AboutSection() {
  const me = useCurrentUser((s) => s.me)
  const school = me?.school

  return (
    <SectionCard icon={Info} title="About" caption="Scholario on this device">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <span className="font-display text-base font-bold text-primary">S</span>
        </div>
        <div>
          <p className="font-display text-sm font-semibold tracking-tight">Scholario</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Your teaching workspace</p>
        </div>
      </div>
      <div className="divide-y divide-border/60">
        <InfoRow label="Version" value={`v${APP_VERSION}`} />
        <InfoRow label="Workspace" value="Teacher" />
        <InfoRow label="School" value={school?.name ?? '—'} />
        <InfoRow label="School code" value={school?.code ?? '—'} />
        <InfoRow label="Academic year" value={school?.academicYear || '—'} />
      </div>
      <p className="mt-4 text-[10px] text-muted-foreground/70 leading-relaxed">
        Scholario keeps your school&apos;s records in one calm place. Updates arrive quietly —
        your data stays with your school.
      </p>
    </SectionCard>
  )
}
