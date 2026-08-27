import { AlertTriangle, Shield, ThumbsUp } from 'lucide-react'

export type Tab = 'records' | 'leaderboard'

export const typeConfig = {
  positive: { variant: 'success' as const, icon: <ThumbsUp className="h-3.5 w-3.5" />, label: 'Positive', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  concern: { variant: 'warning' as const, icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Concern', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  incident: { variant: 'danger' as const, icon: <Shield className="h-3.5 w-3.5" />, label: 'Incident', color: 'text-rose-600 bg-rose-500/10 border-rose-500/20' },
}

export const statusConfig = {
  open: { variant: 'danger' as const, label: 'Open' },
  monitoring: { variant: 'warning' as const, label: 'Monitoring' },
  resolved: { variant: 'success' as const, label: 'Resolved' },
}
