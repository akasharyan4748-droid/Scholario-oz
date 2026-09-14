'use client'

/**
 * SS-1 — Settings → Privacy.
 *
 * A concise, student-friendly visibility map — what's school-managed,
 * what the student controls, who can see what. Explanatory by design:
 * the previous "show achievements on the class leaderboard" toggle had
 * no consumer (the Achievements module was removed long ago) and was
 * retired rather than kept as a dead switch.
 */
import { ShieldCheck, School, Eye, Lock, UserCog } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SectionCard } from './primitives'

export function PrivacySection() {
  return (
    <SectionCard icon={ShieldCheck} title="Privacy" caption="Who can see what in your school workspace">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <PrivacyCard
          icon={School}
          title="Managed by your school"
          items={[
            'Your name, class, roll number and admission record',
            'Attendance, results, fees and transport assignment',
            'Official contact details',
          ]}
          note="The school office keeps these accurate. Ask them for corrections."
        />
        <PrivacyCard
          icon={UserCog}
          title="Controlled by you"
          items={[
            'Your profile photo',
            'Notification channels and study reminders',
            'Theme, accent and accessibility choices',
          ]}
          note="Change any of these right here in Settings."
        />
        <PrivacyCard
          icon={Eye}
          title="Visible to your school"
          items={[
            'Your official records (teachers and office)',
            'Class leadership roles you hold',
            'Study group questions you ask (after moderation)',
          ]}
          note="Part of being in a school workspace — nothing here is public."
        />
        <PrivacyCard
          icon={Lock}
          title="Always private"
          items={[
            'Your password — nobody at school can see it',
            'Your preferences and appearance choices',
            'Which devices you are signed in on',
          ]}
          note="Only you can change these."
        />
      </div>
    </SectionCard>
  )
}

function PrivacyCard({ icon: Icon, title, items, note }: { icon: LucideIcon; title: string; items: string[]; note: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <h4 className="text-xs font-semibold">{title}</h4>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-3 pt-2.5 border-t border-border/60 text-[10px] text-muted-foreground/80 leading-relaxed">
        {note}
      </p>
    </div>
  )
}
