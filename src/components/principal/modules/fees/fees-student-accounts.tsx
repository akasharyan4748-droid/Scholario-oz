'use client'

/**
 * FeesStudentAccountsSection — Principal's student fee account search + workspace.
 *
 * Phase 1: SearchFilterBar-style filter toolbar — free-text search (name /
 *   ID / admission / roll / class / section) composed with Class and Status
 *   selects feeding the visible grid below.
 * Phase 2: When a student is selected → opens a full student fee account
 *   workspace drawer with tabs:
 *   Overview · Fee Ledger · Payments · Receipts · Concessions · Dues · Audit
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, Wallet, IndianRupee, ChevronRight, ArrowLeft,
  Receipt, AlertCircle, FileText, History, ShieldCheck, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFeeData, useFeeStore, type StudentFeeAccount, type LedgerEntry } from '@/lib/store/fee-store'
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
  const [selected, setSelected] = useState<StudentFeeAccount | null>(null)

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
      setSelected(match)
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
            onClick={() => setSelected(a)}
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
            onClose={() => setSelected(null)}
            onCollect={() => onCollect(selected.studentId)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Student Fee Account Drawer ──────────────────────────────────────

type AccountTab = 'overview' | 'ledger' | 'payments' | 'receipts' | 'concessions' | 'dues' | 'audit'

function StudentFeeAccountDrawer({ account, onClose, onCollect }: { account: StudentFeeAccount; onClose: () => void; onCollect: () => void }) {
  const [tab, setTab] = useState<AccountTab>('overview')
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null)
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

        {/* Tabs */}
        <div className="shrink-0 border-b border-border bg-muted/20 px-3 py-1.5 flex items-center gap-0.5 overflow-x-auto">
          {[
            { value: 'overview' as const, label: 'Overview', icon: <User className="h-3 w-3" /> },
            { value: 'ledger' as const, label: 'Fee Ledger', icon: <History className="h-3 w-3" /> },
            { value: 'payments' as const, label: 'Payments', icon: <Wallet className="h-3 w-3" /> },
            { value: 'receipts' as const, label: 'Receipts', icon: <Receipt className="h-3 w-3" /> },
            { value: 'concessions' as const, label: 'Concessions', icon: <IndianRupee className="h-3 w-3" /> },
            { value: 'dues' as const, label: 'Dues', icon: <AlertCircle className="h-3 w-3" /> },
            { value: 'audit' as const, label: 'History', icon: <ShieldCheck className="h-3 w-3" /> },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
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
          {tab === 'overview' && <AccountOverview account={account} />}
          {tab === 'ledger' && <AccountLedger ledger={account.ledger} />}
          {tab === 'payments' && <AccountPayments account={account} />}
          {tab === 'receipts' && <AccountReceipts account={account} onView={(id) => { setSelectedReceiptId(id); setTab('receipts') }} />}
          {tab === 'concessions' && <AccountConcessions account={account} />}
          {tab === 'dues' && <AccountDues account={account} onCollect={onCollect} />}
          {tab === 'audit' && <AccountAudit account={account} />}
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

      <FeePanel title="Status Timeline" subtitle="recent financial events">
        <div className="space-y-2">
          {account.transactions.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-xs">
              <span className={cn('inline-flex items-center justify-center h-6 w-6 rounded-md ring-1', modeAccent(t.mode))}>
                <ModeIcon mode={t.mode} className="h-3 w-3" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{t.purpose}</p>
                <p className="text-[9px] text-muted-foreground">{formatDate(t.date)} · {t.receiptNo}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold tabular-nums text-emerald-600">{formatINR(t.amount, true)}</p>
                <FeeStatusBadge status={t.status} />
              </div>
            </div>
          ))}
          {account.transactions.length === 0 && (
            <FeeEmptyState
              icon={<Wallet className="h-5 w-5" />}
              title="No receipts recorded yet"
              description="Collections for this account are tracked at account level — transaction receipts appear here as payments are recorded."
            />
          )}
        </div>
      </FeePanel>
    </div>
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

function AccountPayments({ account }: { account: StudentFeeAccount }) {
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
              </tr>
            ))}
            {account.transactions.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No payments recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </FeePanel>
  )
}

function AccountReceipts({ account, onView }: { account: StudentFeeAccount; onView: (id: string) => void }) {
  return (
    <FeePanel title="Receipts" subtitle={`${account.transactions.length} receipts generated`}>
      <div className="space-y-1.5">
        {account.transactions.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-md border border-border/60 hover:border-primary/40 transition-colors px-2.5 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
              <Receipt className="h-3.5 w-3.5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono font-semibold">{t.receiptNo}</p>
              <p className="text-[9px] text-muted-foreground">{formatDate(t.date)} · {t.mode} · {formatINR(t.amount, true)}</p>
            </div>
            <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1" onClick={() => onView(t.id)}>
              <FileText className="h-3 w-3" /> View
            </Button>
          </div>
        ))}
        {account.transactions.length === 0 && (
          <FeeEmptyState icon={<Receipt className="h-5 w-5" />} title="No receipts generated" description="Receipts appear here after a payment is recorded." />
        )}
      </div>
    </FeePanel>
  )
}

function AccountConcessions({ account }: { account: StudentFeeAccount }) {
  return (
    <FeePanel title="Concessions" subtitle="approved fee concessions on this account">
      {account.concession > 0 ? (
        <div className="space-y-2">
          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold">Core Fee Concession</p>
              <FeePill accent={statusAccent('Paid')}>Approved</FeePill>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Original Fee: {formatINR(account.totalApplicable, true)}</span>
              <span className="font-bold text-emerald-600 tabular-nums">−{formatINR(account.concession, true)}</span>
            </div>
            {/* Approval metadata (approver, date) is not modelled in the data
                layer yet — a synthetic line used to hardcode
                "Approved By: Principal · Date: 2025-04-02" here; dropped
                rather than fabricate provenance. */}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Concession does not change past payments. Original amounts remain on record.
          </p>
        </div>
      ) : (
        <FeeEmptyState icon={<IndianRupee className="h-5 w-5" />} title="No concessions" description="Approved concessions will appear here." />
      )}
    </FeePanel>
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
  const audit = useMemo(() => allAudit.filter((a) =>
    a.entityId === account.studentId || account.transactions.some((t) => t.id === a.entityId)
  ), [allAudit, account.studentId, account.transactions])
  return (
    <FeePanel title="Activity History" subtitle="record of payment actions on this account">
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
