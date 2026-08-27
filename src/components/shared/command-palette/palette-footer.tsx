'use client'

export function PaletteFooter() {
  return (
    <div className="flex items-center justify-between border-t border-border/60 bg-card/40 px-3.5 py-2 text-[10px] text-muted-foreground shrink-0">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border bg-muted px-1 py-0.2 text-[9px] font-medium">↑</kbd>
          <kbd className="rounded border border-border bg-muted px-1 py-0.2 text-[9px] font-medium">↓</kbd>
          navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border bg-muted px-1 py-0.2 text-[9px] font-medium">↵</kbd>
          select
        </span>
      </div>
      <span className="font-medium text-muted-foreground/80">
        School Entity Search
      </span>
    </div>
  )
}
