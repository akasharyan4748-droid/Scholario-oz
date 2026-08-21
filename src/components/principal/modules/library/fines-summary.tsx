'use client'

/**
 * fines-summary — Fines management + Reports.
 *
 * Fines Section:
 *   - Compact summary strip (Outstanding / Collected / Avg days overdue / Pending count)
 *   - Filterable fines table (All / Pending / Paid / Waived)
 *   - Pay + Waive actions per row (store mutations)
 *
 * Reports Section:
 *   - Most Issued Books (top 5) — horizontal bars
 *   - Category Distribution — horizontal bars (book copies by category)
 *   - Issued vs Available overview row
 *
 * State from library-store + useLibraryData. No fake numbers.
 */

import { motion } from 'framer-motion'
import {
  IndianRupee, Clock, CheckCircle2, Ban, Download, BarChart3,
  TrendingUp, BookOpen, BookCopy, FileBarChart2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { useLibraryStore, useLibraryData } from '@/lib/store/library-store'
import type { FineStatus } from '@/lib/store/library-store'
import { formatINR, formatDate, initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import { GradientAvatar } from '@/components/shared/ui'
import { toast } from 'sonner'
import { LibPanel, LibEmptyState, FineStatusBadge, BorrowerTypePill, LibPill } from './library-shared'
import { useState } from 'react'

// ─── FinesSummary ───────────────────────────────────────────────────

export function FinesSummary() {
  const issues = useLibraryStore((s) => s.issues)
  const payFine = useLibraryStore((s) => s.payFine)
  const waiveFine = useLibraryStore((s) => s.waiveFine)
  const data = useLibraryData()
  const [filter, setFilter] = useState<'all' | FineStatus>('all')

  // Only issues with a fine > 0 OR fineStatus !== 'Pending' (so paid/waived historical fines show)
  const finesRows = issues.filter((i) => i.fine > 0 || i.fineStatus !== 'Pending')
  const filtered = finesRows.filter((i) => filter === 'all' ? true : i.fineStatus === filter)

  const outstanding = data.analytics.totalFines
  const collected = data.analytics.collectedFines
  const waived = issues.filter((i) => i.fineStatus === 'Waived').reduce((s, i) => s + i.fine, 0)
  const pendingCount = finesRows.filter((i) => i.fineStatus === 'Pending').length

  const handlePay = (issueId: string) => {
    const row = issues.find((i) => i.id === issueId)
    payFine(issueId)
    toast.success('Fine paid', {
      description: row ? `${formatINR(row.fine)} collected from ${row.borrowerName}` : undefined,
    })
  }

  const handleWaive = (issueId: string) => {
    const row = issues.find((i) => i.id === issueId)
    waiveFine(issueId)
    toast.success('Fine waived', {
      description: row ? `${row.borrowerName}'s fine of ${formatINR(row.fine)} has been waived` : undefined,
    })
  }

  const handleDownloadReport = () => {
    toast.success('Fines report generated', {
      description: `${pendingCount} pending · ${formatINR(outstanding)} outstanding · ${formatINR(collected)} collected`,
    })
  }

  return (
    <div className="space-y-3">
      {/* Summary strip — soft tinted mini-cards (FeeStat-style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <FineStatCard
          icon={<IndianRupee className="h-4 w-4" />}
          label="Outstanding Fines"
          value={formatINR(outstanding, true)}
          sub={`${pendingCount} pending fines`}
          accent="rose"
        />
        <FineStatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Collected"
          value={formatINR(collected, true)}
          sub="From paid fines"
          accent="emerald"
        />
        <FineStatCard
          icon={<Ban className="h-4 w-4" />}
          label="Waived"
          value={formatINR(waived, true)}
          sub="Forgiven fines"
          accent="muted"
        />
        <FineStatCard
          icon={<Clock className="h-4 w-4" />}
          label="Pending Count"
          value={String(pendingCount)}
          sub="Awaiting collection"
          accent="amber"
        />
      </div>

      {/* Fines table */}
      <LibPanel
        title="Fines Ledger"
        subtitle={`${filtered.length} fine records`}
        action={
          <div className="flex items-center gap-1.5">
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fines</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Waived">Waived</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={handleDownloadReport}
            >
              <Download className="h-3.5 w-3.5" /> Report
            </Button>
          </div>
        }
        bodyClassName="p-0"
      >
        {filtered.length === 0 ? (
          <LibEmptyState
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="No fines to display"
            description="Fines will appear here once books are overdue."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-semibold text-[10px] uppercase tracking-wider">Borrower & Book</TableHead>
                  <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden lg:table-cell">Type</TableHead>
                  <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden md:table-cell">Issue Date</TableHead>
                  <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden md:table-cell">Return Date</TableHead>
                  <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-right">Fine</TableHead>
                  <TableHead className="font-semibold text-[10px] uppercase tracking-wider">Status</TableHead>
                  <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-accent/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <GradientAvatar name={r.borrowerName} initials={initials(r.borrowerName)} size="sm" />
                        <div className="min-w-0 max-w-[260px]">
                          <p className="font-medium text-sm truncate">{r.borrowerName}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {r.bookTitle}
                            {r.admissionNo && <span className="font-mono"> · {r.admissionNo}</span>}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell"><BorrowerTypePill type={r.borrowerType} /></TableCell>
                    <TableCell className="hidden md:table-cell text-xs">{formatDate(r.issueDate)}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs">
                      {r.returnDate ? formatDate(r.returnDate) : <span className="text-muted-foreground/60">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        'font-bold tabular-nums',
                        r.fineStatus === 'Waived' ? 'text-muted-foreground line-through' : 'text-rose-600',
                      )}>{formatINR(r.fine)}</span>
                    </TableCell>
                    <TableCell><FineStatusBadge status={r.fineStatus} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.fineStatus === 'Pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-[10px] h-7 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => handlePay(r.id)}
                            >
                              <IndianRupee className="h-3 w-3" /> Pay
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-[10px] h-7"
                              onClick={() => handleWaive(r.id)}
                            >
                              <Ban className="h-3 w-3" /> Waive
                            </Button>
                          </>
                        )}
                        {r.fineStatus !== 'Pending' && (
                          <span className="text-[10px] text-muted-foreground/70">Resolved</span>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </LibPanel>
    </div>
  )
}

// ─── Reports ────────────────────────────────────────────────────────

export function LibraryReports() {
  const data = useLibraryData()
  const analytics = data.analytics

  const maxIssued = Math.max(1, ...analytics.mostIssued.map((b) => b.issued))
  const maxCategory = Math.max(1, ...analytics.byCategory.map((c) => c.value))
  const totalBooksForBars = analytics.byCategory.reduce((s, c) => s + c.value, 0)

  const issuedRatio = analytics.totalBooks > 0
    ? Math.round((analytics.totalIssued / analytics.totalBooks) * 100)
    : 0

  return (
    <div className="space-y-3">
      {/* Top row: Most Issued + Issued/Available split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Most Issued Books */}
        <LibPanel
          title="Most Issued Books"
          subtitle="top 5 by issue count"
          action={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
        >
          <div className="space-y-2">
            {analytics.mostIssued.map((b, i) => {
              const pct = Math.round((b.issued / maxIssued) * 100)
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-2.5"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/40 text-[10px] font-bold text-muted-foreground tabular-nums">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[11px] font-medium truncate">{b.title}</p>
                      <span className="text-[10px] font-bold tabular-nums text-amber-600 shrink-0">{b.issued}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
            {analytics.mostIssued.length === 0 && (
              <LibEmptyState icon={<TrendingUp className="h-5 w-5" />} title="No issues yet" description="Issued books will rank here." />
            )}
          </div>
        </LibPanel>

        {/* Issued vs Available overview */}
        <LibPanel
          title="Inventory Snapshot"
          subtitle="issued vs available copies"
          action={<FileBarChart2 className="h-4 w-4 text-muted-foreground" />}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border border-amber-500/20 p-3">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Issued</p>
                </div>
                <p className="font-display text-xl font-bold tabular-nums mt-1 text-amber-600">{analytics.totalIssued}</p>
                <p className="text-[10px] text-muted-foreground">{issuedRatio}% of inventory</p>
              </div>
              <div className="rounded-lg bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border border-emerald-500/20 p-3">
                <div className="flex items-center gap-1.5">
                  <BookCopy className="h-3.5 w-3.5 text-emerald-600" />
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Available</p>
                </div>
                <p className="font-display text-xl font-bold tabular-nums mt-1 text-emerald-600">{analytics.totalAvailable}</p>
                <p className="text-[10px] text-muted-foreground">{100 - issuedRatio}% of inventory</p>
              </div>
            </div>

            {/* Issued vs Available bar */}
            <div>
              <div className="h-3 rounded-full overflow-hidden bg-muted/40 flex">
                <div
                  className="h-full bg-amber-500/80 transition-all"
                  style={{ width: `${issuedRatio}%` }}
                />
                <div
                  className="h-full bg-emerald-500/80 transition-all"
                  style={{ width: `${100 - issuedRatio}%` }}
                />
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Issued
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Available
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/40">
              <Stat label="Total Books" value={analytics.totalBooks} />
              <Stat label="Overdue" value={analytics.overdueCount} accent="rose" />
            </div>
          </div>
        </LibPanel>
      </div>

      {/* Category Distribution — full-width horizontal bars */}
      <LibPanel
        title="Category Distribution"
        subtitle="book copies by category"
        action={<LibPill accent="bg-muted text-muted-foreground">{totalBooksForBars} copies total</LibPill>}
      >
        <div className="space-y-2.5">
          {analytics.byCategory.map((c, i) => {
            const pct = Math.round((c.value / maxCategory) * 100)
            return (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-24 shrink-0">
                  <p className="text-[11px] font-medium truncate">{c.name}</p>
                </div>
                <div className="flex-1">
                  <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: c.color }}
                    />
                  </div>
                </div>
                <div className="w-12 shrink-0 text-right">
                  <span className="text-[11px] font-bold tabular-nums">{c.value}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </LibPanel>
    </div>
  )
}

// ─── Local helpers (kept in this file to avoid noise in shared) ─────

interface FineStatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  accent: 'emerald' | 'rose' | 'amber' | 'muted'
}

function FineStatCard({ icon, label, value, sub, accent }: FineStatCardProps) {
  const accentMap = {
    emerald: { bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-500/20', card: 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border-emerald-500/20' },
    rose: { bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300', ring: 'ring-rose-500/20', card: 'bg-rose-500/[0.04] dark:bg-rose-500/[0.06] border-rose-500/20' },
    amber: { bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', ring: 'ring-amber-500/20', card: 'bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border-amber-500/20' },
    muted: { bg: 'bg-muted text-muted-foreground', ring: 'ring-border', card: 'bg-muted/20 border-border' },
  }
  const a = accentMap[accent]
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('rounded-xl border p-3.5', a.card)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider truncate">{label}</p>
          <p className="font-display text-lg font-bold tabular-nums mt-1 leading-none">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-1 truncate">{sub}</p>}
        </div>
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1', a.bg, a.ring)}>
          {icon}
        </span>
      </div>
    </motion.div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: 'rose' }) {
  const accentMap = {
    rose: 'text-rose-600',
    default: 'text-foreground',
  }
  return (
    <div className="rounded-lg bg-muted/30 px-2.5 py-1.5">
      <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">{label}</p>
      <p className={cn('text-sm font-bold tabular-nums mt-0.5', accent === 'rose' ? accentMap.rose : accentMap.default)}>{value}</p>
    </div>
  )
}
