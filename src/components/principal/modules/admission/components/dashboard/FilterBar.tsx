import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
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
}

/**
 * Filter bar — search + class + session + admission type (2 options only).
 * Date Range filter removed per spec (visual clutter for normal usage).
 * Admission Type simplified to: Fresh Admission | Existing Student.
 */
export function FilterBar({
  searchQuery, setSearchQuery,
  selectedClass, setSelectedClass,
  selectedSession, setSelectedSession,
  selectedAdmissionType, setSelectedAdmissionType,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
      <div className="flex-1 relative min-w-[200px]">
        <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
        <Input
          placeholder="Search name, admission no, parent, phone, aadhaar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 text-xs h-9"
        />
      </div>
      <Select value={selectedClass} onValueChange={setSelectedClass}>
        <SelectTrigger className="text-xs h-9 w-full sm:w-40">
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
        <SelectTrigger className="text-xs h-9 w-full sm:w-40">
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
        <SelectTrigger className="text-xs h-9 w-full sm:w-44">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Types</SelectItem>
          <SelectItem value="fresh">Fresh Admission</SelectItem>
          <SelectItem value="existing">Existing Student</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
