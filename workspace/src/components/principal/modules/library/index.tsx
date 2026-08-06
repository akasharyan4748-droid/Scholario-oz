'use client'

import { useState, useMemo } from 'react'
import {
  BookMarked, BookOpen, Library, AlertTriangle, Search, Plus,
  BookCopy, IndianRupee,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { SectionHeading } from '@/components/shared/ui'
import { ChartCard, AreaTrend, Donut } from '@/components/shared/charts'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { libraryStats, libraryBooks, issuedBooks } from '@/lib/mock/operations'
import { formatINR } from '@/lib/format'
import { monthlyIssues } from './data'
import { BooksCatalogue, IssuedBooksTable } from './books-tables'
import { FinesSummary } from './fines-summary'
import { IssueBookDialog } from './issue-book-dialog'

export function LibraryModule() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [issueOpen, setIssueOpen] = useState(false)

  const categories = useMemo(() => ['All', ...Array.from(new Set(libraryBooks.map((b) => b.category)))], [])

  const filteredBooks = useMemo(() => {
    return libraryBooks.filter((b) => {
      const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()) || b.isbn.includes(search)
      const matchCat = category === 'All' || b.category === category
      return matchSearch && matchCat
    })
  }, [search, category])

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Library Management"
        subtitle="18,420 books · 1,242 issued · Central Library"
        icon={<BookMarked className="h-5 w-5" />}
        action={
          <Button onClick={() => setIssueOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Issue Book
          </Button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <KpiCard label="Total Books" value={libraryStats.totalBooks} icon={<Library className="h-5 w-5" />} trend={0.8} trendLabel={`${libraryStats.newThisMonth} new`} accent="emerald" delay={0} />
        <KpiCard label="Issued" value={libraryStats.issued} icon={<BookOpen className="h-5 w-5" />} trend={4.2} trendLabel="Currently issued" accent="amber" delay={0.05} />
        <KpiCard label="Available" value={libraryStats.available} icon={<BookCopy className="h-5 w-5" />} trendLabel="Ready to issue" accent="cyan" delay={0.1} />
        <KpiCard label="Overdue" value={libraryStats.overdue} icon={<AlertTriangle className="h-5 w-5" />} trend={-12.5} trendLabel="Down from last week" accent="rose" delay={0.15} />
        <KpiCard label="Total Fines" value={libraryStats.totalFines} format={(n) => formatINR(n, true)} icon={<IndianRupee className="h-5 w-5" />} trend={6.4} trendLabel="Pending collection" accent="violet" delay={0.2} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard title="Monthly Issues & Returns" subtitle="Last 6 months" className="lg:col-span-2" height={300}>
          <AreaTrend data={monthlyIssues.map((m) => ({ name: m.name, value: m.issues }))} xKey="name" yKey="value" color="oklch(0.55 0.14 162)" height={300} gradientId="issArea" />
        </ChartCard>

        <ChartCard title="Books by Category" subtitle="Distribution" height={300}>
          <Donut data={libraryStats.byCategory} centerValue={`${(libraryStats.totalBooks / 1000).toFixed(1)}K`} centerLabel="Books" height={300} />
        </ChartCard>
      </div>

      {/* Books table */}
      <BooksCatalogue
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        categories={categories}
        filteredBooks={filteredBooks}
      />

      {/* Issued books table */}
      <IssuedBooksTable issued={issuedBooks} />

      {/* Fine collection summary */}
      <FinesSummary />

      <IssueBookDialog open={issueOpen} onOpenChange={setIssueOpen} />
    </div>
  )
}
