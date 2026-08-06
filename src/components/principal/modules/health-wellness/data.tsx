// Static data, types, and tab config for the Health & Wellness module.

import { HeartPulse, Syringe, Stethoscope } from 'lucide-react'
import { studentHealthRecords, vaccinations, infirmaryVisits } from '@/lib/mock/health'

export type Tab = 'records' | 'vaccinations' | 'infirmary'

export const bmiStatusConfig = {
  normal: { variant: 'success' as const, label: 'Normal' },
  underweight: { variant: 'warning' as const, label: 'Underweight' },
  overweight: { variant: 'warning' as const, label: 'Overweight' },
}

export const severityConfig = {
  minor: { color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30', label: 'Minor', dot: 'bg-emerald-500' },
  moderate: { color: 'bg-amber-500/15 text-amber-600 border-amber-500/30', label: 'Moderate', dot: 'bg-amber-500' },
  urgent: { color: 'bg-rose-500/15 text-rose-600 border-rose-500/30', label: 'Urgent', dot: 'bg-rose-500' },
}

export const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
  { id: 'records', label: 'Health Records', icon: <HeartPulse className="h-3.5 w-3.5" />, count: studentHealthRecords.length },
  { id: 'vaccinations', label: 'Vaccinations', icon: <Syringe className="h-3.5 w-3.5" />, count: vaccinations.length },
  { id: 'infirmary', label: 'Infirmary Log', icon: <Stethoscope className="h-3.5 w-3.5" />, count: infirmaryVisits.length },
]
