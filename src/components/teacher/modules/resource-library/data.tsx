// Resource library module: type icon/color config + subject filter list.

import {
  ClipboardCheck, FileSpreadsheet, Presentation, FileText,
  Lightbulb, Video, BookMarked,
} from 'lucide-react'
import { type TeachingResource } from '@/lib/mock/teacher-resources'

export const typeConfig: Record<TeachingResource['type'], { icon: React.ReactNode; color: string }> = {
  'Lesson Plan': { icon: <ClipboardCheck className="h-3.5 w-3.5" />, color: 'bg-emerald-500/15 text-emerald-600' },
  Worksheet: { icon: <FileSpreadsheet className="h-3.5 w-3.5" />, color: 'bg-amber-500/15 text-amber-600' },
  Presentation: { icon: <Presentation className="h-3.5 w-3.5" />, color: 'bg-violet-500/15 text-violet-600' },
  Assessment: { icon: <FileText className="h-3.5 w-3.5" />, color: 'bg-rose-500/15 text-rose-600' },
  Activity: { icon: <Lightbulb className="h-3.5 w-3.5" />, color: 'bg-cyan-500/15 text-cyan-600' },
  Video: { icon: <Video className="h-3.5 w-3.5" />, color: 'bg-fuchsia-500/15 text-fuchsia-600' },
  Reference: { icon: <BookMarked className="h-3.5 w-3.5" />, color: 'bg-sky-500/15 text-sky-600' },
}

export const subjectFilters = ['All', 'Mathematics', 'English', 'Science', 'Hindi', 'Computer Science', 'Social Studies', 'Art & Craft', 'Music']
