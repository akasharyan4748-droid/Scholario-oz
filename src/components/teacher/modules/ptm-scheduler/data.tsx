'use client'

import {
  CheckCircle2, Clock, Circle, XCircle,
} from 'lucide-react'

export const slotStatusConfig = {
  completed: { variant: 'success' as const, icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: 'Completed', color: 'text-emerald-600 bg-emerald-500/10' },
  booked: { variant: 'info' as const, icon: <Clock className="h-3.5 w-3.5" />, label: 'Booked', color: 'text-sky-600 bg-sky-500/10' },
  available: { variant: 'neutral' as const, icon: <Circle className="h-3.5 w-3.5" />, label: 'Available', color: 'text-muted-foreground bg-muted' },
  cancelled: { variant: 'danger' as const, icon: <XCircle className="h-3.5 w-3.5" />, label: 'Cancelled', color: 'text-rose-600 bg-rose-500/10' },
}
