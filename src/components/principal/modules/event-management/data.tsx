'use client'

import {
  Trophy, Music, FlaskConical, Bus, Crown, Star,
  CheckCircle2, Clock, Circle, AlertCircle,
} from 'lucide-react'

export type Tab = 'events' | 'tasks' | 'gallery'

export const typeIcons: Record<string, React.ReactNode> = {
  Sports: <Trophy className="h-5 w-5" />,
  Cultural: <Music className="h-5 w-5" />,
  Academic: <FlaskConical className="h-5 w-5" />,
  Competition: <Star className="h-5 w-5" />,
  Ceremony: <Crown className="h-5 w-5" />,
  Trip: <Bus className="h-5 w-5" />,
}

export const taskStatusConfig = {
  done: { variant: 'success' as const, icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: 'Done', color: 'text-emerald-600 bg-emerald-500/10' },
  'in-progress': { variant: 'info' as const, icon: <Clock className="h-3.5 w-3.5" />, label: 'In Progress', color: 'text-sky-600 bg-sky-500/10' },
  pending: { variant: 'neutral' as const, icon: <Circle className="h-3.5 w-3.5" />, label: 'Pending', color: 'text-muted-foreground bg-muted' },
  blocked: { variant: 'danger' as const, icon: <AlertCircle className="h-3.5 w-3.5" />, label: 'Blocked', color: 'text-rose-600 bg-rose-500/10' },
}

export const priorityConfig = {
  high: 'bg-rose-500/15 text-rose-600',
  medium: 'bg-amber-500/15 text-amber-600',
  low: 'bg-muted text-muted-foreground',
}
