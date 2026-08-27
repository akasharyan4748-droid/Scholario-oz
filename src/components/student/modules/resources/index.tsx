'use client'

import { useState, useMemo } from 'react'
import { Library, Sparkles } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { resources, type Resource } from '@/lib/mock/resources'
import { toast } from 'sonner'
import { KpiSection } from './kpi-section'
import { ProgressSection } from './progress-section'
import { FilterBar } from './filter-bar'
import { ResourceGrid } from './resource-grid'
import { ResourceDetail } from './resource-detail'

export function LearningResourcesModule() {
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set(resources.filter((r) => r.bookmarked).map((r) => r.id)))
  const [completed, setCompleted] = useState<Set<string>>(new Set(['R03', 'R04', 'R09']))
  const [selected, setSelected] = useState<Resource | null>(null)

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase())
      const matchSubject = subjectFilter === 'All' || r.subject === subjectFilter
      const matchType = typeFilter === 'All' || r.type === typeFilter
      return matchSearch && matchSubject && matchType
    })
  }, [search, subjectFilter, typeFilter])

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        toast.info('Removed bookmark')
      } else {
        next.add(id)
        toast.success('Bookmarked', { description: 'Saved to your collection' })
      }
      return next
    })
  }

  const markComplete = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        toast.success('Resource completed', { description: '+15 XP earned! 🎉' })
      }
      return next
    })
  }

  const completionRate = Math.round((completed.size / resources.length) * 100)

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Learning Resources"
        subtitle="Videos, notes, worksheets & quizzes for your subjects"
        icon={<Library className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('Recommendations refreshed', { description: 'AI suggests resources based on your progress' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20"
          >
            <Sparkles className="h-3.5 w-3.5" /> For You
          </button>
        }
      />

      <KpiSection
        bookmarkedCount={bookmarked.size}
        completedCount={completed.size}
        completionRate={completionRate}
      />

      <ProgressSection completedCount={completed.size} />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        subjectFilter={subjectFilter}
        onSubjectFilterChange={setSubjectFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
      />

      <ResourceGrid
        items={filtered}
        bookmarked={bookmarked}
        completed={completed}
        onToggleBookmark={toggleBookmark}
        onMarkComplete={markComplete}
        onSelect={setSelected}
      />

      <ResourceDetail
        selected={selected}
        bookmarked={bookmarked}
        onToggleBookmark={toggleBookmark}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
