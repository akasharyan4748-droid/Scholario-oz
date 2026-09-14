'use client'

/**
 * ID Card tab (School Settings) — the SCHOOL'S identity-card template.
 *
 * The Principal/Admin configures the institutional card design once here;
 * every student's card (view + print) renders FROM this template. The
 * preview shows a real roster student so the school always sees exactly
 * what will print. Every change persists live to the tenant-scoped
 * school-settings store.
 */

import { IdCard as IdCardIcon, ShieldAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { DEMO_STUDENT_ID } from '@/components/student/modules/applications/student'
import { StudentIdCard } from '@/components/student/shell/student-id-card'
import { SettingsTab, FieldGroup } from './shared'

const THEME_SWATCHES: { key: 'violet' | 'sky' | 'emerald' | 'rose' | 'amber'; label: string; gradient: string }[] = [
  { key: 'violet', label: 'Violet', gradient: 'from-violet-600 via-purple-600 to-fuchsia-600' },
  { key: 'sky', label: 'Sky', gradient: 'from-sky-600 via-blue-600 to-indigo-600' },
  { key: 'emerald', label: 'Emerald', gradient: 'from-emerald-600 via-teal-600 to-cyan-600' },
  { key: 'rose', label: 'Rose', gradient: 'from-rose-600 via-pink-600 to-fuchsia-600' },
  { key: 'amber', label: 'Amber', gradient: 'from-amber-500 via-orange-500 to-rose-500' },
]

interface FieldToggle {
  key: 'showHouse' | 'showAdmissionNo' | 'showDob' | 'showBloodGroup' | 'showValidUntil'
  label: string
  hint: string
  sensitive?: boolean
}

const FIELD_TOGGLES: FieldToggle[] = [
  { key: 'showAdmissionNo', label: 'Admission Number', hint: 'Print the admission number on the card.' },
  { key: 'showHouse', label: 'House', hint: 'Print the student’s house (when they belong to one).' },
  { key: 'showValidUntil', label: 'Validity Line', hint: '“Valid till 31 Mar …” derived from the active session.' },
  { key: 'showDob', label: 'Date of Birth', hint: 'Sensitive — enable only if required.', sensitive: true },
  { key: 'showBloodGroup', label: 'Blood Group', hint: 'Medical — enable only if required.', sensitive: true },
]

export function IdCardTab() {
  const idCard = useSchoolSettingsStore((s) => s.idCard)
  const updateIdCard = useSchoolSettingsStore((s) => s.updateIdCard)
  // Preview against a REAL roster record — what the school sees is what
  // every student's card will look like with their own particulars.
  const previewStudent = useStudentsStore((s) => s.students.find((x) => x.id === DEMO_STUDENT_ID))

  if (!idCard) return null

  return (
    <SettingsTab
      icon={IdCardIcon}
      title="Student Identity Cards"
      description="The school's card template — every student's ID card renders from this design. Changes apply to all students immediately."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* ── Configuration ──────────────────────────────────────────── */}
        <div className="space-y-6">
          <FieldGroup label="Card Theme">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="radiogroup" aria-label="Card theme">
              {THEME_SWATCHES.map((t) => {
                const selected = idCard.theme === t.key
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => updateIdCard({ theme: t.key })}
                    className={cn(
                      'group flex flex-col items-center gap-2 rounded-xl border p-2.5 transition-all cursor-pointer',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected ? 'border-primary/40 bg-primary/[0.06] shadow-xs' : 'border-border hover:border-border/80 hover:bg-muted/40'
                    )}
                  >
                    <span className={cn('h-8 w-full rounded-lg bg-gradient-to-br shadow-inner', t.gradient)} aria-hidden />
                    <span className={cn('text-[11px] font-semibold', selected ? 'text-primary' : 'text-muted-foreground')}>
                      {t.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </FieldGroup>

          <FieldGroup label="Card Fields">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FIELD_TOGGLES.map((f) => (
                <div
                  key={f.key}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-3 transition-colors',
                    f.sensitive ? 'border-amber-500/25 bg-amber-500/[0.04]' : 'border-border bg-card/40'
                  )}
                >
                  <Switch
                    id={`idcard-${f.key}`}
                    checked={Boolean(idCard[f.key])}
                    onCheckedChange={(v) => updateIdCard({ [f.key]: v })}
                    className="mt-0.5"
                    aria-label={f.label}
                  />
                  <div className="min-w-0">
                    <Label htmlFor={`idcard-${f.key}`} className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      {f.label}
                      {f.sensitive && <ShieldAlert className="h-3 w-3 text-amber-600" aria-hidden />}
                    </Label>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{f.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label="Office Line">
            <div>
              <Label htmlFor="idcard-note" className="text-xs font-semibold mb-1 block">
                Card Footer Note
              </Label>
              <Input
                id="idcard-note"
                value={idCard.verificationNote}
                onChange={(e) => updateIdCard({ verificationNote: e.target.value })}
                placeholder="If found, please return to the school office."
                className="text-xs"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Printed on every card’s footer next to the school office phone. Kept short on purpose — physical cards stay readable.
              </p>
            </div>
          </FieldGroup>
        </div>

        {/* ── Live preview (real student) ─────────────────────────────── */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center gap-2.5 pb-3">
            <h4 className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Live Preview</h4>
            <div className="h-px flex-1 bg-border" aria-hidden />
          </div>
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4">
            {previewStudent ? (
              <StudentIdCard student={previewStudent} className="mx-auto shadow-none" />
            ) : (
              <p className="py-16 text-center text-xs text-muted-foreground">Loading preview…</p>
            )}
            <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground">
              Rendered with a live roster student — each student sees this exact design with their own particulars.
            </p>
          </div>
        </div>
      </div>
    </SettingsTab>
  )
}
