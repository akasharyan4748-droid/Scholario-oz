'use client'

/**
 * FeedbackSection — Parent Grievance Portal + Survey Metrics.
 *
 * A. Parent Helpdesk / Grievance Portal: inbox of parent complaints.
 * B. Homework Survey Metrics: end-of-term survey results (placeholder).
 */

import { useState } from 'react'
import { MessageSquare, Inbox, Send, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SegmentedTabs } from '../../shared/segmented-tabs'
import { InlineLoading } from '../../exams/inline-loading'
import { useGrievances, type GrievanceDTO } from '@/lib/homework/use-oversight'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function FeedbackSection() {
  const [filter, setFilter] = useState('all')
  const { data, loading, resolve } = useGrievances(filter !== 'all' ? filter : undefined)

  return (
    <div className="space-y-4">
      {/* Grievance Portal */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Inbox className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Parent Grievance Portal</h3>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">
          Parents flag issues — ambiguous descriptions, missing links, excessive workloads. Review and resolve here.
        </p>
        <div className="mb-3">
          <SegmentedTabs
            tabs={[
              { value: 'all', label: 'All' },
              { value: 'open', label: 'Open' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'dismissed', label: 'Dismissed' },
            ]}
            value={filter}
            onValueChange={setFilter}
          />
        </div>
        {loading ? (
          <InlineLoading label="Loading grievances…" />
        ) : data.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No grievances found.</p>
        ) : (
          <div className="space-y-2">
            {data.map((g) => (
              <GrievanceCard key={g.id} grievance={g} onResolve={resolve} />
            ))}
          </div>
        )}
      </div>

      {/* Survey Metrics (placeholder — surveys not yet implemented) */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Homework Survey Metrics</h3>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">
          End-of-term survey results from students and parents regarding homework load.
        </p>
        <div className="text-center py-6 text-xs text-muted-foreground">
          <MessageSquare className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
          <p>No survey data yet.</p>
          <p className="text-[9px] mt-1">Surveys will be available at the end of each term.</p>
        </div>
      </div>
    </div>
  )
}

function GrievanceCard({ grievance, onResolve }: { grievance: GrievanceDTO; onResolve: (id: string, response: string, status?: 'resolved' | 'dismissed') => Promise<void> }) {
  const [response, setResponse] = useState('')
  const [expanded, setExpanded] = useState(false)

  const handleResolve = async (status: 'resolved' | 'dismissed') => {
    if (!response.trim()) { toast.error('Response required'); return }
    try {
      await onResolve(grievance.id, response, status)
      setResponse('')
      setExpanded(false)
      toast.success(status === 'resolved' ? 'Grievance resolved' : 'Grievance dismissed')
    } catch (e: any) {
      toast.error('Failed to resolve', { description: e.message })
    }
  }

  const categoryLabel: Record<string, string> = {
    workload: 'Excessive Workload',
    ambiguous: 'Ambiguous Description',
    missing_link: 'Missing Link',
    other: 'Other',
  }

  return (
    <div className={cn(
      'rounded-lg border p-3',
      grievance.status === 'open' ? 'border-amber-500/30 bg-amber-500/5' :
      grievance.status === 'resolved' ? 'border-emerald-500/20 bg-emerald-500/5' :
      'border-border bg-card/40'
    )}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium truncate">{grievance.subject}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">
            {grievance.parentName ?? 'Anonymous'} · {grievance.studentName ?? '—'} · {new Date(grievance.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] text-muted-foreground">{categoryLabel[grievance.category] ?? grievance.category}</span>
          <StatusBadge status={grievance.status} />
        </div>
      </div>
      <p className="text-[10px] text-foreground mb-1.5">{grievance.description}</p>
      {grievance.homeworkTitle && (
        <p className="text-[9px] text-muted-foreground">Re: {grievance.homeworkTitle}</p>
      )}
      {grievance.response && (
        <div className="mt-2 pt-2 border-t border-border/40">
          <p className="text-[9px] uppercase font-semibold text-muted-foreground mb-0.5">Response</p>
          <p className="text-[10px] text-foreground">{grievance.response}</p>
        </div>
      )}
      {grievance.status === 'open' && (
        <div className="mt-2">
          {!expanded ? (
            <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => setExpanded(true)}>
              <Send className="h-3 w-3" /> Respond
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Your response to the parent…"
                className="text-xs min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button size="sm" className="h-6 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleResolve('resolved')}>
                  <CheckCircle2 className="h-3 w-3" /> Resolve
                </Button>
                <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={() => handleResolve('dismissed')}>
                  <XCircle className="h-3 w-3" /> Dismiss
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setExpanded(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    acknowledged: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    dismissed: 'bg-muted text-muted-foreground border-border',
  }
  return <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold', map[status] ?? 'bg-muted text-muted-foreground border-border')}>{status}</span>
}
