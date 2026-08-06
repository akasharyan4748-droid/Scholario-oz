import { KpiStat } from './KpiStat'

interface KpiStripProps {
  inReview: number
  needCorrection: number
  approved: number
  enrolled: number
}

// Operational KPI strip — 4 cards, not 7
export function KpiStrip({ inReview, needCorrection, approved, enrolled }: KpiStripProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiStat label="Pending Review" value={inReview} sub="Awaiting officer" color="text-sky-600 dark:text-sky-400" bg="bg-sky-500/5" />
      <KpiStat label="Need Correction" value={needCorrection} sub="Returned to applicant" color="text-amber-600 dark:text-amber-400" bg="bg-amber-500/5" />
      <KpiStat label="Approved" value={approved} sub="Ready to issue" color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-500/5" />
      <KpiStat label="Enrolled" value={enrolled} sub="Active students" color="text-teal-600 dark:text-teal-400" bg="bg-teal-500/5" />
    </div>
  )
}
