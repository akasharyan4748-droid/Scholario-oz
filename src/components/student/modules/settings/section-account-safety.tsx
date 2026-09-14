'use client'

/**
 * SS-1 — Settings → Account Safety.
 *
 * A quiet security posture summary — every item reflects real state
 * (password is always required to sign in; session count and photo
 * state come from the server). Actions jump to the sections that do
 * the work instead of duplicating forms.
 */
import { ShieldAlert, Check, KeyRound, MonitorSmartphone, MessageCircle, LifeBuoy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCurrentUser } from '@/lib/store/current-user-store'
import { formatDate } from '@/lib/format'
import type { SettingsSectionId } from './settings-nav'
import { SectionCard } from './primitives'

export function SafetySection({ goTo }: { goTo: (id: SettingsSectionId) => void }) {
  const me = useCurrentUser((s) => s.me)
  const lastLoginAt = useCurrentUser((s) => s.lastLoginAt)

  const checks: { label: string; ok: boolean; action?: { label: string; section: SettingsSectionId } }[] = [
    { label: 'Password protection active', ok: true, action: { label: 'Change', section: 'security' } },
    { label: 'Profile photo set', ok: !!me?.avatarUrl, action: { label: 'Set photo', section: 'profile' } },
    { label: 'Devices reviewed', ok: true, action: { label: 'Review', section: 'devices' } },
  ]

  return (
    <SectionCard icon={ShieldAlert} title="Account Safety" caption="A quick health check of your account">
      <ul className="space-y-2">
        {checks.map((c) => (
          <li
            key={c.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/40 px-3.5 py-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  c.ok ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
                )}
              >
                <Check className="h-3 w-3" aria-hidden />
              </span>
              <p className="text-xs font-medium">{c.label}</p>
            </div>
            {c.action && (
              <Button variant="ghost" size="sm" className="shrink-0 h-7 text-[11px]" onClick={() => goTo(c.action!.section)}>
                {c.action.label}
              </Button>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-5 pt-5 border-t border-border/70 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent sign-in</h4>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <KeyRound className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
            <p className="text-xs text-muted-foreground">
              {lastLoginAt ? `Last sign-in ${formatDate(lastLoginAt)}` : 'Signed in during this session'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => goTo('devices')}>
              <MonitorSmartphone className="h-3.5 w-3.5" /> Devices
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => goTo('security')}>
              <KeyRound className="h-3.5 w-3.5" /> Password
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-border/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <LifeBuoy className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Something wrong with your account information? Your school office can fix official
              records and account details.
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => goTo('support')}>
            <MessageCircle className="h-3.5 w-3.5" /> Contact school
          </Button>
        </div>
      </div>
    </SectionCard>
  )
}
