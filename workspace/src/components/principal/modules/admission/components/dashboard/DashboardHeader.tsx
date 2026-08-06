import { Plus, SlidersHorizontal, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardHeaderProps {
  total: number
  inReview: number
  approved: number
  onOpenSettingsModal: () => void
  onOpenOcrModal?: () => void
  onOpenWizard: () => void
}

export function DashboardHeader({
  total,
  inReview,
  approved,
  onOpenSettingsModal,
  onOpenOcrModal,
  onOpenWizard,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Admissions</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {total} applications · {inReview} pending review · {approved} ready for issuance
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* Settings */}
        <Button variant="outline" size="sm" onClick={onOpenSettingsModal} className="text-xs gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Settings
        </Button>
        {/* Scan Filled Form (OCR) — downloads moved to dedicated Downloads sidebar module */}
        {onOpenOcrModal && (
          <Button variant="outline" size="sm" onClick={onOpenOcrModal} className="text-xs gap-1.5">
            <UploadCloud className="h-3.5 w-3.5" />
            Scan Form
          </Button>
        )}
        {/* Single primary action */}
        <Button size="sm" onClick={() => onOpenWizard()} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1.5">
          <Plus className="h-4 w-4" />
          New Application
        </Button>
      </div>
    </div>
  )
}
