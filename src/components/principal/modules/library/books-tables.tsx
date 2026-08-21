'use client'

/**
 * books-tables — Book catalogue + Issued/Overdue tables.
 *
 * Catalogue: search (title/author/ISBN) + filter (category, availability),
 *   book tile, ISBN, category, copies/available/issued counts, status.
 *
 * IssuedBooksTable: shows currently issued (status !== Returned) with
 *   Return action. Doubles as Overdue table when filter='overdue'.
 *
 * State from library-store (no mock data here).
 */

import { motion } from 'framer-motion'
import { BookMarked, Search, RotateCcw, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { useLibraryStore } from '@/lib/store/library-store'
import type { Book, IssueRecord, BookCategory, BookStatus } from '@/lib/store/library-store'
import { formatDate, formatINR, initials } from '@/lib/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { GradientAvatar } from '@/components/shared/ui'
import { LibPanel, LibEmptyState, BookStatusBadge, IssueStatusBadge, BorrowerTypePill } from './library-shared'

const CATEGORIES: Array<BookCategory | 'all'> = ['all', 'Fiction', 'Reference', 'Textbooks', 'Story Books', 'Biography', 'Magazines', 'Science']
const AVAILABILITY: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Availability' },
  { value: 'available', label: 'Available' },
  { value: 'low', label: 'Low Stock' },
  { value: 'out', label: 'Out of Stock' },
]

// ─── BooksCatalogue ─────────────────────────────────────────────────

export function BooksCatalogue({ onIssueBook }: { onIssueBook: (book: Book) => void }) {
  const books = useLibraryStore((s) => s.books)
  const search = useLibraryStore((s) => s.search)
  const categoryFilter = useLibraryStore((s) => s.categoryFilter)
  const availabilityFilter = useLibraryStore((s) => s.availabilityFilter)
  const setSearch = useLibraryStore((s) => s.setSearch)
  const setCategoryFilter = useLibraryStore((s) => s.setCategoryFilter)
  const setAvailabilityFilter = useLibraryStore((s) => s.setAvailabilityFilter)

  const filtered = books.filter((b) => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q
      || b.title.toLowerCase().includes(q)
      || b.author.toLowerCase().includes(q)
      || b.isbn.toLowerCase().includes(q)
    const matchCat = categoryFilter === 'all' || b.category === categoryFilter
    const matchAvail = availabilityFilter === 'all'
      || (availabilityFilter === 'available' && b.status === 'Available')
      || (availabilityFilter === 'low' && b.status === 'Low Stock')
      || (availabilityFilter === 'out' && b.status === 'Out of Stock')
    return matchSearch && matchCat && matchAvail
  })

  return (
    <LibPanel
      title="Book Catalogue"
      subtitle={`${filtered.length} of ${books.length} books`}
      action={
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, author, ISBN"
              className="pl-8 h-8 w-40 sm:w-56 text-xs"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c === 'all' ? 'All Categories' : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="w-32 h-8 text-xs hidden sm:flex"><SelectValue /></SelectTrigger>
            <SelectContent>
              {AVAILABILITY.map((a) => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
      bodyClassName="p-0"
    >
      {filtered.length === 0 ? (
        <LibEmptyState
          icon={<BookMarked className="h-5 w-5" />}
          title="No books found"
          description="Try adjusting your search or filter."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider">Book</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden md:table-cell">ISBN</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden sm:table-cell">Category</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-center">Copies</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-center">Avail.</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-center">Issued</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b, i) => (
                <motion.tr
                  key={b.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-accent/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <BookMarked className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 max-w-[260px]">
                        <p className="font-medium text-sm truncate">{b.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{b.author}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-[11px] text-muted-foreground">{b.isbn}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="text-[10px] font-medium">{b.category}</Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium tabular-nums">{b.copies}</TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      'font-semibold tabular-nums',
                      b.available === 0 ? 'text-rose-600' : b.available <= 3 ? 'text-amber-600' : 'text-emerald-600',
                    )}>{b.available}</span>
                  </TableCell>
                  <TableCell className="text-center"><span className="font-semibold text-amber-600 tabular-nums">{b.issued}</span></TableCell>
                  <TableCell><BookStatusBadge status={b.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={b.available <= 0}
                      onClick={() => onIssueBook(b)}
                      className="gap-1.5 text-[11px] h-7"
                    >
                      Issue
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </LibPanel>
  )
}

// ─── IssuedBooksTable (also handles 'overdue' filter) ───────────────

interface IssuedBooksTableProps {
  filter: 'all' | 'overdue'
  onReturn: (issueId: string) => void
  onSendReminder?: (issue: IssueRecord) => void
}

export function IssuedBooksTable({ filter, onReturn, onSendReminder }: IssuedBooksTableProps) {
  const issues = useLibraryStore((s) => s.issues)

  const rows = issues
    .filter((i) => i.status !== 'Returned')
    .filter((i) => filter === 'all' ? true : i.status === 'Overdue')

  const overdueCount = issues.filter((i) => i.status === 'Overdue').length

  const title = filter === 'overdue' ? 'Overdue Books' : 'Issued Books'
  const subtitle = filter === 'overdue'
    ? `${rows.length} overdue · ${overdueCount} total`
    : `${rows.length} currently issued · ${overdueCount} overdue`

  return (
    <LibPanel
      title={title}
      subtitle={subtitle}
      bodyClassName="p-0"
    >
      {rows.length === 0 ? (
        <LibEmptyState
          icon={<BookMarked className="h-5 w-5" />}
          title={filter === 'overdue' ? 'No overdue books' : 'No books currently issued'}
          description={filter === 'overdue' ? 'All issued books are within their due dates.' : 'Issue a book from the catalogue to see it here.'}
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider">Borrower & Book</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden lg:table-cell">Type</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden md:table-cell">Issue Date</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden md:table-cell">Due Date</TableHead>
                {filter === 'overdue' && (
                  <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-center">Days Overdue</TableHead>
                )}
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-right">Fine</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => {
                const daysOverdue = filter === 'overdue'
                  ? Math.max(0, Math.ceil((Date.now() - new Date(r.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
                  : 0
                return (
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
                        <div className="min-w-0 max-w-[280px]">
                          <p className="font-medium text-sm truncate">{r.bookTitle}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {r.borrowerName}
                            {r.admissionNo && <span className="font-mono"> · {r.admissionNo}</span>}
                            {r.class && <span> · {r.class}</span>}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell"><BorrowerTypePill type={r.borrowerType} /></TableCell>
                    <TableCell className="hidden md:table-cell text-xs">{formatDate(r.issueDate)}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs">
                      <span className={cn(r.status === 'Overdue' && 'text-rose-600 font-semibold')}>
                        {formatDate(r.dueDate)}
                      </span>
                    </TableCell>
                    {filter === 'overdue' && (
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center min-w-7 h-6 px-1.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-bold tabular-nums">
                          {daysOverdue}d
                        </span>
                      </TableCell>
                    )}
                    <TableCell><IssueStatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right">
                      {r.fine > 0 ? (
                        <span className="font-semibold text-rose-600 text-sm tabular-nums">{formatINR(r.fine)}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {filter === 'overdue' && onSendReminder && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-[10px] h-7"
                            onClick={() => onSendReminder(r)}
                          >
                            <Send className="h-3 w-3" /> Remind
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-[10px] h-7"
                          onClick={() => onReturn(r.id)}
                        >
                          <RotateCcw className="h-3 w-3" /> Return
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </LibPanel>
  )
}

// helper exported for callers
export function statusAccent(status: BookStatus): string {
  if (status === 'Available') return 'text-emerald-600'
  if (status === 'Low Stock') return 'text-amber-600'
  return 'text-rose-600'
}
