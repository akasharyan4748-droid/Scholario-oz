'use client'

import { useState, useMemo } from 'react'
import { Download } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { CATEGORIES, type Filter } from './data'
import { FilterBar } from './filter-bar'
import { CategorySection } from './category-section'

export function DownloadsModule() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All')

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase()
    return CATEGORIES
      .filter((c) => filter === 'All' || c.label === filter)
      .map((c) => ({
        ...c,
        docs: c.docs.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.desc.toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.docs.length > 0)
  }, [search, filter])

  const totalDocs = useMemo(
    () => filteredCategories.reduce((n, c) => n + c.docs.length, 0),
    [filteredCategories]
  )

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Downloads"
        subtitle="School document library · forms, certificates & templates"
        icon={<Download className="h-5 w-5" />}
      />

      <FilterBar
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        totalDocs={totalDocs}
      />

      {/* Category sections */}
      <div className="space-y-7">
        {filteredCategories.map((cat, ci) => (
          <CategorySection key={cat.key} cat={cat} ci={ci} />
        ))}
      </div>
    </div>
  )
}
