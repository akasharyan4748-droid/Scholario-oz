import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/shared/ui'
import { type AdmissionStoreState, type AdmissionApplication } from '@/lib/store/admission-store'
import { ApplicationRow } from './ApplicationRow'
import type { ActiveTab } from './types'

interface ApplicationsTableProps {
  filteredApps: AdmissionApplication[]
  store: AdmissionStoreState
  onOpenWizard: (appId?: string) => void
  onOpenVerificationWorkspace: (appId: string) => void
  onOpenIssuanceWorkspace: (appId: string) => void
  setActiveTab: (tab: ActiveTab) => void
  setSearchQuery: (v: string) => void
  setSelectedClass: (v: string) => void
}

export function ApplicationsTable({
  filteredApps,
  store,
  onOpenWizard,
  onOpenVerificationWorkspace,
  onOpenIssuanceWorkspace,
  setActiveTab,
  setSearchQuery,
  setSelectedClass,
}: ApplicationsTableProps) {
  return (
    <GlassCard className="overflow-hidden border">
      {filteredApps.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-sm">No applications found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No records match your filters. Try adjusting the status tab or search query.
          </p>
          <Button size="sm" variant="outline" onClick={() => { setActiveTab('All'); setSearchQuery(''); setSelectedClass('All') }} className="text-xs mt-2">
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="divide-y overflow-x-auto">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-3 p-3 bg-muted/40 text-muted-foreground font-bold uppercase text-[10px] tracking-wider min-w-[760px]">
            <div className="col-span-3">Applicant</div>
            <div className="col-span-2">Class</div>
            <div className="col-span-2">Parent</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          {filteredApps.map((app) => (
            <ApplicationRow
              key={app.id}
              app={app}
              store={store}
              onOpenWizard={onOpenWizard}
              onOpenVerificationWorkspace={onOpenVerificationWorkspace}
              onOpenIssuanceWorkspace={onOpenIssuanceWorkspace}
            />
          ))}
        </div>
      )}
    </GlassCard>
  )
}
