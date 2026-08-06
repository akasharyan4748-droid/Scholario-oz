import { Video, FileText, FileQuestion, FileSpreadsheet } from 'lucide-react'
import type { Resource } from '@/lib/mock/resources'

export const typeConfig: Record<Resource['type'], { icon: React.ReactNode; label: string; color: string }> = {
  video: { icon: <Video className="h-3.5 w-3.5" />, label: 'Video', color: 'bg-violet-500/15 text-violet-600' },
  pdf: { icon: <FileText className="h-3.5 w-3.5" />, label: 'PDF', color: 'bg-rose-500/15 text-rose-600' },
  notes: { icon: <FileText className="h-3.5 w-3.5" />, label: 'Notes', color: 'bg-emerald-500/15 text-emerald-600' },
  quiz: { icon: <FileQuestion className="h-3.5 w-3.5" />, label: 'Quiz', color: 'bg-amber-500/15 text-amber-600' },
  worksheet: { icon: <FileSpreadsheet className="h-3.5 w-3.5" />, label: 'Worksheet', color: 'bg-cyan-500/15 text-cyan-600' },
}

export const subjectFilters = ['All', 'Mathematics', 'English', 'Science', 'Hindi', 'Computer Science', 'Social Studies', 'Art & Craft', 'Music']
export const typeFilters = ['All', 'video', 'pdf', 'notes', 'quiz', 'worksheet']
