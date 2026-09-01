'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/shared/ui'
import type { AdmissionApplication } from '@/lib/store/admission-store'

interface WelcomeLetterTabProps {
  app: AdmissionApplication
}

export function WelcomeLetterTab({ app }: WelcomeLetterTabProps) {
  const formData = app.formData

  return (
    <GlassCard className="p-6 max-w-2xl mx-auto space-y-4 border text-xs leading-relaxed">
      <div className="border-b pb-3">
        <h3 className="font-bold text-base text-foreground">Welcome to Demo School of Scholario</h3>
        <p className="text-muted-foreground">Official Orientation Letter from the Office of the Principal</p>
      </div>

      <p>Dear {formData.fatherName} & {formData.motherName},</p>
      <p>
        It gives us immense joy to welcome <strong>{formData.firstName} {formData.lastName}</strong> into our school family for the <strong>{app.academicSession}</strong> academic session in <strong>{formData.className} — Section {formData.section}</strong>.
      </p>
      <p>
        Please note the following key orientation milestones:
      </p>
      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
        <li><strong>Class Commencement Date:</strong> 1st April 2026 at 08:00 AM.</li>
        <li><strong>Uniform & Bookstore Collection:</strong> Book counter open Monday to Saturday (9:00 AM – 2:00 PM).</li>
        <li><strong>Transport Bus Route:</strong> {formData.transportRequired ? formData.transportRoute : 'Self Conveyance'}.</li>
      </ul>

      <div className="pt-4 flex justify-end">
        <Button size="sm" variant="outline" onClick={() => window.print()} className="text-xs">
          <Printer className="h-3.5 w-3.5 mr-1" />
          Print Welcome Letter
        </Button>
      </div>
    </GlassCard>
  )
}
