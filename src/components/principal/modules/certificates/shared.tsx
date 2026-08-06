import { school } from '@/lib/mock/school'

/**
 * Default accent color (emerald) used by every certificate that doesn't
 * explicitly pass its own accent (kept in sync with the original monolith).
 */
export const DEFAULT_ACCENT = 'oklch(0.55 0.14 162)'

/** Shared decorative double-border frame that wraps every full-page certificate. */
export function CertBorder({
  children,
  accent = DEFAULT_ACCENT,
}: {
  children: React.ReactNode
  accent?: string
}) {
  return (
    <div
      className="relative bg-white dark:bg-slate-950 rounded-lg p-6"
      style={{ boxShadow: '0 0 0 1px var(--border), 0 0 0 6px white, 0 0 0 7px ' + accent + '40' }}
    >
      <div className="absolute inset-2 border-2 rounded-md pointer-events-none" style={{ borderColor: accent, borderStyle: 'double' }} />
      <div className="absolute top-2 left-2 right-2 h-1 rounded-t-md" style={{ background: accent, opacity: 0.6 }} />
      <div className="absolute bottom-2 left-2 right-2 h-1 rounded-b-md" style={{ background: accent, opacity: 0.6 }} />
      <div className="relative">{children}</div>
    </div>
  )
}

/** School masthead (logo + name + tagline + address + accent underline) used on every certificate. */
export function CertHeader({ accent = DEFAULT_ACCENT }: { accent?: string }) {
  return (
    <div className="text-center mb-4">
      <div className="flex items-center justify-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-white font-display font-bold text-xl shadow-md"
          style={{ background: accent }}
        >
          {school.logo}
        </div>
        <div className="text-left">
          <h2 className="font-display text-lg font-bold leading-tight" style={{ color: accent }}>{school.name}</h2>
          <p className="text-[9px] text-muted-foreground">{school.tagline}</p>
        </div>
      </div>
      <p className="text-[9px] text-muted-foreground mt-1">{school.address}</p>
      <p className="text-[9px] text-muted-foreground">{school.phone} · {school.email} · {school.affiliation}</p>
      <div className="mt-2 h-0.5 w-3/4 mx-auto rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
    </div>
  )
}

/** Rotated dashed circular seal that appears in the signature row of every certificate. */
export function Seal({ accent = DEFAULT_ACCENT }: { accent?: string }) {
  return (
    <div
      className="relative h-20 w-20 rounded-full flex items-center justify-center text-[8px] font-bold text-center"
      style={{
        border: `2px dashed ${accent}`,
        background: `color-mix(in oklch, ${accent} 8%, white)`,
        color: accent,
        transform: 'rotate(-12deg)',
      }}
    >
      <div>
        <div className="text-[10px]">★ OFFICIAL ★</div>
        <div className="text-[8px]">SEAL</div>
        <div className="text-[7px]">{school.shortName.toUpperCase()}</div>
        <div className="text-[6px]">EST {school.established}</div>
      </div>
    </div>
  )
}
