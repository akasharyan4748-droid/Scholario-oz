'use client'

/**
 * SalarySettingsSection — compact preference cards.
 *
 * SALARY EDITING: 🔒 Off → [Enable Editing] → 🟢 On with a live countdown
 * (no disable button — the window simply runs out) → 🔒 Off again.
 * The expiry is persisted, so a refresh keeps a live window and an
 * expired one reopens locked.
 *
 * PAYMENTS: default method + which methods require a reference number.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Landmark, Lock, Settings2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSalaryStore, type PaymentMethod, EDIT_WINDOW_MS, CURRENT_SESSION } from '@/lib/store/salary-store'
import { useEditingWindow, LockedBadge } from './salary-shared'
import { PayrollArchiveCard } from './salary-payroll-archive'

const METHODS: PaymentMethod[] = ['Bank Transfer', 'UPI', 'Cash', 'Cheque']

export function SalarySettingsSection() {
  const settings = useSalaryStore((s) => s.settings)
  const updateSettings = useSalaryStore((s) => s.updateSettings)
  const enableEditing = useSalaryStore((s) => s.enableEditing)
  const { allowed, msLeft, label } = useEditingWindow()

  const [enabling, setEnabling] = useState(false)

  const handleEnable = () => {
    setEnabling(true)
    try {
      enableEditing()
      toast.success('Editing enabled', { description: 'Salary changes can be sent to employees for the next 3 hours.' })
    } finally {
      setEnabling(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" /> Settings
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Salary &amp; Payroll preferences</p>
      </div>

      {/* SALARY EDITING */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Salary Editing</p>
            {allowed ? (
              <motion.div key="on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mt-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Editing enabled</p>
                  <p className="text-xs text-muted-foreground tabular-nums mt-0.5">Expires in {label}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="off" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mt-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">🔒 Editing disabled</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Salary changes are currently locked.</p>
                </div>
              </motion.div>
            )}
          </div>
          {!allowed && (
            <Button
              size="sm"
              className="h-8 text-xs shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleEnable}
              disabled={enabling}
            >
              Enable Editing
            </Button>
          )}
        </div>
        {allowed && (
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden>
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-1000 ease-linear"
              style={{ width: `${Math.max(0, Math.min(100, (msLeft / EDIT_WINDOW_MS) * 100))}%` }}
            />
          </div>
        )}
      </div>

      {/* PAYMENTS */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-muted-foreground" />
          <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Payments</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium">Default Method</p>
          <Select
            value={settings.defaultMethod}
            onValueChange={(v) => {
              updateSettings({ defaultMethod: v as PaymentMethod })
              toast.success('Default method updated', { description: v })
            }}
          >
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[70]">
              {METHODS.map((m) => (
                <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2.5">
          <p className="text-xs font-medium">Reference Number Required</p>
          {METHODS.map((m) => (
            <div key={m} className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{m}</p>
              <Switch
                checked={settings.referenceRequired[m]}
                onCheckedChange={(checked) => {
                  updateSettings({ referenceRequired: { ...settings.referenceRequired, [m]: checked } })
                  toast.success(`${m} reference ${checked ? 'required' : 'optional'}`)
                }}
                aria-label={`${m} reference required`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* SESSION */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Session</p>
            <p className="text-sm font-semibold mt-2">{CURRENT_SESSION.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {Math.round(EDIT_WINDOW_MS / 3600000)}-hour editing windows · employee-approved changes
            </p>
          </div>
          <LockedBadge label="Locked" />
        </div>
      </div>

      {/* PAYROLL ARCHIVE — historical records, read-only */}
      <PayrollArchiveCard />
    </div>
  )
}
