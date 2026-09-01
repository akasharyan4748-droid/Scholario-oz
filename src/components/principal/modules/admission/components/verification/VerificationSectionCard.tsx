'use client'

import React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { GlassCard } from '@/components/shared/ui'
import type { AdmissionApplication, SectionKey, SectionReviewState } from '@/lib/store/admission-store'
import { SectionDataContent } from './SectionDataContent'

interface VerificationSectionCardProps {
  app: AdmissionApplication
  sectionKey: SectionKey
  title: string
  icon: React.ElementType
  review: SectionReviewState
  onStatusChange: (key: SectionKey, status: 'Complete' | 'Incomplete' | 'Needs Review') => void
  onRemarkChange: (key: SectionKey, remarks: string) => void
}

export function VerificationSectionCard({
  app,
  sectionKey,
  title,
  icon: Icon,
  review,
  onStatusChange,
  onRemarkChange,
}: VerificationSectionCardProps) {
  return (
    <GlassCard key={sectionKey} className="p-4 space-y-3 border">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-emerald-600" />
          <h4 className="font-bold text-sm text-foreground">{title}</h4>
        </div>

        {/* Section Status Selector Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onStatusChange(sectionKey, 'Complete')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
              review.status === 'Complete'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-emerald-100'
            }`}
          >
            ✓ Complete
          </button>

          <button
            onClick={() => onStatusChange(sectionKey, 'Needs Review')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
              review.status === 'Needs Review'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-amber-100'
            }`}
          >
            ⚠ Needs Review
          </button>

          <button
            onClick={() => onStatusChange(sectionKey, 'Incomplete')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
              review.status === 'Incomplete'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-rose-100'
            }`}
          >
            ✕ Incomplete
          </button>
        </div>
      </div>

      {/* Section Data Content Summary */}
      <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-1.5">
        <SectionDataContent sectionKey={sectionKey} app={app} />
      </div>

      {/* Section Officer Remarks Input */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-muted-foreground">
          Officer Remarks for this section:
        </label>
        <Textarea
          placeholder="Enter section-specific feedback or correction notes..."
          value={review.remarks}
          onChange={(e) => onRemarkChange(sectionKey, e.target.value)}
          className="text-xs min-h-[50px] resize-none"
        />
      </div>
    </GlassCard>
  )
}
