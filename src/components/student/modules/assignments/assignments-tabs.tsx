'use client'

import { CheckCircle2 } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { Assignment } from '@/lib/mock/academics'
import { AssignmentCard } from './assignment-card'

interface AssignmentsTabsProps {
  pending: Assignment[]
  submitted: Assignment[]
  graded: Assignment[]
  onSubmit: (id: string) => void
}

export function AssignmentsTabs({ pending, submitted, graded, onSubmit }: AssignmentsTabsProps) {
  return (
    <Tabs defaultValue="pending" className="space-y-4">
      <TabsList className="bg-card/60 backdrop-blur">
        <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
        <TabsTrigger value="submitted">Submitted ({submitted.length})</TabsTrigger>
        <TabsTrigger value="graded">Graded ({graded.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="space-y-4">
        {pending.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {pending.map((a, i) => (
              <AssignmentCard key={a.id} a={a} submitted={false} onSubmit={() => onSubmit(a.id)} index={i} />
            ))}
          </div>
        ) : (
          <GlassCard className="p-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-lg">All caught up! 🎉</p>
            <p className="text-sm text-muted-foreground mt-1">No pending assignments.</p>
          </GlassCard>
        )}
      </TabsContent>

      <TabsContent value="submitted" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {submitted.map((a, i) => (
            <AssignmentCard key={a.id} a={a} submitted={true} onSubmit={() => {}} index={i} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="graded" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {graded.map((a, i) => (
            <AssignmentCard key={a.id} a={a} submitted={true} onSubmit={() => {}} index={i} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
