'use client'

/**
 * TS-SETTINGS → Devices.
 *
 * Real session records from /api/auth/sessions. Two-step confirm for
 * "sign out all others" (armed-confirm pattern).
 */
import { useState } from 'react'
import { MonitorSmartphone, Monitor, Smartphone, Tablet, HelpCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatRelativeTime, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useSessions, type SessionRow } from './hooks'
import { SectionCard, SettingsError, SettingsSkeleton } from './primitives'

const DEVICE_ICON: Record<SessionRow['deviceType'], typeof Monitor> = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet: Tablet,
  Unknown: HelpCircle,
}

export function DevicesSection() {
  const { sessions, error, busy, reload, revokeOne, revokeOthers } = useSessions()
  const [armed, setArmed] = useState(false)

  const others = sessions?.filter((s) => !s.isCurrent) ?? []

  return (
    <SectionCard icon={MonitorSmartphone} title="Devices" caption="Browsers currently signed in to your account">
      {error ? (
        <SettingsError onRetry={reload} />
      ) : sessions === null ? (
        <SettingsSkeleton rows={3} />
      ) : (
        <>
          <div className="space-y-2.5">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} busy={busy} onRevoke={() => revokeOne(s.id)} />
            ))}
          </div>

          <div className="mt-5 pt-5 border-t border-border/70">
            {others.length > 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold">Sign out of other devices</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {others.length} other device{others.length > 1 ? 's' : ''} will need your password to sign back in.
                  </p>
                </div>
                <Button
                  variant={armed ? 'destructive' : 'outline'}
                  size="sm"
                  disabled={busy}
                  className="shrink-0"
                  onClick={() => {
                    if (!armed) {
                      setArmed(true)
                      return
                    }
                    setArmed(false)
                    void revokeOthers()
                  }}
                  onBlur={() => armed && setArmed(false)}
                >
                  <LogOut className="h-4 w-4" />
                  {busy ? 'Signing out…' : armed ? 'Tap again to confirm' : 'Sign out all others'}
                </Button>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                This is the only device signed in to your account right now.
              </p>
            )}
          </div>
        </>
      )}
    </SectionCard>
  )
}

function SessionCard({ session, busy, onRevoke }: { session: SessionRow; busy: boolean; onRevoke: () => void }) {
  const Icon = DEVICE_ICON[session.deviceType] ?? HelpCircle
  const unknown = session.deviceType === 'Unknown' && session.browser === 'Unknown browser'
  const label = unknown
    ? 'Unknown device'
    : `${session.browser} · ${session.os}`

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3 transition-colors',
        session.isCurrent ? 'border-primary/25 bg-primary/5' : 'border-border bg-card/40',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          session.isCurrent ? 'bg-primary/10 text-primary' : 'bg-muted/70 text-muted-foreground',
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-semibold truncate">{label}</p>
          {session.isCurrent && (
            <span className="rounded-full bg-primary/10 border border-primary/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
              This device
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Signed in {formatRelativeTime(session.createdAt)} · {formatDate(session.createdAt)}
          {session.ipAddress && ` · ${session.ipAddress}`}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
          Expires {formatDate(session.expiresAt)}
        </p>
      </div>
      {!session.isCurrent && (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={onRevoke}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
        >
          Sign out
        </Button>
      )}
    </div>
  )
}
