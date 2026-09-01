'use client'

/**
 * SalaryStructuresSection — salary scales as self-explanatory cards:
 * base, net, component math, live usage, and lifecycle actions.
 * The editor uses a responsive component grid: five clear columns on
 * tablet/desktop, stacked rows on small screens — controls never
 * overlap, and Save/Cancel stay visible while the list scrolls.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Archive, ArchiveRestore, Copy, Layers, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSalaryStore, type SalaryStructureTemplate, type StructureComponent, type EmployeeType } from '@/lib/store/salary-store'
import { moneyMy, SalaryEmptyState } from './salary-shared'

const TYPES: Array<EmployeeType | 'All'> = ['Teaching', 'Administration', 'Support', 'Transport', 'Finance', 'All']

// ─── Component math (shared with the preview) ────────────────────────

function structureMath(base: number, components: StructureComponent[]) {
  const earnings = components.filter((c) => c.type === 'Earning')
    .reduce((s, c) => s + (c.basis === 'Percentage' ? Math.round(base * c.value / 100) : c.value), base)
  const deductions = components.filter((c) => c.type === 'Deduction')
    .reduce((s, c) => s + (c.basis === 'Percentage' ? Math.round(base * c.value / 100) : c.value), 0)
  return { earnings, deductions, net: earnings - deductions }
}

/** Compact ₹ amounts for the component summary (₹1.2K style). */
const shortInr = (n: number) =>
  n >= 1000 ? `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : `₹${n}`

/** Short component names for card summaries. */
const shortName = (name: string) => name
  .replace(' Allowance', '')
  .replace('Provident Fund', 'PF')
  .replace('Professional Tax', 'PT')

// ─── Section ─────────────────────────────────────────────────────────

export function SalaryStructuresSection() {
  const structures = useSalaryStore((s) => s.structures)
  const salaries = useSalaryStore((s) => s.salaries)
  const duplicateStructure = useSalaryStore((s) => s.duplicateStructure)
  const setStructureStatus = useSalaryStore((s) => s.setStructureStatus)

  const [showArchived, setShowArchived] = useState(false)
  const [editing, setEditing] = useState<SalaryStructureTemplate | 'new' | null>(null)

  const usage = useMemo(() => {
    const map: Record<string, number> = {}
    Object.values(salaries).forEach((s) => {
      map[s.salary.structureId] = (map[s.salary.structureId] ?? 0) + 1
    })
    return map
  }, [salaries])

  // Total staff salary assignments across all structures — the summary
  // badge's real figure (how many employees' salaries reference a
  // structure). Never invented.
  const staffAssigned = useMemo(() => Object.values(usage).reduce((s, n) => s + n, 0), [usage])

  const visible = structures.filter((s) => showArchived || s.status === 'Active')
  const archived = structures.filter((s) => s.status === 'Archived')

  return (
    <div className="space-y-4">
      {/* UX-REFINE — the "Salary Structure" tab already establishes context,
          so no page heading or explanatory line: summary badges left
          (structures / staff assigned), Archived filter + create right.
          Mirrors Fee Structures for a twin product feel. */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-muted/40">
            <Layers className="h-2.5 w-2.5" /> {structures.length} structure{structures.length === 1 ? '' : 's'}
          </Badge>
          <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-muted/40">
            <Users className="h-2.5 w-2.5" /> {staffAssigned} staff assigned
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {archived.length > 0 && (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? 'Hide Archived' : `Archived (${archived.length})`}
            </Button>
          )}
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setEditing('new')}>
            <Plus className="h-3.5 w-3.5" /> New Structure
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <SalaryEmptyState icon={<Layers className="h-5 w-5" />} title="No structures" action={
          <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setEditing('new')}>
            <Plus className="h-3.5 w-3.5" /> New Structure
          </Button>
        } />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {visible.map((s, i) => {
            const math = structureMath(s.baseAmount, s.components)
            const used = usage[s.id] ?? 0
            const isArchived = s.status === 'Archived'
            const earnings = s.components.filter((c) => c.type === 'Earning')
            const deductions = s.components.filter((c) => c.type === 'Deduction')
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className={cn(
                  'rounded-xl border bg-card p-4 flex flex-col gap-3',
                  isArchived && 'opacity-75',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {s.applicableTo}{s.description ? ` · ${s.description}` : ''}
                    </p>
                  </div>
                  {isArchived ? (
                    <Badge variant="outline" className="text-[9px] gap-1 shrink-0"><Archive className="h-2.5 w-2.5" /> Archive only</Badge>
                  ) : used > 0 ? (
                    <Badge variant="outline" className="text-[9px] shrink-0">Used by {used} staff</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] shrink-0 text-muted-foreground">Unused</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
                    <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Base</p>
                    <p className="text-sm font-bold tabular-nums mt-0.5">{moneyMy(s.baseAmount)}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-500/[0.07] px-2.5 py-1.5">
                    <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Net / month</p>
                    <p className="text-sm font-bold tabular-nums mt-0.5 text-emerald-600 dark:text-emerald-400">{moneyMy(math.net)}</p>
                  </div>
                </div>

                <div className="space-y-1 text-[10px] leading-relaxed min-h-[2rem]">
                  <p className="text-muted-foreground">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+ </span>
                    Basic {shortInr(s.baseAmount)}
                    {earnings.slice(0, 2).map((c) => ` · ${shortName(c.name)} ${shortInr(c.basis === 'Percentage' ? Math.round(s.baseAmount * c.value / 100) : c.value)}`).join('')}
                    {earnings.length > 2 ? ` · +${earnings.length - 2} more` : ''}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">− </span>
                    {deductions.slice(0, 2).map((c) => `${shortName(c.name)} ${shortInr(c.basis === 'Percentage' ? Math.round(s.baseAmount * c.value / 100) : c.value)}`).join(' · ') || '—'}
                    {deductions.length > 2 ? ` · +${deductions.length - 2} more` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-1 border-t mt-auto">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setEditing(s)}>
                    <Pencil className="h-3 w-3" /> View / Edit
                  </Button>
                  <Button
                    variant="ghost" size="sm" className="h-7 text-[11px] gap-1"
                    onClick={() => { duplicateStructure(s.id); toast.success('Structure duplicated', { description: `${s.name} (Copy)` }) }}
                  >
                    <Copy className="h-3 w-3" /> Duplicate
                  </Button>
                  <div className="flex-1" />
                  {isArchived ? (
                    <Button
                      variant="ghost" size="sm" className="h-7 text-[11px] gap-1 text-emerald-600 hover:text-emerald-700"
                      onClick={() => { setStructureStatus(s.id, 'Active'); toast.success('Structure restored', { description: s.name }) }}
                    >
                      <ArchiveRestore className="h-3 w-3" /> Restore
                    </Button>
                  ) : (
                    <Button
                      variant="ghost" size="sm" className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => { setStructureStatus(s.id, 'Archived'); toast.success('Structure archived', { description: `${s.name} — existing salaries unchanged` }) }}
                    >
                      <Archive className="h-3 w-3" /> Archive
                    </Button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Editor */}
      <StructureEditorDialog
        structure={editing === 'new' ? null : editing}
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  )
}

// ─── Editor dialog ───────────────────────────────────────────────────

interface EditorState {
  name: string
  applicableTo: EmployeeType | 'All'
  baseAmount: string
  components: StructureComponent[]
}

function toEditorState(s: SalaryStructureTemplate | null): EditorState {
  if (!s) return { name: '', applicableTo: 'Teaching', baseAmount: '', components: [] }
  return {
    name: s.name,
    applicableTo: s.applicableTo,
    baseAmount: String(s.baseAmount),
    components: s.components.map((c) => ({ ...c })),
  }
}

function StructureEditorDialog({
  structure, open, onOpenChange,
}: { structure: SalaryStructureTemplate | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const createStructure = useSalaryStore((s) => s.createStructure)
  const updateStructure = useSalaryStore((s) => s.updateStructure)

  const [state, setState] = useState<EditorState>(toEditorState(structure))
  const [key, setKey] = useState('')

  // Re-seed the form whenever the target changes.
  const targetKey = structure?.id ?? 'new'
  if (key !== targetKey) {
    setKey(targetKey)
    setState(toEditorState(structure))
  }

  const base = Number(state.baseAmount) || 0
  const math = structureMath(base, state.components)

  const addComponent = () => {
    setState((st) => ({
      ...st,
      components: [...st.components, { id: `c-${Date.now().toString(36)}`, name: '', type: 'Earning', basis: 'Percentage', value: 0 }],
    }))
  }

  const updateComponent = (id: string, patch: Partial<StructureComponent>) => {
    setState((st) => ({ ...st, components: st.components.map((c) => c.id === id ? { ...c, ...patch } : c) }))
  }

  const handleSave = () => {
    if (!state.name.trim()) { toast.error('Enter a name for this structure.'); return }
    if (base <= 0) { toast.error('Enter a valid base amount.'); return }
    const components = state.components.filter((c) => c.name.trim() && c.value > 0)
    try {
      if (structure) {
        updateStructure(structure.id, {
          name: state.name.trim(),
          applicableTo: state.applicableTo,
          baseAmount: base,
          components,
        })
        toast.success('Structure updated', { description: state.name.trim() })
      } else {
        createStructure({
          name: state.name.trim(),
          description: '',
          applicableTo: state.applicableTo,
          baseAmount: base,
          components,
        })
        toast.success('Structure created', { description: state.name.trim() })
      }
      onOpenChange(false)
    } catch (err) {
      toast.error('Could not save', { description: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90dvh] p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b shrink-0">
          <DialogTitle>{structure ? 'Edit Structure' : 'New Structure'}</DialogTitle>
          <DialogDescription>
            {structure ? structure.name : 'Name, base and components'}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable body — Save/Cancel stay in view however long the list */}
        <div className="flex-1 min-h-0 overflow-y-auto salary-scroll px-5 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="st-name">Name</Label>
                <Input id="st-name" className="h-9 text-xs" placeholder="e.g. Primary Teaching" value={state.name} onChange={(e) => setState((st) => ({ ...st, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Applies To</Label>
                <Select value={state.applicableTo} onValueChange={(v) => setState((st) => ({ ...st, applicableTo: v as EmployeeType | 'All' }))}>
                  <SelectTrigger className="h-9 w-full text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[70]">
                    {TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="st-base">Base Amount (₹/month)</Label>
              <Input
                id="st-base" inputMode="numeric" className="h-9 text-xs tabular-nums sm:max-w-[220px]" placeholder="10000"
                value={state.baseAmount}
                onChange={(e) => setState((st) => ({ ...st, baseAmount: e.target.value.replace(/[^0-9]/g, '') }))}
              />
            </div>

            {/* Live preview */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
                <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Earnings</p>
                <p className="text-sm font-bold tabular-nums mt-0.5">{moneyMy(math.earnings)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
                <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Deductions</p>
                <p className="text-sm font-bold tabular-nums mt-0.5 text-rose-600 dark:text-rose-400">{moneyMy(math.deductions)}</p>
              </div>
              <div className="rounded-lg bg-emerald-500/[0.07] px-2.5 py-1.5">
                <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Net</p>
                <p className="text-sm font-bold tabular-nums mt-0.5 text-emerald-600 dark:text-emerald-400">{moneyMy(math.net)}</p>
              </div>
            </div>

            {/* Components */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Components</Label>
                <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={addComponent}>
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              {state.components.length === 0 && (
                <p className="text-[11px] text-muted-foreground py-2 text-center rounded-lg border border-dashed">
                  Basic is included automatically — add allowances and deductions here.
                </p>
              )}

              {/* Column labels — tablet/desktop rows */}
              {state.components.length > 0 && (
                <div className="hidden sm:grid grid-cols-[1fr_108px_108px_92px_32px] gap-2 px-0.5">
                  <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Component</p>
                  <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Type</p>
                  <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Calculation</p>
                  <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Value</p>
                  <span />
                </div>
              )}

              {state.components.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-2 sm:grid-cols-[1fr_108px_108px_92px_32px] gap-2 items-center rounded-lg sm:rounded-none border sm:border-0 bg-muted/20 sm:bg-transparent p-2 sm:p-0"
                >
                  <Input
                    className="col-span-2 sm:col-span-1 h-8 text-xs"
                    placeholder="e.g. HRA"
                    value={c.name} onChange={(e) => updateComponent(c.id, { name: e.target.value })}
                  />
                  <Select value={c.type} onValueChange={(v) => updateComponent(c.id, { type: v as 'Earning' | 'Deduction' })}>
                    <SelectTrigger className="h-8 w-full text-[11px]"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[70]">
                      <SelectItem value="Earning" className="text-xs">Earning +</SelectItem>
                      <SelectItem value="Deduction" className="text-xs">Deduction −</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={c.basis} onValueChange={(v) => updateComponent(c.id, { basis: v as 'Fixed' | 'Percentage' })}>
                    <SelectTrigger className="h-8 w-full text-[11px]"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[70]">
                      <SelectItem value="Percentage" className="text-xs">% of Basic</SelectItem>
                      <SelectItem value="Fixed" className="text-xs">Fixed ₹</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Input
                      className="h-8 text-xs tabular-nums pr-6" inputMode="numeric"
                      value={c.value || ''} placeholder="0"
                      onChange={(e) => updateComponent(c.id, { value: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                      {c.basis === 'Percentage' ? '%' : '₹'}
                    </span>
                  </div>
                  <button
                    type="button" aria-label="Remove component"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors justify-self-end"
                    onClick={() => setState((st) => ({ ...st, components: st.components.filter((x) => x.id !== c.id) }))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-4 border-t bg-card shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave}>
            {structure ? 'Save Changes' : 'Create Structure'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
