'use client'

import { motion } from 'framer-motion'
import { BookMarked, RotateCcw, Search } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { libraryBooks, issuedBooks } from '@/lib/mock/operations'
import { formatINR, formatDate } from '@/lib/format'
import { toast } from 'sonner'

type LibraryBook = (typeof libraryBooks)[number]
type IssuedBook = (typeof issuedBooks)[number]

export function BooksCatalogue({
  search, setSearch, category, setCategory, categories, filteredBooks,
}: {
  search: string
  setSearch: (s: string) => void
  category: string
  setCategory: (c: string) => void
  categories: string[]
  filteredBooks: LibraryBook[]
}) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-sm">Book Catalogue</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{filteredBooks.length} books found</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, author, ISBN" className="pl-8 w-full sm:w-56" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">Book</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">ISBN</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold text-center">Copies</TableHead>
              <TableHead className="font-semibold text-center">Available</TableHead>
              <TableHead className="font-semibold text-center">Issued</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBooks.map((b, i) => {
              const status = b.available === 0 ? 'Out of Stock' : b.available < b.copies / 2 ? 'Low Stock' : 'Available'
              const variant = status === 'Out of Stock' ? 'danger' : status === 'Low Stock' ? 'warning' : 'success'
              return (
                <motion.tr
                  key={b.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-accent/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <BookMarked className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{b.title}</p>
                        <p className="text-[11px] text-muted-foreground">{b.author}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">{b.isbn}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{b.category}</Badge></TableCell>
                  <TableCell className="text-center font-medium">{b.copies}</TableCell>
                  <TableCell className="text-center"><span className="font-semibold text-emerald-600">{b.available}</span></TableCell>
                  <TableCell className="text-center"><span className="font-semibold text-amber-600">{b.issued}</span></TableCell>
                  <TableCell><StatusBadge status={status} variant={variant} dot /></TableCell>
                </motion.tr>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  )
}

export function IssuedBooksTable({ issued }: { issued: IssuedBook[] }) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">Issued Books</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{issued.length} currently issued</p>
        </div>
        <StatusBadge status={`${issued.filter((b) => b.status === 'Overdue').length} overdue`} variant="warning" dot />
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">Book & Student</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">Admission No</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Issue Date</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Due Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Fine</TableHead>
              <TableHead className="font-semibold text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issued.map((b, i) => (
              <motion.tr
                key={b.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="hover:bg-accent/30 transition-colors"
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <GradientAvatar name={b.student} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{b.book}</p>
                      <p className="text-[11px] text-muted-foreground">{b.student}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground">{b.admissionNo}</TableCell>
                <TableCell className="hidden md:table-cell text-xs">{formatDate(b.issueDate)}</TableCell>
                <TableCell className="hidden md:table-cell text-xs">{formatDate(b.dueDate)}</TableCell>
                <TableCell>
                  <StatusBadge status={b.status} variant={b.status === 'Overdue' ? 'danger' : 'primary'} dot />
                </TableCell>
                <TableCell className="text-right">
                  {b.fine > 0 ? <span className="font-semibold text-rose-600 text-sm">{formatINR(b.fine)}</span> : <span className="text-muted-foreground text-xs">—</span>}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => toast.success('Book returned', { description: `${b.book} returned by ${b.student}${b.fine > 0 ? ` · Fine collected: ${formatINR(b.fine)}` : ''}` })}>
                    <RotateCcw className="h-3 w-3" /> Return
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  )
}
