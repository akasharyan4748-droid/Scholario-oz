import { Calendar, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { classList } from '@/lib/mock/school'

interface FilterBarProps {
  searchQuery: string
  setSearchQuery: (v: string) => void
  selectedClass: string
  setSelectedClass: (v: string) => void
  selectedSession: string
  setSelectedSession: (v: string) => void
  selectedAdmissionType: string
  setSelectedAdmissionType: (v: string) => void
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
  showDateFilter: boolean
  setShowDateFilter: (v: boolean | ((prev: boolean) => boolean)) => void
}

// Search + filter bar
export function FilterBar({
  searchQuery,
  setSearchQuery,
  selectedClass,
  setSelectedClass,
  selectedSession,
  setSelectedSession,
  selectedAdmissionType,
  setSelectedAdmissionType,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  showDateFilter,
  setShowDateFilter,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
      <div className="flex-1 relative min-w-[200px]">
        <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
        <Input
          placeholder="Search name, admission no, parent, phone, aadhaar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 text-xs"
        />
      </div>
      <Select value={selectedClass} onValueChange={setSelectedClass}>
        <SelectTrigger className="text-xs w-full sm:w-40">
          <SelectValue placeholder="All Classes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Classes</SelectItem>
          {classList.map((cls) => {
            const name = typeof cls === 'string' ? cls : cls.name
            return <SelectItem key={name} value={name}>{name}</SelectItem>
          })}
        </SelectContent>
      </Select>
      <Select value={selectedSession} onValueChange={setSelectedSession}>
        <SelectTrigger className="text-xs w-full sm:w-40">
          <SelectValue placeholder="All Sessions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Sessions</SelectItem>
          {['2025–2026', '2024–2025', '2023–2024'].map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedAdmissionType} onValueChange={setSelectedAdmissionType}>
        <SelectTrigger className="text-xs w-full sm:w-40">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Types</SelectItem>
          <SelectItem value="fresh">Fresh</SelectItem>
          <SelectItem value="transfer">Transfer</SelectItem>
          <SelectItem value="readmission">Re-admission</SelectItem>
          <SelectItem value="promotion">Promotion</SelectItem>
        </SelectContent>
      </Select>
      {/* Date Range filter */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDateFilter((v) => !v)}
          className={cn('text-xs gap-1.5 h-9', (dateFrom || dateTo) && 'border-primary text-primary')}
        >
          <Calendar className="h-3.5 w-3.5" />
          {dateFrom || dateTo ? `${dateFrom || '...'} → ${dateTo || '...'}` : 'Date Range'}
        </Button>
        {showDateFilter && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDateFilter(false)} />
            <div className="absolute right-0 top-full mt-1.5 z-50 rounded-xl border border-border bg-popover shadow-xl p-3 space-y-2 w-64">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Application Date Range</p>
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground">From</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-xs h-8" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground">To</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-xs h-8" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => { setDateFrom(''); setDateTo('') }}>Clear</Button>
                <Button size="sm" className="text-xs h-7 flex-1" onClick={() => setShowDateFilter(false)}>Apply</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
