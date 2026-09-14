'use client'

/**
 * SS-1 — Settings → Help & Support.
 *
 * Integrates with the EXISTING messaging infrastructure: requests are
 * delivered as real Message rows to the school office (principal,
 * resolved server-side) — visible in their Messages inbox, same as any
 * other school message. Plus the office's real contact details from
 * the School record. No fake ticket system.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LifeBuoy, Send, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useOfficeInfo, sendSupportRequest } from './hooks'
import { SectionCard, SettingsError, SettingsSkeleton } from './primitives'

const CATEGORIES = [
  { value: 'account', label: 'Account issue' },
  { value: 'technical', label: 'Technical issue' },
  { value: 'general', label: 'General question' },
  { value: 'feedback', label: 'Feedback' },
] as const

export function SupportSection() {
  const { office, error, reload } = useOfficeInfo()

  const [category, setCategory] = useState<string>('account')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const submit = async () => {
    setFormError(null)
    if (!subject.trim() || !body.trim()) {
      setFormError('Add a subject and a short message.')
      return
    }
    setSubmitting(true)
    const result = await sendSupportRequest({ category, subject: subject.trim(), body: body.trim() })
    setSubmitting(false)
    if (result.ok) {
      setSentTo(result.deliveredTo)
      setSubject('')
      setBody('')
    } else {
      setFormError(result.error)
    }
  }

  return (
    <SectionCard icon={LifeBuoy} title="Help & Support" caption="Your school office is one message away">
      {error ? (
        <SettingsError onRetry={reload} />
      ) : !office ? (
        <SettingsSkeleton rows={3} />
      ) : (
        <>
          {/* Office identity — real contact details from the school record */}
          <div className="rounded-xl border border-border bg-card/40 p-4">
            <p className="text-xs font-semibold">{office.schoolName} · School office</p>
            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {office.phone && (
                <a
                  href={`tel:${office.phone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <Phone className="h-3.5 w-3.5 text-primary/70 shrink-0" aria-hidden />
                  <span className="truncate group-hover:underline">{office.phone}</span>
                </a>
              )}
              {office.email && (
                <a
                  href={`mailto:${office.email}`}
                  className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <Mail className="h-3.5 w-3.5 text-primary/70 shrink-0" aria-hidden />
                  <span className="truncate group-hover:underline">{office.email}</span>
                </a>
              )}
              {office.address && (
                <p className="flex items-center gap-2 text-[11px] text-muted-foreground sm:col-span-2">
                  <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" aria-hidden />
                  <span className="truncate">{office.address}</span>
                </p>
              )}
            </div>
          </div>

          {/* Send a message — delivered to the office's real Messages inbox */}
          <div className="mt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Send a message
            </h4>

            <AnimatePresence mode="wait">
              {sentTo ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-4 flex items-start gap-3"
                  role="status"
                >
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Sent to {sentTo}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Your message is in the school office inbox — they&apos;ll reply through Messages.
                    </p>
                    <button
                      onClick={() => setSentTo(null)}
                      className="mt-2 text-[11px] font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded px-1"
                    >
                      Send another message
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div>
                    <label htmlFor="support-category" className="text-xs font-medium text-muted-foreground">
                      What is this about?
                    </label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Support category">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c.value}
                          role="radio"
                          aria-checked={category === c.value}
                          onClick={() => setCategory(c.value)}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors',
                            category === c.value
                              ? 'border-primary/40 bg-primary/10 text-primary'
                              : 'border-border bg-card/40 text-muted-foreground hover:border-primary/25 hover:text-foreground',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                          )}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="support-subject" className="text-xs font-medium text-muted-foreground">
                      Subject
                    </label>
                    <input
                      id="support-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      maxLength={120}
                      placeholder="A short summary"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  </div>
                  <div>
                    <label htmlFor="support-body" className="text-xs font-medium text-muted-foreground">
                      Message
                    </label>
                    <textarea
                      id="support-body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      maxLength={4000}
                      rows={4}
                      placeholder="Tell the office what happened or what you need…"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40 resize-y"
                    />
                  </div>
                  {formError && <p className="text-xs text-destructive" role="alert">{formError}</p>}
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={submit} disabled={submitting}>
                      <Send className="h-3.5 w-3.5" /> {submitting ? 'Sending…' : 'Send to school office'}
                    </Button>
                    <span className="text-[10px] text-muted-foreground/80">
                      Delivered through Scholario Messages
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </SectionCard>
  )
}
