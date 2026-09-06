'use client'

import { useEffect } from 'react'

/**
 * useDismissOnEscape — dismissible overlays (custom preview modals,
 * full-screen workspaces) close on the Escape key, matching the shadcn
 * Dialog behaviour users expect across the app.
 *
 * @param onDismiss called when Escape is pressed while active
 * @param active    attach the listener only while the overlay is open
 */
export function useDismissOnEscape(onDismiss: () => void, active = true) {
  useEffect(() => {
    if (!active) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onDismiss()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onDismiss, active])
}
