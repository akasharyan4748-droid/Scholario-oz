'use client'

/**
 * FeesStudentAccountsSection — Principal's student fee account search + workspace.
 *
 * Phase 1: SearchFilterBar-style filter toolbar — free-text search (name /
 *   ID / admission / roll / class / section) composed with Class and Status
 *   selects feeding the visible grid below.
 * Phase 2: When a student is selected → opens the student fee account
 *   workspace drawer with THREE top-level tabs (deliberate information
 *   architecture — the underlying ERP keeps every financial concept while
 *   the Principal-facing surface stays simple; UX benchmark: Salary &
 *   Payroll → Employee Account drawer):
 *
 *   Account  — the student's current financial position: account position
 *              (core vs additional), dues/outstanding, concessions and
 *              optional-charge applicability — with the detailed Fee Ledger
 *              one contextual action away ("View Fee Ledger →").
 *   Payments — recorded PAYMENT history (payment = resulting financial
 *              record; collection = the workflow that creates it — the two
 *              are never merged). Each payment row carries its A5 dual-copy
 *              receipt action.
 *   History  — auditable account-level financial activity (payments,
 *              receipts, concession lifecycle, applicability changes).
 *
 * The former top-level Fee Ledger / Receipts / Concessions / Dues tabs were
 * RE-HOMED, not deleted: ledger → contextual sub-view of Account;
 * receipts → per-payment receipt actions in Payments; concessions + dues →
 * compact sections inside Account. One canonical implementation each —
 * no parallel v2 components.
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, Wallet, IndianRupee, ChevronRight, ArrowLeft,
  AlertCircle, FileText, History, ShieldCheck, User,
  Check, Plus, Ban, Bus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFeeData, useFeeStore, studentOptionalHeadChoices, type StudentFeeAccount, type LedgerEntry, type ConcessionType } from '@/lib/store/fee-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeePanel, FeeStat, FeeStatusBadge, FeeEmptyState, ModeIcon, modeAccent, statusAccent, FeePill } from './fees-shared'
import { FeeReceiptA5Preview, printReceiptA5, downloadReceiptA5 } from './fee-receipt-a5'
import { toast } from 'sonner'

interface Props {
  data: ReturnType<typeof useFeeData>
  onCollect: (studentId: string) => void
  /** Deep-link request from the command palette (fee result) — opens the
   * matching student's fee account workspace directly. */
  focusStudent?: { name: string; ts: number } | null
}

/**
 * GRID CAP RULE — one consistent rule (documents itself in code, see the
 * visibleAccounts memo): always render the FIRST 24 accounts of the
 * *filtered* result set, whether or not a search query is active. Replaces
 * the old inconsistent behaviour of 12 results when idle vs 20 when
 * searching. Filtering composes BEFORE the cap, so a narrowed filter set is
 * never truncated unless it exceeds 24 on its own.
 */
const MAX_VISIBLE_ACCOUNTS = 24

/** Status facet options — mirrors FeePaymentStatus minus the internal-only
 *  'On Hold' state, which the Principal-facing grid never exposes. */
const STATUS_FILTERS = ['Paid', 'Partially Paid', 'Due', 'Overdue'] as const

// ─── Local stat tile ─────────────────────────────────────────────────
// Mirrors the shared FeeStat chrome but supports strict right-alignment
// (needed by the account-card minis) and pins the benchmark tile classes:
// rounded-lg bg-muted/40 px-2.5 py-1.5 · text-[9px] uppercase labels ·
// text-sm font-bold tabular-nums values. Kept local because fees-shared.tsx
// is owned by another task — promoting it there later is a safe follow-up.

const TILE_ACCENTS = {
  default: '',
  emerald: 'text-emerald-600',
  rose: 'text-rose-600',
  amber: 'text-amber-600',
} as const

function StatTile({ label, value, sub, accent = 'default', align = 'left', className }: {
  label: string
  value: string | number
  sub?: string
  /** @default 'default' */
  accent?: 'default' | 'emerald' | 'rose' | 'amber'
  align?: 'left' | 'right'
  className?: string
}) {
  return (
    <div className={cn('rounded-lg bg-muted/40 px-2.5 py-1.5', align === 'right' && 'text-right', className)}>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className={cn('text-sm font-bold tabular-nums mt-0.5', TILE_ACCENTS[accent])}>{value}</p>
      {sub && <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{sub}</p>}
    </div>
  )
}

export function FeesStudentAccountsSection({ data, onCollect, focusStudent }: Props) {
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  // The drawer keeps the SELECTED STUDENT ID, not an account snapshot —
  // the account object is re-derived from useFeeData() on every store
  // change, so KPIs, ledger and concessions stay live while the drawer
  // is open (e.g. after applying an optional charge or granting a
  // concession inside it).
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = useMemo(
    () => (selectedId ? data.accounts.find((a) => a.studentId === selectedId) ?? null : null),
    [data.accounts, selectedId],
  )

  // Consume the deep-link: match by student name (exact → prefix → contains)
  // and open the account drawer; fall back to an honest info toast when the
  // demo roster doesn't include that student. No first-word fallback —
  // matching "Aarav Sharma" to "Aarav Joshi" would open the wrong account.
  const handledFocusTs = useRef<number | null>(null)
  useEffect(() => {
    if (!focusStudent || handledFocusTs.current === focusStudent.ts) return
    handledFocusTs.current = focusStudent.ts
    const name = focusStudent.name.toLowerCase().trim()
    const match =
      data.accounts.find((a) => a.studentName.toLowerCase() === name) ??
      data.accounts.find((a) => name.startsWith(a.studentName.toLowerCase())) ??
      data.accounts.find((a) => a.studentName.toLowerCase().includes(name))
    if (match) {
      setSelectedId(match.studentId)
      toast.success(`Opened ${match.studentName}'s fee account`, { description: 'Deep-linked from global search' })
    } else {
      toast.info(`${focusStudent.name} — fee directory`, {
        description: 'Fee record synced from the school database. The interactive demo roster may not include this account yet.',
      })
    }
  }, [focusStudent?.ts, data.accounts])

  // Class facet — UNIQUE_CLASSES derived off the live accounts roster
  // (unique classNames in first-appearance order, which follows the policy
  // grade sequence the data layer emits). No classDisplayName helper exists
  // locally, so the stored display name (e.g. "Class 11 — Science (PCM)")
  // is used verbatim.
  const uniqueClasses = useMemo(
    () => Array.from(new Set(data.accounts.map((a) => a.className))),
    [data.accounts],
  )

  // Composed filtering: query match AND class AND status. An empty query
  // merely skips the text predicate — it no longer short-circuits the rest
  // of the pipeline (the old "idle ≠ searching" inconsistency is gone).
  const filteredAccounts = useMemo(() => {
    const q = search.toLowerCase().trim()
    return data.accounts.filter((a) => {
      const matchesQuery =
        !q ||
        a.studentName.toLowerCase().includes(q) ||
        a.studentId.toLowerCase().includes(q) ||
        a.admissionNo.toLowerCase().includes(q) ||
        a.rollNo.toLowerCase().includes(q) ||
        a.className.toLowerCase().includes(q) ||
        a.section.toLowerCase().includes(q)
      const matchesClass = classFilter === 'all' || a.className === classFilter
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter
      return matchesQuery && matchesClass && matchesStatus
    })
  }, [data.accounts, search, classFilter, statusFilter])

  // Apply the single grid cap (see MAX_VISIBLE_ACCOUNTS) after composition.
  const visibleAccounts = useMemo(
    () => filteredAccounts.slice(0, MAX_VISIBLE_ACCOUNTS),
    [filteredAccounts],
  )

  const clearFilters = () => {
    setSearch('')
    setClassFilter('all')
    setStatusFilter('all')
  }

  return (
    <div className="space-y-4">
      {/* Filter toolbar — SearchFilterBar pattern: search (flex-1 max-w-md,
          Search lucide absolute left-3, pl-9 h-9 text-xs) + Class and Status
          Select facets (h-9 text-[11px] w-[130px] text-xs triggers), with a
          results summary beside the filters (desktop only). */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          {/* Matching still reaches rollNo/studentId/section even though the
              placeholder only promises name, admission no and class — see
              filteredAccounts. */}
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, admission no, class…"
            className="pl-9 pr-8 h-9 text-xs"
          />
          {search && (
            <button aria-label="Clear search" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Results summary — roster size vs rendered count */}
          <span role="status" className="hidden sm:block text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">
            {data.accounts.length} student{data.accounts.length === 1 ? '' : 's'} · showing {visibleAccounts.length}
          </span>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="h-9 text-[11px] w-[130px] text-xs"><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {uniqueClasses.map((cls) => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-[11px] w-[130px] text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visibleAccounts.map((a, i) => (
          <motion.button
            key={a.studentId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.28) }}
            onClick={() => setSelectedId(a.studentId)}
            aria-label={`Open account for ${a.studentName}`}
            className="group rounded-xl border border-border bg-card p-4 text-left hover:border-emerald-500/40 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold',
                  a.status === 'Paid' ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : a.status === 'Overdue' ? 'bg-gradient-to-br from-rose-500 to-pink-600'
                  : 'bg-gradient-to-br from-amber-500 to-orange-600',
                )}>
                  {a.studentName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{a.studentName}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{a.admissionNo} · {a.className}-{a.section}</p>
                </div>
              </div>
              <FeeStatusBadge status={a.status} />
            </div>
            {/* Payable / Paid / Due — numbers strictly right-aligned under
                their text-[9px] uppercase tracking-wider micro-labels; Due
                turns rose when anything is owed and flips to an emerald
                "Clear" state otherwise. */}
            <div className="grid grid-cols-3 gap-2">
              <StatTile label="Payable" value={formatINR(a.netPayable, true)} align="right" className="px-2 py-1.5" />
              <StatTile label="Paid" value={formatINR(a.paid, true)} accent="emerald" align="right" className="px-2 py-1.5" />
              {a.totalDue > 0
                ? <StatTile label="Due" value={formatINR(a.totalDue, true)} accent="rose" align="right" className="px-2 py-1.5" />
                : <StatTile label="Due" value="Clear" accent="emerald" align="right" className="px-2 py-1.5" />}
            </div>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40 text-[10px] text-muted-foreground">
              <span>{a.transactions.length} {a.transactions.length === 1 ? 'transaction' : 'transactions'}</span>
              <span className="inline-flex items-center gap-0.5 group-hover:text-emerald-600 transition-colors">
                Open Account <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </motion.button>
        ))}
        {visibleAccounts.length === 0 && (
          <div className="col-span-full">
            <FeeEmptyState
              icon={<User className="h-6 w-6" />}
              title="No students match these filters"
              description="Try a different name, admission no, or relax the class / status filters."
              action={(
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            />
          </div>
        )}
      </div>

      {/* Student Fee Account Drawer */}
      <AnimatePresence>
        {selected && (
          <StudentFeeAccountDrawer
            account={selected}
            onClose={() => setSelectedId(null)}
            onCollect={() => onCollect(selected.studentId)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Student Fee Account Drawer ──────────────────────────────────────

// THREE top-level tabs (see the file-header IA note): Account · Payments ·
// History. The Fee Ledger is a CONTEXTUAL SUB-VIEW of Account (ledgerOpen),
// not a tab — progressive disclosure, not information deletion.
type AccountTab = 'account' | 'payments' | 'history'

function StudentFeeAccountDrawer({ account, onClose, onCollect }: { account: StudentFeeAccount; onClose: () => void; onCollect: () => void }) {
  const [tab, setTab] = useState<AccountTab>('account')
  const [ledgerOpen, setLedgerOpen] = useState(false)
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null)

  // Tab switch wrapper — the ledger sub-view lives under the Account tab
  // only; leaving Account always collapses it so a returning visit starts
  // at the position summary.
  const goTab = (t: AccountTab) => {
    setLedgerOpen(false)
    setTab(t)
  }
  const receiptSettings = useFeeStore((s) => s.receiptSettings)

  const selectedReceipt = account.transactions.find((t) => t.id === selectedReceiptId)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-stretch justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        className="bg-card border-l border-border w-full max-w-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer header — opaque bg-card so scrim/content never bleeds
            through while the drawer body scrolls beneath. */}
        <div className="shrink-0 border-b border-border bg-card px-5 py-3.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={onClose}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
            <FeeStatusBadge status={account.status} />
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white font-bold',
              account.status === 'Paid' ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
              : account.status === 'Overdue' ? 'bg-gradient-to-br from-rose-500 to-pink-600'
              : 'bg-gradient-to-br from-amber-500 to-orange-600',
            )}>
              {account.studentName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold truncate">{account.studentName}</h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                {account.admissionNo} · Roll {account.rollNo} · {account.className}-{account.section}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Guardian: {account.guardianName} · {account.guardianPhone}
              </p>
            </div>
            {(account.outstanding > 0 || account.additional.outstanding > 0) && (
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shrink-0" onClick={onCollect}>
                <Wallet className="h-3.5 w-3.5" /> Collect
              </Button>
            )}
          </div>
          {/* Summary stat strip — every tile shares the normalized chrome
              (rounded-lg bg-muted/40 px-2.5 py-1.5 · text-[9px] uppercase
              labels · text-sm font-bold tabular-nums values). The 5th tile
              still separates core vs additional outstanding — never one
              mixed number. */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-3">
            <StatTile label="Applicable" value={formatINR(account.totalApplicable, true)} />
            <StatTile label="Concession" value={account.concession > 0 ? `−${formatINR(account.concession, true)}` : '—'} accent="emerald" />
            <StatTile label="Net Payable" value={formatINR(account.netPayable, true)} />
            <StatTile label="Paid (core)" value={formatINR(account.paid, true)} accent="emerald" />
            <StatTile
              label="Core Outstanding"
              value={formatINR(account.outstanding, true)}
              accent="rose"
              sub={account.additional.outstanding > 0 ? `+ ${formatINR(account.additional.outstanding, true)} additional` : undefined}
            />
            <StatTile label="Total Due" value={formatINR(account.totalDue, true)} accent={account.totalDue > 0 ? 'amber' : 'default'} />
          </div>
        </div>

        {/* Tabs — exactly three top-level sections: Account · Payments ·
            History (IA refactor). Fee Ledger / Receipts / Concessions / Dues
            are re-homed contextually — see the file-header note. */}
        <div className="shrink-0 border-b border-border bg-muted/20 px-3 py-1.5 flex items-center gap-0.5 overflow-x-auto">
          {[
            { value: 'account' as const, label: 'Account', icon: <User className="h-3 w-3" /> },
            { value: 'payments' as const, label: 'Payments', icon: <Wallet className="h-3 w-3" /> },
            { value: 'history' as const, label: 'History', icon: <ShieldCheck className="h-3 w-3" /> },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => goTab(t.value)}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap',
                tab === t.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'account' && (
            ledgerOpen
              ? (
                <div className="space-y-3">
                  {/* Contextual ledger sub-view — the EXISTING canonical
                      AccountLedger, unchanged; reached via "View Fee Ledger →". */}
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 -ml-2" onClick={() => setLedgerOpen(false)}>
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Account
                  </Button>
                  <AccountLedger ledger={account.ledger} />
                </div>
              )
              : <AccountHome account={account} onCollect={onCollect} onOpenLedger={() => setLedgerOpen(true)} />
          )}
          {tab === 'payments' && <AccountPayments account={account} onViewReceipt={(id) => setSelectedReceiptId(id)} />}
          {tab === 'history' && <AccountAudit account={account} />}
        </div>

        {/* Receipt preview modal-in-drawer */}
        <AnimatePresence>
          {selectedReceipt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setSelectedReceiptId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-xl p-4 max-h-[90vh] overflow-y-auto"
              >
                {/* Canonical A5 dual-copy receipt (SaaS-STAGE-1 consolidation) */}
                <FeeReceiptA5Preview
                  transaction={selectedReceipt}
                  settings={receiptSettings}
                  onClose={() => setSelectedReceiptId(null)}
                  onPrint={() => { printReceiptA5(selectedReceipt, receiptSettings); useFeeStore.getState().markReceiptHandled(selectedReceipt.id, 'Principal'); toast.success('Print dialog opened') }}
                  onDownload={() => { downloadReceiptA5(selectedReceipt, receiptSettings); useFeeStore.getState().markReceiptHandled(selectedReceipt.id, 'Principal'); toast.success('Receipt downloaded', { description: `${selectedReceipt.receiptNo}.html` }) }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

function AccountOverview({ account }: { account: StudentFeeAccount }) {
  return (
    <div className="space-y-3">
      {/* CORE vs ADDITIONAL position — the two are shown as separate groups
          so the Principal never reads one mixed number. */}
      <FeePanel title="Account Position" subtitle="core fees and additional charges are tracked separately">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Core School Fees */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-2.5">
            <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1.5">Core School Fees</p>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Annual expected</span>
                <span className="font-semibold tabular-nums">{formatINR(account.coreExpected, true)}</span>
              </div>
              {account.examExpected > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exam fees (scheduled)</span>
                  <span className="font-semibold tabular-nums">{formatINR(account.examExpected, true)}</span>
                </div>
              )}
              {account.concession > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Concession</span>
                  <span className="font-semibold tabular-nums text-emerald-600">−{formatINR(account.concession, true)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border/40 pt-1">
                <span className="text-muted-foreground">Collected (core)</span>
                <span className="font-semibold tabular-nums text-emerald-600">{formatINR(account.paid, true)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Core outstanding</span>
                <span className="font-bold tabular-nums text-rose-600">{formatINR(account.outstanding, true)}</span>
              </div>
            </div>
          </div>
          {/* Additional Charges */}
          <div className={cn(
            'rounded-lg border p-2.5',
            account.additional.total > 0
              ? 'border-violet-500/20 bg-violet-500/[0.04]'
              : 'border-border bg-muted/20',
          )}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-violet-700 dark:text-violet-300">Additional Charges</p>
            {account.additional.charges.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-2">
                No additional charges apply to this student.
              </p>
            ) : (
              <div className="space-y-1.5">
                {account.additional.charges.map((c) => (
                  <div key={c.chargeId} className="text-[11px]">
                    <div className="flex justify-between gap-2">
                      <span className="truncate font-medium">{c.name}</span>
                      <span className="tabular-nums shrink-0">{formatINR(c.amount, true)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>{c.category} · due {c.dueDate}{c.mandatory ? '' : ' · optional'}</span>
                      <span className={cn('tabular-nums', c.outstanding === 0 ? 'text-emerald-600 font-semibold' : 'text-amber-600')}>
                        {c.outstanding === 0 ? 'Paid' : `${formatINR(c.outstanding, true)} due`}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border/40 pt-1 text-[11px]">
                  <span className="text-muted-foreground font-medium">Additional outstanding</span>
                  <span className="font-bold tabular-nums text-violet-700 dark:text-violet-300">{formatINR(account.additional.outstanding, true)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </FeePanel>

      {/* PART 9 — the per-student OPTIONAL-HEAD applicability boundary.
          Optional heads (Books, Uniform…) exist in the class structure as
          offerings; they become THIS student's charges ONLY through the
          explicit toggles below (audited in the store action). Transport
          follows bus enrolment and is shown read-only. */}
      <AccountOptionalCharges studentId={account.studentId} />
    </div>
  )
}

// ─── Account tab composition (IA refactor) ─────────────────────────

/**
 * AccountHome — the Account tab's landing composition. Answers ONE question
 * for the Principal: "what is this student's financial position?"
 *
 * Order of reading:
 *   1. Account Position (core vs additional) + optional-charge applicability
 *   2. Dues / Outstanding (with the real late-fee engine's overdue banner)
 *   3. Concessions (compact, auditable records — reuses the canonical
 *      AccountConcessions including its legitimate grant workflow)
 *   4. "View Fee Ledger →" — progressive-disclosure access to the full
 *      billing-frequency-aware ledger (rendered by the canonical
 *      AccountLedger as a contextual sub-view; never duplicated).
 *
 * The former "Status Timeline" preview was folded away deliberately: its
 * payment events live in Payments, its audit events live in History —
 * duplicating them here added cognitive load without new information.
 */
function AccountHome({ account, onCollect, onOpenLedger }: { account: StudentFeeAccount; onCollect: () => void; onOpenLedger: () => void }) {
  return (
    <div className="space-y-3">
      <AccountOverview account={account} />
      <AccountDues account={account} onCollect={onCollect} />
      <AccountConcessions account={account} />
      <LedgerAccessCard onOpen={onOpenLedger} />
    </div>
  )
}

/** Secondary contextual action — opens the EXISTING detailed Fee Ledger
 *  (Date · Description · Type · Charge · Payment · Balance, billing-frequency
 *  aware) as a sub-view of the Account tab. A navigation affordance only:
 *  zero financial logic of its own. */
function LedgerAccessCard({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      aria-label="View the detailed fee ledger"
      className="group w-full flex items-center gap-2.5 rounded-lg border border-dashed border-border hover:border-emerald-500/40 bg-muted/20 hover:bg-muted/40 transition-colors px-3 py-2.5 text-left"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-600 transition-colors">
        <History className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-semibold">View Fee Ledger</span>
        <span className="block text-[10px] text-muted-foreground">every charge and payment — chronological, with running balance</span>
      </span>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
    </button>
  )
}

// ─── Optional Charges (per-student applicability controls) ──────────

function AccountOptionalCharges({ studentId }: { studentId: string }) {
  const setOptionalHeadApplicable = useFeeStore((s) => s.setOptionalHeadApplicable)
  const students = useStudentsStore((s) => s.students)
  // Derived per render from the live store — the parent re-derives the
  // account object on every fee-store change, so toggles reflect instantly.
  const choices = studentOptionalHeadChoices(studentId)
  const student = students.find((s) => s.id === studentId)
  if (choices.length === 0 && !student) return null

  const handleToggle = (headId: string, applicable: boolean, name: string) => {
    const result = setOptionalHeadApplicable(studentId, headId, applicable, 'Principal')
    if (result.success) {
      toast.success(applicable ? `${name} applied to this account` : `${name} removed from this account`, {
        description: 'Future charges only — recorded payments and issued receipts are unchanged.',
      })
    } else if (result.error) {
      toast.error(result.error)
    }
  }

  return (
    <FeePanel title="Optional Charges" subtitle="applied per student — never automatic">
      <div className="space-y-1">
        {choices.map((c) => (
          <div key={c.headId} className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2.5 py-1.5">
            <div className="min-w-0">
              <p className="text-[11px] font-medium truncate">{c.name}</p>
              <p className="text-[9px] text-muted-foreground">{formatINR(c.amount, true)} · {c.frequency} · optional</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn('text-[9px] font-semibold', c.applicable ? 'text-emerald-600' : 'text-muted-foreground')}>
                {c.applicable ? 'Applied' : 'Not applied'}
              </span>
              <Switch
                checked={c.applicable}
                onCheckedChange={(v) => handleToggle(c.headId, v, c.name)}
                aria-label={`${c.applicable ? 'Remove' : 'Apply'} ${c.name} for this student`}
              />
            </div>
          </div>
        ))}
        {/* Transport is NOT an opt-in head — it follows bus enrolment. */}
        {student && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border/60 px-2.5 py-1.5 bg-muted/20">
            <div className="min-w-0 flex items-center gap-2">
              <Bus className="h-3 w-3 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium truncate">Transport</p>
                <p className="text-[9px] text-muted-foreground">follows bus service enrolment — not a per-head opt-in</p>
              </div>
            </div>
            <span className={cn('text-[9px] font-semibold shrink-0', student.transport ? 'text-emerald-600' : 'text-muted-foreground')}>
              {student.transport ? 'Enrolled' : 'Not enrolled'}
            </span>
          </div>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground border-t border-border/60 pt-2 mt-2">
        Applying an optional head adds its charge to this account's future dues and ledger. Recorded payments and issued receipts are never rewritten.
      </p>
    </FeePanel>
  )
}

function AccountLedger({ ledger }: { ledger: LedgerEntry[] }) {
  // Human label for the ledger Type column — identifies the source/type of
  // each charge/payment so the complete financial story is readable at a glance.
  const typeLabel = (e: LedgerEntry): { label: string; className: string } => {
    switch (e.entryType) {
      case 'core': return { label: 'Core Fee', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' }
      case 'exam': return { label: 'Exam Fee', className: 'bg-orange-500/10 text-orange-700 dark:text-orange-300' }
      case 'additional': return { label: 'Additional Fee', className: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' }
      case 'payment': return { label: 'Payment', className: 'bg-muted text-muted-foreground' }
      case 'concession': return { label: 'Concession', className: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' }
      case 'late-fee': return { label: 'Late Fee', className: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' }
      default: return { label: e.payment > 0 ? 'Payment' : 'Fee', className: 'bg-muted text-muted-foreground' }
    }
  }
  return (
    <FeePanel title="Fee Ledger" subtitle="chronological charge + payment history" bodyClassName="p-0">
      <div className="overflow-x-auto max-h-[28rem]">
        <table className="w-full text-xs min-w-[32rem]">
          <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
            <tr>
              <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Date</th>
              <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Description</th>
              <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Type</th>
              <th className="text-right px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Charge</th>
              <th className="text-right px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Payment</th>
              <th className="text-right px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Balance</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((e) => {
              const t = typeLabel(e)
              return (
                <tr key={e.id} className="border-t border-border/40 hover:bg-muted/30">
                  <td className="px-3 py-2.5 text-muted-foreground text-[10px] whitespace-nowrap">{formatDate(e.date)}</td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-[11px]">{e.feeHead}</p>
                    <p className="text-[9px] text-muted-foreground">{e.description}</p>
                    {e.receiptNo && <p className="text-[9px] text-muted-foreground font-mono">{e.receiptNo}</p>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={cn('inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap', t.className)}>
                      {t.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-rose-600">
                    {e.charge > 0 ? formatINR(e.charge) : e.charge < 0 ? formatINR(e.charge) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-emerald-600">
                    {e.payment > 0 ? formatINR(e.payment) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{formatINR(e.balance, true)}</td>
                </tr>
              )
            })}
            {ledger.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No ledger entries.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </FeePanel>
  )
}

function AccountPayments({ account, onViewReceipt }: { account: StudentFeeAccount; onViewReceipt: (id: string) => void }) {
  return (
    <FeePanel title="Payment History" subtitle={`${account.transactions.length} recorded payments`} bodyClassName="p-0">
      <div className="overflow-x-auto max-h-[28rem]">
        <table className="w-full text-xs min-w-[32rem]">
          <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
            <tr>
              <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Receipt</th>
              <th className="text-right px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Amount</th>
              <th className="text-center px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Mode</th>
              <th className="text-center px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Status</th>
              <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Date</th>
              <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Collected By</th>
              <th className="text-right px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground"><span className="sr-only">Receipt document</span>A5</th>
            </tr>
          </thead>
          <tbody>
            {account.transactions.map((t) => (
              <tr key={t.id} className="border-t border-border/40 hover:bg-muted/30">
                <td className="px-3 py-2.5 font-mono text-[10px]">{t.receiptNo}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-emerald-600">{formatINR(t.amount)}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ring-1', modeAccent(t.mode))}>
                    <ModeIcon mode={t.mode} className="h-2.5 w-2.5" />
                    {t.mode}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center"><FeeStatusBadge status={t.status} /></td>
                <td className="px-3 py-2.5 text-muted-foreground text-[10px]">{formatDate(t.date)}</td>
                <td className="px-3 py-2.5 text-muted-foreground text-[10px]">{t.collectedBy}</td>
                {/* Receipt belongs to the payment record — each row carries
                    its existing A5 dual-copy receipt action (canonical engine,
                    opened via the drawer-level preview modal). */}
                <td className="px-3 py-2.5 text-right">
                  <Button
                    size="sm" variant="ghost"
                    className="h-6 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => onViewReceipt(t.id)}
                    aria-label={`View A5 receipt ${t.receiptNo}`}
                  >
                    <FileText className="h-3 w-3" /> View
                  </Button>
                </td>
              </tr>
            ))}
            {account.transactions.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">
                No payments recorded yet. Payments recorded through Collect appear here with their receipts.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground border-t border-border/40 px-3 py-2">
        Receipts are generated from recorded payments — open any row's receipt to view or print the A5 dual copy.
      </p>
    </FeePanel>
  )
}

function AccountConcessions({ account }: { account: StudentFeeAccount }) {
  // PART 11 — concessions are AUDITABLE RECORDS (type · %/amount ·
  // effective period · approval status · approver · reason), not a bare
  // scalar. Approved + effective records are exactly what computeAccount
  // subtracts from the applicable amount — the tab can never disagree
  // with the account's Concession tile.
  const concessions = useFeeStore((s) => s.concessions)
  const concessionRule = useFeeStore((s) => s.concessionRule)
  const requestConcession = useFeeStore((s) => s.requestConcession)
  const approveConcession = useFeeStore((s) => s.approveConcession)
  const rejectConcession = useFeeStore((s) => s.rejectConcession)
  const [grantOpen, setGrantOpen] = useState(false)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const records = useMemo(
    () => concessions.filter((c) => c.studentId === account.studentId),
    [concessions, account.studentId],
  )

  const statusPill = (status: string) => {
    if (status === 'Approved') return <FeePill accent={statusAccent('Paid')}>Approved</FeePill>
    if (status === 'Pending') return <FeePill accent="bg-amber-500/10 text-amber-700 dark:text-amber-300">Pending approval</FeePill>
    return <FeePill accent="bg-rose-500/10 text-rose-700 dark:text-rose-300">Rejected</FeePill>
  }

  return (
    <FeePanel
      title="Concessions"
      subtitle="approved concessions reduce the applicable amount — auditable, never rewriting past payments"
      action={(
        <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => setGrantOpen((v) => !v)}>
          <Plus className="h-3 w-3" /> Grant Concession
        </Button>
      )}
    >
      {/* Grant form — pre-fills the school's configured percentages so the
          Concession Rules settings have a real effect. When the rule does
          not require approval, the record is granted directly. */}
      {grantOpen && (
        <GrantConcessionForm
          rule={concessionRule}
          onSubmit={(input) => {
            const result = requestConcession({ ...input, studentId: account.studentId, actor: 'Principal' })
            if (result.success) {
              toast.success(
                concessionRule.requiresApproval ? 'Concession requested — awaiting approval' : 'Concession granted',
                { description: `${input.type} · ${input.basis === 'percent' ? `${input.value}%` : formatINR(input.value, true)}` },
              )
              setGrantOpen(false)
            } else if (result.error) {
              toast.error(result.error)
            }
          }}
          onCancel={() => setGrantOpen(false)}
        />
      )}

      <div className="space-y-2">
        {records.map((c) => (
          <div key={c.id} className={cn(
            'rounded-lg border p-2.5',
            c.status === 'Approved' ? 'bg-emerald-500/5 border-emerald-500/20'
              : c.status === 'Pending' ? 'bg-amber-500/5 border-amber-500/20'
                : 'bg-rose-500/5 border-rose-500/20',
          )}>
            <div className="flex items-center justify-between mb-1 gap-2">
              <p className="text-xs font-semibold truncate">{c.type}</p>
              {statusPill(c.status)}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                {c.basis === 'percent' ? `${c.value}% of applicable` : `${formatINR(c.value, true)} per session`} · from {c.effectiveFrom}{c.effectiveTo ? ` to ${c.effectiveTo}` : ''}
              </span>
              <span className={cn('font-bold tabular-nums', c.status === 'Approved' ? 'text-emerald-600' : 'text-muted-foreground')}>
                {c.basis === 'percent' ? `−${c.value}%` : `−${formatINR(c.value, true)}`}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{c.reason}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">
              Requested by {c.requestedBy} · {formatDate(c.requestedAt)}
              {c.approvedBy ? ` · Approved by ${c.approvedBy} · ${formatDate(c.approvedAt!)}` : ''}
              {c.rejectedReason ? ` · Rejected: ${c.rejectedReason}` : ''}
            </p>
            {c.status === 'Pending' && (
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/40">
                <Button
                  size="sm" className="h-6 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    const r = approveConcession(c.id, 'Principal')
                    if (r.success) toast.success('Concession approved', { description: 'Reduces the applicable amount from its effective date — past payments untouched.' })
                  }}
                >
                  <Check className="h-3 w-3" /> Approve
                </Button>
                {rejectingId === c.id ? (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Input
                      autoFocus value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection…" className="h-6 text-[10px]"
                    />
                    <Button
                      size="sm" variant="outline" className="h-6 text-[10px] gap-1 shrink-0"
                      onClick={() => {
                        const r = rejectConcession(c.id, 'Principal', rejectReason.trim() || 'No reason recorded')
                        if (r.success) { toast.success('Concession rejected'); setRejectingId(null); setRejectReason('') }
                      }}
                    >
                      Confirm
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] shrink-0" onClick={() => { setRejectingId(null); setRejectReason('') }}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={() => { setRejectingId(c.id); setRejectReason('') }}>
                    <Ban className="h-3 w-3" /> Reject
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}

        {records.length === 0 && !grantOpen && (
          <FeeEmptyState icon={<IndianRupee className="h-5 w-5" />} title="No concessions" description="Granted concessions appear here with their full approval trail." />
        )}

        {records.length > 0 && (
          <p className="text-[10px] text-muted-foreground">
            Concessions never change past payments. Original amounts remain on record; the concession reduces the applicable amount from its effective date.
          </p>
        )}
      </div>
    </FeePanel>
  )
}

// ─── Grant Concession form (compact, pre-filled from school rules) ──

const CONCESSION_TYPES: ConcessionType[] = ['Sibling Discount', 'Staff Ward', 'Scholarship', 'Other']

function GrantConcessionForm({
  rule, onSubmit, onCancel,
}: {
  rule: { siblingDiscountPct: number; staffWardDiscountPct: number; scholarshipDiscountPct: number; requiresApproval: boolean }
  onSubmit: (input: { type: ConcessionType; basis: 'percent' | 'amount'; value: number; reason: string; effectiveFrom: string }) => void
  onCancel: () => void
}) {
  const [type, setType] = useState<ConcessionType>('Sibling Discount')
  const [basis, setBasis] = useState<'percent' | 'amount'>('percent')
  const [value, setValue] = useState<number>(rule.siblingDiscountPct)
  const [reason, setReason] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0])

  // The school's configured percentage pre-fills by type — the Concession
  // Rules settings drive real defaults, not display-only numbers.
  const pickType = (t: ConcessionType) => {
    setType(t)
    if (basis === 'percent') {
      setValue(t === 'Sibling Discount' ? rule.siblingDiscountPct : t === 'Staff Ward' ? rule.staffWardDiscountPct : t === 'Scholarship' ? rule.scholarshipDiscountPct : value || 10)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-2 mb-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        New concession {rule.requiresApproval ? '· will require approval' : '· granted immediately (school policy)'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px]">Type</Label>
          <select value={type} onChange={(e) => pickType(e.target.value as ConcessionType)} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs">
            {CONCESSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Basis</Label>
          <div className="flex gap-1">
            {(['percent', 'amount'] as const).map((b) => (
              <button
                key={b} type="button" aria-pressed={basis === b}
                onClick={() => setBasis(b)}
                className={cn(
                  'flex-1 h-8 rounded-md border text-[10px] font-medium transition-colors',
                  basis === b ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/40',
                )}
              >
                {b === 'percent' ? '% of applicable' : 'Flat ₹'}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">{basis === 'percent' ? 'Percent (%)' : 'Amount (₹)'}</Label>
          <Input type="number" min={0} value={value} onChange={(e) => setValue(Number(e.target.value))} className="h-8 text-xs tabular-nums" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Effective from</Label>
          <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className="h-8 text-xs" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px]">Reason (required)</Label>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Elder sibling also enrolled in Class 8" className="h-8 text-xs" />
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm" className="h-7 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => onSubmit({ type, basis, value, reason, effectiveFrom })}
        >
          <Check className="h-3 w-3" /> {rule.requiresApproval ? 'Submit for approval' : 'Grant'}
        </Button>
      </div>
    </div>
  )
}

function AccountDues({ account, onCollect }: { account: StudentFeeAccount; onCollect: () => void }) {
  return (
    <FeePanel title="Dues & Outstanding" subtitle="core fees and additional charges, separately">
      <div className="space-y-3">
        {/* Core */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-1.5">Core School Fees</p>
          <div className="grid grid-cols-3 gap-2">
            <FeeStat label="Outstanding" value={formatINR(account.outstanding, true)} accent="rose" />
            <FeeStat label="Late Fee" value={account.lateFee > 0 ? formatINR(account.lateFee, true) : '—'} accent="amber" />
            <FeeStat label="Total Due" value={formatINR(account.totalDue, true)} />
          </div>
          {account.daysOverdue > 0 && account.outstanding > 0 && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 flex items-start gap-2 mt-2">
              <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-700 dark:text-rose-300">This account is <strong>{account.daysOverdue} days overdue</strong>. Late fee of {formatINR(account.lateFee, true)} applied.</p>
            </div>
          )}
        </div>
        {/* Additional */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-1.5">Additional Charges</p>
          {account.additional.charges.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No additional charges apply to this student.</p>
          ) : (
            <div className="space-y-1.5">
              {account.additional.charges.map((c) => (
                <div key={c.chargeId} className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2.5 py-1.5">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium truncate">{c.name}</p>
                    <p className="text-[9px] text-muted-foreground">{c.category} · due {c.dueDate}{c.mandatory ? '' : ' · optional'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-bold tabular-nums">{formatINR(c.amount, true)}</p>
                    <p className={cn('text-[9px] tabular-nums', c.outstanding === 0 ? 'text-emerald-600 font-semibold' : 'text-amber-600')}>
                      {c.outstanding === 0 ? 'Paid' : `${formatINR(c.outstanding, true)} due`}
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between text-[11px] px-2.5 pt-1 border-t border-border/40">
                <span className="text-muted-foreground">Additional outstanding (never mixed with core)</span>
                <span className="font-bold tabular-nums text-violet-700 dark:text-violet-300">{formatINR(account.additional.outstanding, true)}</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <p className="text-[10px] text-muted-foreground">Last payment: {account.lastPaymentDate ? formatDate(account.lastPaymentDate) : 'No payments yet'}</p>
          {(account.outstanding > 0 || account.additional.outstanding > 0) && (
            <Button size="sm" className="h-7 text-[10px] gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white" onClick={onCollect}>
              <Wallet className="h-3 w-3" /> Collect Now
            </Button>
          )}
        </div>
      </div>
    </FeePanel>
  )
}

function AccountAudit({ account }: { account: StudentFeeAccount }) {
  const allAudit = useFeeStore((s) => s.audit)
  const concessions = useFeeStore((s) => s.concessions)
  // Traceable events for THIS account (PART 22): entries addressed to the
  // student (payments, applicability changes) + concession lifecycle
  // events (requested/approved/rejected — their entityId is the concession
  // record id) + events on this account's transactions.
  const audit = useMemo(() => {
    const myConcessionIds = new Set(concessions.filter((c) => c.studentId === account.studentId).map((c) => c.id))
    return allAudit.filter((a) =>
      a.entityId === account.studentId
      || myConcessionIds.has(a.entityId)
      || account.transactions.some((t) => t.id === a.entityId)
    )
  }, [allAudit, concessions, account.studentId, account.transactions])
  return (
    <FeePanel title="Activity History" subtitle="account-level financial activity — payments, receipts, concessions, applicability">
      <div className="space-y-2">
        {audit.length > 0 ? audit.map((a) => (
          <div key={a.id} className="flex items-start gap-2 rounded-md border border-border/40 px-2 py-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/10 text-sky-600 shrink-0">
              <ShieldCheck className="h-3 w-3" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium">{a.description}</p>
              <p className="text-[9px] text-muted-foreground">{formatDate(a.timestamp)} · by {a.actor}</p>
            </div>
          </div>
        )) : (
          <FeeEmptyState icon={<ShieldCheck className="h-5 w-5" />} title="No activity yet" description="Past actions will appear here." />
        )}
      </div>
    </FeePanel>
  )
}
