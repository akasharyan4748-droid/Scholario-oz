import { StatusBadge } from '@/components/shared/ui'
import { subjectColor } from './data'

// Shared subject tag (used in homework cards + submission dialog header)
export function SubjectTag({ subject }: { subject: string }) {
  const color = subjectColor(subject)
  return (
    <span
      className="rounded-md text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide"
      style={{ background: `${color}1a`, color }}
    >
      {subject}
    </span>
  )
}

export function StatusChip({ status }: { status: string }) {
  return (
    <StatusBadge status={status} variant={status === 'Active' ? 'warning' : 'success'} dot />
  )
}
