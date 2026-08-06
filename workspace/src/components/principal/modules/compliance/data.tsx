'use client'

import {
  CheckCircle2, Clock, AlertTriangle, Award, FileText, Flame,
  BookOpen, IndianRupee,
} from 'lucide-react'

export type Tab = 'compliance' | 'audits' | 'documents'

export const statusConfig = {
  Compliant: { variant: 'success' as const, color: 'text-emerald-600 bg-emerald-500/10', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  Pending: { variant: 'warning' as const, color: 'text-amber-600 bg-amber-500/10', icon: <Clock className="h-3.5 w-3.5" /> },
  'Action Required': { variant: 'danger' as const, color: 'text-rose-600 bg-rose-500/10', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  Expired: { variant: 'danger' as const, color: 'text-rose-600 bg-rose-500/10', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
}

export const categoryIcons: Record<string, React.ReactNode> = {
  Accreditation: <Award className="h-5 w-5" />,
  Statutory: <FileText className="h-5 w-5" />,
  Safety: <Flame className="h-5 w-5" />,
  Academic: <BookOpen className="h-5 w-5" />,
  Financial: <IndianRupee className="h-5 w-5" />,
}

export const priorityConfig = {
  high: 'bg-rose-500/15 text-rose-600',
  medium: 'bg-amber-500/15 text-amber-600',
  low: 'bg-muted text-muted-foreground',
}
