'use client'

/**
 * SettingsTab — functional examination configuration center.
 *
 * Left-nav sections:
 *   General | Exam Types | Grading | Marks & Results | Attendance |
 *   Admit Cards | Report Cards | Publication
 *
 * All settings persist to DB via /api/exams/settings/*.
 * Settings affect result engine, admit cards, report cards.
 */

import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, GraduationCap, Award, ClipboardCheck, Calendar, Ticket, FileText, Send, Plus, Trash2, Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { InlineLoading } from '../inline-loading'
import { useRoleGate } from '@/lib/exams/use-role-gate'
import {
  useExamTypes,
  useGradeScales,
  useExamRules,
  useAdmitCardConfig,
  useReportCardConfig,
} from '@/lib/exams/use-exam-settings'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Section = 'general' | 'types' | 'grading' | 'rules' | 'admit' | 'report' | 'publication'

const SECTIONS = [
  { value: 'general', label: 'General', icon: SettingsIcon },
  { value: 'types', label: 'Exam Types', icon: GraduationCap },
  { value: 'grading', label: 'Grading', icon: Award },
  { value: 'rules', label: 'Marks & Results', icon: ClipboardCheck },
  { value: 'admit', label: 'Admit Cards', icon: Ticket },
  { value: 'report', label: 'Report Cards', icon: FileText },
  { value: 'publication', label: 'Publication', icon: Send },
] as const

export function SettingsTab() {
  const [section, setSection] = useState<Section>('general')
  const gate = useRoleGate()
  const readOnly = !gate.canEdit

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
      {/* Left nav */}
      <div className="rounded-xl border border-border bg-card p-2 lg:sticky lg:top-0 lg:self-start">
        <div className="space-y-0.5">
          {SECTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSection(s.value as Section)}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left',
                section === s.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              )}
            >
              <s.icon className="h-3.5 w-3.5 shrink-0" />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right content */}
      <div>
        {section === 'general' && <GeneralSection readOnly={readOnly} />}
        {section === 'types' && <ExamTypesSection readOnly={readOnly} />}
        {section === 'grading' && <GradingSection readOnly={readOnly} />}
        {section === 'rules' && <RulesSection readOnly={readOnly} />}
        {section === 'admit' && <AdmitCardSection readOnly={readOnly} />}
        {section === 'report' && <ReportCardSection readOnly={readOnly} />}
        {section === 'publication' && <PublicationSection readOnly={readOnly} />}
      </div>
    </div>
  )
}

function SectionHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {desc && <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>}
    </div>
  )
}

function ReadOnlyNotice() {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 mb-3">
      <p className="text-[10px] text-amber-700 dark:text-amber-300">Read-only — only Principal can modify settings.</p>
    </div>
  )
}

// ─── General Section ──────────────────────────────────────────────────

function GeneralSection({ readOnly }: { readOnly: boolean }) {
  const { rules, loading, save } = useExamRules()
  const [local, setLocal] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setLocal(rules)
    setDirty(false)
  }, [rules])

  const handleSave = async () => {
    try {
      await save(local)
      toast.success('Settings saved')
      setDirty(false)
    } catch (e: any) {
      toast.error('Failed to save', { description: e.message })
    }
  }

  if (loading) return <InlineLoading label="Loading settings…" />

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <SectionHeader title="General Defaults" desc="Default values used when creating new examinations." />
      {readOnly && <ReadOnlyNotice />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px]">Default Maximum Marks</Label>
          <Input
            type="number"
            value={local.defaultMaxMarks ?? ''}
            onChange={(e) => { setLocal({ ...local, defaultMaxMarks: e.target.value }); setDirty(true) }}
            disabled={readOnly}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px]">Default Passing Marks</Label>
          <Input
            type="number"
            value={local.defaultPassMarks ?? ''}
            onChange={(e) => { setLocal({ ...local, defaultPassMarks: e.target.value }); setDirty(true) }}
            disabled={readOnly}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px]">Default Exam Duration (minutes)</Label>
          <Input
            type="number"
            value={local.defaultExamDuration ?? ''}
            onChange={(e) => { setLocal({ ...local, defaultExamDuration: e.target.value }); setDirty(true) }}
            disabled={readOnly}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px]">Grace Marks Limit</Label>
          <Input
            type="number"
            value={local.graceMarksLimit ?? ''}
            onChange={(e) => { setLocal({ ...local, graceMarksLimit: e.target.value }); setDirty(true) }}
            disabled={readOnly}
            className="h-8 text-xs"
          />
        </div>
      </div>
      {!readOnly && (
        <Button size="sm" className="mt-3 h-7 text-xs gap-1.5" onClick={handleSave} disabled={!dirty}>
          {dirty ? <Save className="h-3 w-3" /> : <Check className="h-3 w-3" />} {dirty ? 'Save Changes' : 'Saved'}
        </Button>
      )}
    </div>
  )
}

// ─── Exam Types Section ───────────────────────────────────────────────

function ExamTypesSection({ readOnly }: { readOnly: boolean }) {
  const { types, loading, create, update, remove } = useExamTypes()
  const [newName, setNewName] = useState('')

  const handleAdd = async () => {
    if (!newName.trim()) return
    try {
      await create({ name: newName.trim() })
      setNewName('')
      toast.success('Exam type added')
    } catch (e: any) {
      toast.error('Failed to add', { description: e.message })
    }
  }

  if (loading) return <InlineLoading label="Loading exam types…" />

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <SectionHeader title="Examination Types" desc="Manage examination types used across the school." />
      {readOnly && <ReadOnlyNotice />}
      {!readOnly && (
        <div className="flex gap-2 mb-3">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Viva" className="h-8 text-xs flex-1" />
          <Button size="sm" className="h-8 text-xs gap-1" onClick={handleAdd}><Plus className="h-3 w-3" /> Add</Button>
        </div>
      )}
      <div className="space-y-1">
        {types.map((t) => (
          <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/60">
            <Checkbox
              checked={t.enabled}
              onCheckedChange={(v) => !readOnly && update(t.id, { enabled: v === true })}
              disabled={readOnly}
            />
            <span className="text-xs font-medium flex-1">{t.name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">{t.code}</span>
            {!readOnly && (
              <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-rose-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Grading Section ──────────────────────────────────────────────────

function GradingSection({ readOnly }: { readOnly: boolean }) {
  const { scales, loading, create, update, remove } = useGradeScales()
  const [newGrade, setNewGrade] = useState({ grade: '', minPct: '', maxPct: '100' })

  const handleAdd = async () => {
    if (!newGrade.grade.trim()) return
    try {
      await create({
        grade: newGrade.grade.trim(),
        minPct: Number(newGrade.minPct) || 0,
        maxPct: Number(newGrade.maxPct) || 100,
      })
      setNewGrade({ grade: '', minPct: '', maxPct: '100' })
      toast.success('Grade added')
    } catch (e: any) {
      toast.error('Failed to add', { description: e.message })
    }
  }

  if (loading) return <InlineLoading label="Loading grading…" />

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <SectionHeader title="Grading Scales" desc="Grade boundaries used in result calculation. Minimum percentage is inclusive." />
      {readOnly && <ReadOnlyNotice />}
      {!readOnly && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          <Input value={newGrade.grade} onChange={(e) => setNewGrade({ ...newGrade, grade: e.target.value })} placeholder="Grade (e.g. A+)" className="h-8 text-xs" />
          <Input type="number" value={newGrade.minPct} onChange={(e) => setNewGrade({ ...newGrade, minPct: e.target.value })} placeholder="Min %" className="h-8 text-xs" />
          <Input type="number" value={newGrade.maxPct} onChange={(e) => setNewGrade({ ...newGrade, maxPct: e.target.value })} placeholder="Max %" className="h-8 text-xs" />
          <Button size="sm" className="h-8 text-xs gap-1" onClick={handleAdd}><Plus className="h-3 w-3" /> Add</Button>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Grade</TableHead>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Min %</TableHead>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Max %</TableHead>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Color</TableHead>
              {!readOnly && <TableHead className="w-8"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {scales.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-xs font-bold">{s.grade}</TableCell>
                <TableCell className="text-xs text-center tabular-nums">
                  <input
                    type="number"
                    value={s.minPct}
                    onChange={(e) => !readOnly && update(s.id, { minPct: Number(e.target.value) })}
                    disabled={readOnly}
                    className="w-16 text-center bg-transparent border-0 outline-none text-xs"
                  />
                </TableCell>
                <TableCell className="text-xs text-center tabular-nums">
                  <input
                    type="number"
                    value={s.maxPct}
                    onChange={(e) => !readOnly && update(s.id, { maxPct: Number(e.target.value) })}
                    disabled={readOnly}
                    className="w-16 text-center bg-transparent border-0 outline-none text-xs"
                  />
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn('inline-block h-3 w-3 rounded-full', gradeColorClass(s.color))} />
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-rose-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function gradeColorClass(color: string | null): string {
  switch (color) {
    case 'emerald': return 'bg-emerald-500'
    case 'sky': return 'bg-sky-500'
    case 'amber': return 'bg-amber-500'
    case 'orange': return 'bg-orange-500'
    case 'rose': return 'bg-rose-500'
    default: return 'bg-violet-500'
  }
}

// ─── Rules Section (Marks & Results) ─────────────────────────────────

function RulesSection({ readOnly }: { readOnly: boolean }) {
  const { rules, loading, save } = useExamRules()
  const [local, setLocal] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setLocal(rules)
    setDirty(false)
  }, [rules])

  const handleSave = async () => {
    try {
      await save(local)
      toast.success('Rules saved')
      setDirty(false)
    } catch (e: any) {
      toast.error('Failed to save', { description: e.message })
    }
  }

  if (loading) return <InlineLoading label="Loading rules…" />

  const numberRule = (key: string, label: string) => (
    <div>
      <Label className="text-[10px]">{label}</Label>
      <Input
        type="number"
        value={local[key] ?? ''}
        onChange={(e) => { setLocal({ ...local, [key]: e.target.value }); setDirty(true) }}
        disabled={readOnly}
        className="h-8 text-xs"
      />
    </div>
  )

  const boolRule = (key: string, label: string): { checked: boolean; onChange: (v: boolean) => void } => ({
    checked: local[key] === 'true',
    onChange: (v) => { setLocal({ ...local, [key]: v ? 'true' : 'false' }); setDirty(true) },
  })

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <SectionHeader title="Marks & Passing Rules" desc="Affects result calculation for all examinations." />
        {readOnly && <ReadOnlyNotice />}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {numberRule('passPercentage', 'Pass Percentage')}
          {numberRule('graceMarksLimit', 'Grace Marks Limit')}
          <div>
            <Label className="text-[10px]">Rounding Method</Label>
            <select
              value={local.roundingMethod ?? 'round'}
              onChange={(e) => { setLocal({ ...local, roundingMethod: e.target.value }); setDirty(true) }}
              disabled={readOnly}
              className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="round">Round</option>
              <option value="floor">Floor</option>
              <option value="ceil">Ceiling</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <SectionHeader title="Result Calculation" desc="Rank, tie, and outcome rules." />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-[10px]">Rank Calculation</Label>
            <select
              value={local.rankCalculation ?? 'percentage'}
              onChange={(e) => { setLocal({ ...local, rankCalculation: e.target.value }); setDirty(true) }}
              disabled={readOnly}
              className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="percentage">By Percentage</option>
              <option value="total">By Total Marks</option>
            </select>
          </div>
          <div>
            <Label className="text-[10px]">Tie Handling</Label>
            <select
              value={local.tieHandling ?? 'share'}
              onChange={(e) => { setLocal({ ...local, tieHandling: e.target.value }); setDirty(true) }}
              disabled={readOnly}
              className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="share">Share Rank</option>
              <option value="skip">Skip Next</option>
            </select>
          </div>
          {numberRule('compartmentThreshold', 'Compartment (failed ≥)')}
          {numberRule('retestThreshold', 'Retest (failed ≥)')}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <SectionHeader title="Workflow Rules" desc="Marks submission, verification, and lock requirements." />
        <div className="space-y-2">
          <RuleSwitch label="Allow teacher edits" {...boolRule('allowTeacherEdits', 'Allow teacher edits')} disabled={readOnly} />
          <RuleSwitch label="Require verification before lock" {...boolRule('requireVerification', 'Require verification')} disabled={readOnly} />
          <RuleSwitch label="Require lock before declare" {...boolRule('requireLockBeforeDeclare', 'Require lock before declare')} disabled={readOnly} />
          <RuleSwitch label="Only Principal can override" {...boolRule('principalOnlyOverride', 'Principal-only override')} disabled={readOnly} />
        </div>
      </div>

      {!readOnly && (
        <Button size="sm" className="h-7 text-xs gap-1.5" onClick={handleSave} disabled={!dirty}>
          {dirty ? <Save className="h-3 w-3" /> : <Check className="h-3 w-3" />} {dirty ? 'Save All Changes' : 'Saved'}
        </Button>
      )}
    </div>
  )
}

function RuleSwitch({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/60 cursor-pointer">
      <span className="text-xs">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </label>
  )
}

// ─── Admit Card Section ──────────────────────────────────────────────

function AdmitCardSection({ readOnly }: { readOnly: boolean }) {
  const { config, loading, save } = useAdmitCardConfig()
  const [local, setLocal] = useState<Record<string, boolean>>({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (config) {
      setLocal(config as any)
      setDirty(false)
    }
  }, [config])

  const handleSave = async () => {
    try {
      await save(local)
      toast.success('Admit card settings saved')
      setDirty(false)
    } catch (e: any) {
      toast.error('Failed to save', { description: e.message })
    }
  }

  if (loading || !config) return <InlineLoading label="Loading admit card settings…" />

  const toggles: Array<{ key: keyof typeof config; label: string }> = [
    { key: 'showPhoto', label: 'Student Photo' },
    { key: 'showRollNumber', label: 'Roll Number' },
    { key: 'showRoom', label: 'Room' },
    { key: 'showSeatNumber', label: 'Seat Number' },
    { key: 'showTimetable', label: 'Subject Timetable' },
    { key: 'showInstructions', label: 'Instructions' },
    { key: 'showQrCode', label: 'QR Code' },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <SectionHeader title="Admit Card Settings" desc="Controls what appears on generated admit cards." />
      {readOnly && <ReadOnlyNotice />}
      <div className="space-y-2">
        {toggles.map((t) => (
          <label key={t.key} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/60">
            <span className="text-xs">{t.label}</span>
            <Switch
              checked={local[t.key] ?? config[t.key]}
              onCheckedChange={(v) => { setLocal({ ...local, [t.key]: v }); setDirty(true) }}
              disabled={readOnly}
            />
          </label>
        ))}
      </div>
      {!readOnly && (
        <Button size="sm" className="mt-3 h-7 text-xs gap-1.5" onClick={handleSave} disabled={!dirty}>
          {dirty ? <Save className="h-3 w-3" /> : <Check className="h-3 w-3" />} {dirty ? 'Save Changes' : 'Saved'}
        </Button>
      )}
    </div>
  )
}

// ─── Report Card Section ─────────────────────────────────────────────

function ReportCardSection({ readOnly }: { readOnly: boolean }) {
  const { config, loading, save } = useReportCardConfig()
  const [local, setLocal] = useState<Record<string, boolean>>({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (config) {
      setLocal(config as any)
      setDirty(false)
    }
  }, [config])

  const handleSave = async () => {
    try {
      await save(local)
      toast.success('Report card settings saved')
      setDirty(false)
    } catch (e: any) {
      toast.error('Failed to save', { description: e.message })
    }
  }

  if (loading || !config) return <InlineLoading label="Loading report card settings…" />

  const toggles: Array<{ key: keyof typeof config; label: string }> = [
    { key: 'showAttendance', label: 'Attendance' },
    { key: 'showRank', label: 'Rank' },
    { key: 'showPercentage', label: 'Percentage' },
    { key: 'showGrade', label: 'Grade' },
    { key: 'showCoScholastic', label: 'Co-Scholastic Section' },
    { key: 'showRemarks', label: 'Remarks' },
    { key: 'showClassTeacherSign', label: 'Class Teacher Signature' },
    { key: 'showPrincipalSign', label: 'Principal Signature' },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <SectionHeader title="Report Card Settings" desc="Controls what appears on generated report cards." />
      {readOnly && <ReadOnlyNotice />}
      <div className="space-y-2">
        {toggles.map((t) => (
          <label key={t.key} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/60">
            <span className="text-xs">{t.label}</span>
            <Switch
              checked={local[t.key] ?? config[t.key]}
              onCheckedChange={(v) => { setLocal({ ...local, [t.key]: v }); setDirty(true) }}
              disabled={readOnly}
            />
          </label>
        ))}
      </div>
      {!readOnly && (
        <Button size="sm" className="mt-3 h-7 text-xs gap-1.5" onClick={handleSave} disabled={!dirty}>
          {dirty ? <Save className="h-3 w-3" /> : <Check className="h-3 w-3" />} {dirty ? 'Save Changes' : 'Saved'}
        </Button>
      )}
    </div>
  )
}

// ─── Publication Section ─────────────────────────────────────────────

function PublicationSection({ readOnly }: { readOnly: boolean }) {
  const { rules, loading, save } = useExamRules()
  const [local, setLocal] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setLocal(rules)
    setDirty(false)
  }, [rules])

  const handleSave = async () => {
    try {
      await save(local)
      toast.success('Publication settings saved')
      setDirty(false)
    } catch (e: any) {
      toast.error('Failed to save', { description: e.message })
    }
  }

  if (loading) return <InlineLoading label="Loading…" />

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <SectionHeader title="Result Publication" desc="Controls how results are published and notified." />
      {readOnly && <ReadOnlyNotice />}
      <div className="space-y-3">
        <div>
          <Label className="text-[10px]">Publication Mode</Label>
          <select
            value={local.resultPublication ?? 'manual'}
            onChange={(e) => { setLocal({ ...local, resultPublication: e.target.value }); setDirty(true) }}
            disabled={readOnly}
            className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="manual">Manual (Principal publishes)</option>
            <option value="auto">Automatic (after lock + declare)</option>
          </select>
        </div>
        <RuleSwitch
          label="Require Principal approval"
          checked={local.principalOnlyOverride === 'true'}
          onChange={(v) => { setLocal({ ...local, principalOnlyOverride: v ? 'true' : 'false' }); setDirty(true) }}
          disabled={readOnly}
        />
        <div className="rounded-lg bg-muted/30 p-2 text-[10px] text-muted-foreground">
          <p>In-app notifications are sent to students on publish.</p>
          <p>Email/SMS/WhatsApp are not configured in this deployment.</p>
        </div>
      </div>
      {!readOnly && (
        <Button size="sm" className="mt-3 h-7 text-xs gap-1.5" onClick={handleSave} disabled={!dirty}>
          {dirty ? <Save className="h-3 w-3" /> : <Check className="h-3 w-3" />} {dirty ? 'Save Changes' : 'Saved'}
        </Button>
      )}
    </div>
  )
}
