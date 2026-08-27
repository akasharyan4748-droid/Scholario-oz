'use client'

// Tabbed assignment list: status tabs (All / Pending / Submitted / Graded)
// with live counts, plus the responsive grid of assignment cards.

import { useMemo, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { assignments, type Assignment } from '@/lib/mock/academics'
import { AssignmentCard } from './assignment-card'

interface AssignmentListProps {
  onSelect: (a: Assignment) => void
}

export function AssignmentList({ onSelect }: AssignmentListProps) {
  const [tab, setTab] = useState('all')

  const filtered = useMemo(() => {
    if (tab === 'all') return assignments
    return assignments.filter((a) => a.status.toLowerCase() === tab)
  }, [tab])

  const graded = assignments.filter((a) => a.status === 'Graded').length

  return (
    <div>
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="all">All ({assignments.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({assignments.filter((a) => a.status === 'Pending').length})</TabsTrigger>
            <TabsTrigger value="submitted">Submitted ({assignments.filter((a) => a.status === 'Submitted').length})</TabsTrigger>
            <TabsTrigger value="graded">Graded ({graded})</TabsTrigger>
          </TabsList>
          <p className="text-xs text-muted-foreground">{filtered.length} shown</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((a, i) => (
            <AssignmentCard key={a.id} a={a} index={i} onSelect={onSelect} />
          ))}
        </div>
      </Tabs>
    </div>
  )
}
