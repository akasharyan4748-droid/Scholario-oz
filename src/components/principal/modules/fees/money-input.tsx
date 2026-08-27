'use client'

/**
 * money-input — the canonical monetary input for Fee Management.
 *
 * WHY THIS EXISTS (the leading-zero bug, permanently fixed here):
 * Controlled `<Input type="number" value={Number(...)}/>` inputs misbehave
 * when the user clears, selects-all-and-types, or pastes:
 *   • clearing the field converts '' → 0 and the field instantly shows "0",
 *     so the next digit typed produces "04…";
 *   • select-all + typing can visually retain leading zeros ("04500") when
 *     the derived Number happens to equal the previous state (no re-render);
 *   • paste of "₹4,500" or "0004500" is either rejected or kept verbatim.
 *
 * THE FIX — treat the field as a STRING while editing and normalize to a
 * valid monetary number only on change (never re-format the DOM while the
 * user types):
 *   • digits only (strips ₹, commas, spaces, signs on paste);
 *   • leading zeros collapse as you type ("007" → "7"; a lone "0" stays);
 *   • EMPTY STAYS EMPTY — onChange(null) — validation happens on submit;
 *   • no cursor jumping: the sanitized string is written back ONLY when it
 *     differs from the raw input, so normal typing never fights the caret.
 *
 * Contract:
 *   value    : number | null | undefined   (null/undefined/0 all render empty
 *                                     when `allowEmpty`; 0 renders "0" only
 *                                     if it was typed as such)
 *   onChange : (value: number | null) => void
 *
 * Consumers: master catalogue (create/edit default amounts), fee structure
 * editor (head amounts, exam fee amounts, planned instances), collect
 * payment amount, additional charge amount.
 */

import { useEffect, useRef, useState } from 'react'
import { IndianRupee } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface MoneyInputProps {
  /** Current numeric value. null/undefined → empty field. */
  value: number | null | undefined
  /** Emits null while the field is empty (validate on submit). */
  onChange: (value: number | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  /** Visual ₹ prefix inside the field. Default true. */
  showPrefix?: boolean
  /** Accessible label for screen readers. */
  ariaLabel?: string
  /** Minimum enforced on blur (e.g. 1 for planned instances). The field
   * still allows empty while editing; blur snaps to the minimum. */
  min?: number
  id?: string
}

/** Sanitize raw input text → canonical digit string with no leading zeros. */
export function sanitizeMoneyText(raw: string): string {
  // Keep digits only (drops ₹, commas, spaces, +/-, stray letters).
  let t = raw.replace(/[^\d]/g, '')
  // Collapse leading zeros: "007" → "7", "0" → "0", "000" → "0".
  if (t.length > 1) t = t.replace(/^0+(?=\d)/, '')
  return t
}

export function MoneyInput({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  showPrefix = true,
  ariaLabel,
  min,
  id,
}: MoneyInputProps) {
  // The field is a STRING while editing. It is re-synced from the numeric
  // `value` prop ONLY when the prop genuinely diverges from what the user
  // is typing (parent reset, catalogue prefill, external mutation).
  const [text, setText] = useState<string>(() =>
    value == null || value === 0 ? '' : String(value),
  )
  const lastEmitted = useRef<number | null>(value ?? null)

  useEffect(() => {
    const current = text === '' ? null : Number(text)
    // Re-sync when the external value changed to something other than what
    // this field last emitted (e.g. form reset or prefill from catalogue).
    if (value !== lastEmitted.current && value !== current) {
      setText(value == null || value === 0 ? '' : String(value))
    }
    lastEmitted.current = value ?? null
  }, [value])

  const handleChange = (raw: string) => {
    const t = sanitizeMoneyText(raw)
    setText(t)
    const next = t === '' ? null : Number(t)
    lastEmitted.current = next
    onChange(next)
  }

  const handleBlur = () => {
    // Snap to the enforced minimum (still permits empty → parent validates).
    if (min != null && text !== '' && Number(text) < min) {
      const snapped = String(min)
      setText(snapped)
      lastEmitted.current = min
      onChange(min)
    }
  }

  return (
    <div className="relative w-full">
      {showPrefix && (
        <IndianRupee
          aria-hidden
          className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground"
        />
      )}
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        aria-label={ariaLabel ?? 'Amount in rupees'}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder ?? '0'}
        disabled={disabled}
        className={cn(
          showPrefix ? 'pl-7' : undefined,
          'text-right tabular-nums',
          className,
        )}
        // Digits-only keystrokes at the DOM level as a first line of
        // defence (paste + drag-drop still go through handleChange's
        // sanitizer). `type="text"` + inputMode keeps mobile numeric
        // keyboards WITHOUT the browser's spinner/leading-zero quirks.
        onKeyDown={(e) => {
          if (e.key.length === 1 && !/[\d]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
            e.preventDefault()
          }
        }}
      />
    </div>
  )
}
