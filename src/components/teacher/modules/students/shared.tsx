'use client'

// Small shared presentational components used inside the Teacher Students module.

export function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <span className="text-muted-foreground min-w-0 w-20 shrink-0">{label}:</span>
      <span className="font-medium flex-1 break-words">{value}</span>
    </div>
  )
}
