'use client'

/**
 * Wizard Step 10 — Review & Submit (merged Preview + Confirmation).
 * Extracted from the original admission.tsx monolith (Task ID: 21).
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Users, MapPin, GraduationCap, School as SchoolIcon, Bus,
  Pencil, ChevronDown,
} from 'lucide-react'
import { school } from '@/lib/mock/school'
import { formatDate } from '@/lib/format'
import { GradientAvatar } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import {
  useAdmissionFeatureFlags,
} from '../lib/admission-utils'
import type { FormData } from '../constants'

export function ReviewStep({ data, flags, onJumpTo }: { data: FormData; flags: ReturnType<typeof useAdmissionFeatureFlags>; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void; onJumpTo: (step: number) => void }) {
  const [viewMode, setViewMode] = useState<'preview' | 'official'>('preview')
  // All sections expanded by default; track which are collapsed (manually closed)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const toggleSection = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const sections = [
    { id: 'Personal', step: 1, icon: User, rows: [
      { label: 'Name', value: `${data.firstName} ${data.lastName}`.trim() || '—' },
      { label: 'DOB', value: data.dob ? formatDate(data.dob) : '—' },
      { label: 'Gender', value: data.gender || '—' },
      ...(flags.enableBloodGroup ? [{ label: 'Blood Group', value: data.bloodGroup || '—' }] : []),
      ...(flags.enableAadhaar ? [{ label: 'Aadhaar', value: data.aadhaarNo || '—' }] : []),
    ]},
    { id: 'Parents', step: 2, icon: Users, rows: [
      { label: 'Father', value: data.fatherName || '—' },
      { label: 'Father Phone', value: data.fatherPhone || '—' },
      { label: 'Mother', value: data.motherName || '—' },
      { label: 'Emergency', value: data.emergencyName || '—' },
    ]},
    { id: 'Address', step: 3, icon: MapPin, rows: [
      { label: 'Current', value: [data.currentAddress, data.city, data.district, data.state].filter(Boolean).join(', ') || '—' },
      { label: 'PIN', value: data.pincode || '—' },
    ]},
    { id: 'Applying For', step: 4, icon: GraduationCap, rows: [
      { label: 'Session', value: data.previousYear || '—' },
      { label: 'Class', value: data.className || '—' },
      { label: 'Section', value: data.section || 'No preference' },
      ...(data.waitlisted ? [{ label: 'Status', value: 'Waitlisted' }] : []),
    ]},
    ...(data.previousSchool || data.previousClass ? [{ id: 'Previous School', step: 5, icon: SchoolIcon, rows: [
      { label: 'School', value: data.previousSchool || '—' },
      { label: 'Last Class', value: data.previousClass || '—' },
      { label: 'Session', value: data.previousYear || '—' },
      ...(data.tcNumber ? [{ label: 'TC No.', value: data.tcNumber }] : []),
    ]}] : []),
    ...((flags.enableTransport || flags.enableHostel) && (data.transportRequired || data.hostelRequired) ? [{ id: 'Transport', step: 6, icon: Bus, rows: [
      { label: 'Transport', value: data.transportRequired ? data.transportRoute || 'Yes' : 'No' },
      ...(data.hostelRequired ? [{ label: 'Hostel', value: data.hostelRoomType || 'Yes' }] : []),
    ]}] : []),
  ]

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl w-fit">
        <button type="button" onClick={() => setViewMode('preview')} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', viewMode === 'preview' ? 'bg-background text-primary shadow-xs' : 'text-muted-foreground')}>
          Digital View
        </button>
        <button type="button" onClick={() => setViewMode('official')} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', viewMode === 'official' ? 'bg-background text-primary shadow-xs' : 'text-muted-foreground')}>
          Official Form
        </button>
      </div>

      {/* Digital View — collapsible cards with quick edit */}
      {viewMode === 'preview' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <GradientAvatar name={`${data.firstName} ${data.lastName}`} size="xl" className="h-14 w-14 text-lg" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-foreground">{data.firstName} {data.lastName}</h3>
              <p className="text-xs text-muted-foreground">{data.className} {data.section ? `— ${data.section}` : ''} · {data.previousYear || school.academicYear}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {sections.map((section) => {
              const Icon = section.icon
              const isOpen = !collapsed.has(section.id)
              return (
                <div key={section.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSection(section.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection(section.id) } }}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-sm">{section.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onJumpTo(section.step) }}
                        className="flex items-center gap-1 text-[11px] font-medium text-primary hover:bg-primary/10 rounded-md px-2 py-1 transition-colors"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                    </div>
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3.5 pt-0 space-y-1.5">
                          {section.rows.map((row) => (
                            <div key={row.label} className="flex justify-between items-start text-xs gap-2">
                              <span className="text-muted-foreground shrink-0">{row.label}:</span>
                              <span className="font-medium text-foreground text-right">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Official Form View */}
      {viewMode === 'official' && (
        <div className="rounded-2xl border-2 border-border bg-card p-6 space-y-4 shadow-sm">
          <div className="flex items-start justify-between border-b-2 border-foreground/20 pb-3 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-foreground text-background font-display text-xl font-black">{school.logo}</div>
              <div>
                <h2 className="font-bold text-base uppercase tracking-wide">{school.name}</h2>
                <p className="text-[10px] text-muted-foreground">{school.affiliation}</p>
              </div>
            </div>
            <div className="text-right text-[10px]">
              <p className="font-bold text-primary">FORM NO: ADM-{school.session}</p>
              <p className="text-muted-foreground">{school.academicYear}</p>
            </div>
          </div>

          <div className="text-center bg-muted/40 py-1.5 rounded-lg border border-border">
            <h3 className="font-bold text-xs uppercase tracking-widest">STUDENT ADMISSION FORM</h3>
          </div>

          <div className="grid sm:grid-cols-[1fr_100px] gap-4">
            <div className="space-y-3">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary border-b border-border pb-0.5 mb-1.5">Personal</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                  <div><span className="text-muted-foreground">Name:</span> <strong className="block">{data.firstName} {data.lastName}</strong></div>
                  <div><span className="text-muted-foreground">DOB:</span> <strong className="block">{data.dob ? formatDate(data.dob) : '—'}</strong></div>
                  <div><span className="text-muted-foreground">Gender:</span> <strong className="block">{data.gender || '—'}</strong></div>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary border-b border-border pb-0.5 mb-1.5">Parents</h4>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div><span className="text-muted-foreground">Father:</span> <strong className="block">{data.fatherName || '—'}</strong></div>
                  <div><span className="text-muted-foreground">Phone:</span> <strong className="block">{data.fatherPhone || '—'}</strong></div>
                  <div><span className="text-muted-foreground">Mother:</span> <strong className="block">{data.motherName || '—'}</strong></div>
                  <div><span className="text-muted-foreground">Emergency:</span> <strong className="block">{data.emergencyName || '—'}</strong></div>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary border-b border-border pb-0.5 mb-1.5">Address & Academic</h4>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div><span className="text-muted-foreground">Address:</span> <strong className="block">{[data.currentAddress, data.city, data.state].filter(Boolean).join(', ') || '—'}</strong></div>
                  <div><span className="text-muted-foreground">Class:</span> <strong className="block">{data.className} {data.section ? `- ${data.section}` : ''}</strong></div>
                  <div><span className="text-muted-foreground">Prev School:</span> <strong className="block">{data.previousSchool || '—'}</strong></div>
                  <div><span className="text-muted-foreground">Transport:</span> <strong className="block">{data.transportRequired ? data.transportRoute || 'Yes' : 'No'}</strong></div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-28 w-24 rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                {data.photoUploaded ? <GradientAvatar name={`${data.firstName} ${data.lastName}`} size="xl" className="h-full w-full rounded-md" /> : <span className="text-[9px] text-muted-foreground text-center px-1">AFFIX PHOTO</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border text-center text-[10px]">
            <div><div className="h-6 border-b border-foreground/40 mb-1" /><p className="font-medium">Parent Signature</p></div>
            <div><div className="h-6 border-b border-foreground/40 mb-1" /><p className="font-medium">Principal Signature</p></div>
          </div>
        </div>
      )}
    </div>
  )
}
