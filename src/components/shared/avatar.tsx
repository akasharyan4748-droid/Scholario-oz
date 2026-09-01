'use client'

/**
 * Avatar — the shared initials/photo avatar component for SCHOLARIO.
 *
 * Visual identity:
 *   - Deterministic color assignment (same person → same color everywhere)
 *   - Initials generated from name if not provided
 *   - Optional photo URL (falls back to initials)
 *   - Restrained palette (6 muted gradient stops — no rainbow)
 *   - Circle (default) or square shape
 *   - Sizes: xs (24px) / sm (32px) / md (40px) / lg (48px) / xl (64px)
 *
 * This is the SINGLE source of truth for avatars across the ERP.
 * Replaces the 60+ GradientAvatar callers + the dead shadcn Avatar.
 *
 * Design language (matches Academics):
 *   - rounded-full (or rounded-lg for square)
 *   - bg-gradient-to-br with deterministic gradient
 *   - font-semibold text-white
 *   - shadow-sm
 *   - subtle ring for emphasis variants
 */

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export interface AvatarProps {
  /** Full name — used to generate initials and deterministic color */
  name: string
  /** Override the auto-generated initials (e.g. "AS" for "Aarav Sharma") */
  initials?: string
  /** Optional photo URL. If provided and loads, shows the photo; falls back to initials. */
  src?: string
  /** Avatar size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Shape */
  shape?: 'circle' | 'square'
  /** Override the deterministic gradient (rarely needed) */
  gradient?: string
  /** Add a subtle ring (for emphasis in lists) */
  ring?: boolean
  className?: string
}

const AVATAR_SIZES: Record<string, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
}

// Restrained palette — 6 muted gradient stops (no rainbow)
const AVATAR_GRADIENTS = [
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500',
  'from-cyan-400 to-sky-500',
  'from-lime-400 to-green-500',
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return Math.abs(hash)
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, initials, src, size = 'md', shape = 'circle', gradient, ring, className }, ref) => {
    const text = initials ?? getInitials(name)
    const g = gradient ?? AVATAR_GRADIENTS[hashString(name) % AVATAR_GRADIENTS.length]
    const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg'

    // If a photo URL is provided, use shadcn Avatar (handles image + fallback)
    if (src) {
      return (
        <div
          ref={ref}
          className={cn(
            'relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br font-semibold text-white shadow-sm',
            shapeClass,
            g,
            AVATAR_SIZES[size],
            ring && 'ring-2 ring-background',
            className,
          )}
        >
          <AvatarImage src={src} alt={name} className="h-full w-full object-cover" />
          <AvatarFallback className="bg-transparent text-white font-semibold">{text}</AvatarFallback>
        </div>
      )
    }

    // No photo — render initials with deterministic gradient
    return (
      <div
        ref={ref}
        className={cn(
          'flex shrink-0 items-center justify-center bg-gradient-to-br font-semibold text-white shadow-sm',
          shapeClass,
          g,
          AVATAR_SIZES[size],
          ring && 'ring-2 ring-background',
          className,
        )}
      >
        {text}
      </div>
    )
  },
)
Avatar.displayName = 'Avatar'

// Backward-compatible re-export so existing GradientAvatar callers keep working.
// New code should use <Avatar> directly.
export { Avatar as GradientAvatar }
