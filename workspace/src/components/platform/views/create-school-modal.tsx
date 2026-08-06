'use client'

import React from 'react'

interface CreateSchoolModalProps {
  open: boolean
  onClose: () => void
  newSchoolName: string
  setNewSchoolName: (s: string) => void
  newSchoolDomain: string
  setNewSchoolDomain: (s: string) => void
  newSchoolCode: string
  setNewSchoolCode: (s: string) => void
  handleCreateSchool: (e: React.FormEvent) => void
}

export function CreateSchoolModal({
  open,
  onClose,
  newSchoolName,
  setNewSchoolName,
  newSchoolDomain,
  setNewSchoolDomain,
  newSchoolCode,
  setNewSchoolCode,
  handleCreateSchool,
}: CreateSchoolModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-500 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Onboard New School Tenant</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
        </div>

        <form onSubmit={handleCreateSchool} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">School Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Oxford Lyceum International"
              value={newSchoolName}
              onChange={(e) => setNewSchoolName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-secondary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Tenant Domain / Subdomain</label>
            <input
              type="text"
              required
              placeholder="e.g. oxford.scholario.com"
              value={newSchoolDomain}
              onChange={(e) => setNewSchoolDomain(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-secondary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">School Code / UID</label>
            <input
              type="text"
              placeholder="e.g. SCH-04"
              value={newSchoolCode}
              onChange={(e) => setNewSchoolCode(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-secondary"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-secondary hover:brightness-110 rounded-xl transition cursor-pointer"
            >
              Onboard Tenant
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
