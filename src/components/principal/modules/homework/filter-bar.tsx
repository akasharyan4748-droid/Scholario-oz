'use client'

import { Filter, Search } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Props {
  search: string
  setSearch: (v: string) => void
  subFilter: string
  setSubFilter: (v: string) => void
  classFilter: string
  setClassFilter: (v: string) => void
  uniqueSubjects: string[]
  uniqueClasses: string[]
}

export function HomeworkFilterBar({
  search, setSearch, subFilter, setSubFilter, classFilter, setClassFilter,
  uniqueSubjects, uniqueClasses,
}: Props) {
  return (
    <GlassCard className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <Filter className="h-3.5 w-3.5" /> Filters:
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search homework or teacher…"
            className="pl-8 h-9"
          />
        </div>
        <Select value={subFilter} onValueChange={setSubFilter}>
          <SelectTrigger className="h-9 w-full sm:w-40"><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {uniqueSubjects.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="h-9 w-full sm:w-32"><SelectValue placeholder="Class" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {uniqueClasses.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </GlassCard>
  )
}
