'use client'

import { motion } from 'framer-motion'
import { Building2, X, Loader2 } from 'lucide-react'

export interface OnboardForm {
  name: string
  code: string
  city: string
  plan: string
  principalName: string
  principalEmail: string
}

export function OnboardingModal({
  open, form, setForm, submitting, onClose, onSubmit,
}: {
  open: boolean
  form: OnboardForm
  setForm: (f: OnboardForm) => void
  submitting: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-base flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Building2 className="h-4 w-4" />
            </span>
            Onboard School Tenant
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold">School Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Oxford Public School" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold">Short Code *</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="OPS" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold">City</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Mumbai" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold">Principal Name</label>
            <input value={form.principalName} onChange={(e) => setForm({ ...form, principalName: e.target.value })} placeholder="Dr. Arthur Vance" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm mt-1" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-semibold border border-border">Cancel</button>
          <button onClick={onSubmit} disabled={submitting} className="rounded-xl px-4 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center gap-1.5 hover:brightness-110 active:scale-[0.97] transition-all">
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Submit & Onboard
          </button>
        </div>
      </motion.div>
    </div>
  )
}
