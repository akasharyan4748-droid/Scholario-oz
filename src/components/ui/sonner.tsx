"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

/**
 * Global sonner Toaster — FIN spec #7 (toast consistency & contrast).
 *
 * • Primary text (title): full-contrast foreground, semibold, 13px — dark on
 *   light surfaces, light on dark surfaces, never washed out.
 * • Secondary text (description): the app's semantic muted-foreground tone —
 *   the SAME accessible secondary color every other surface in Scholario
 *   uses (WCAG AA on both themes). Deliberately NOT an alpha/opacity mix:
 *   percentage-faded foreground reads as pale gray and fails readability.
 * • Compact footprint: 12px description, tight padding, small radius so
 *   notifications inform instead of dominate. Rich-colors keep the success /
 *   error / warning icon accents.
 * • Single mount (layout.tsx) — the legacy Radix toaster was removed so every
 *   module (`toast` from 'sonner') renders through this one consistent skin.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      gap={8}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:text-[13px]",
          title: "[&_div[data-title]]:text-[13px] [&_div[data-title]]:font-semibold [&_div[data-title]]:tracking-[-0.01em] [&_div[data-title]]:text-foreground",
          description:
            "[&_div[data-description]]:text-[12px] [&_div[data-description]]:leading-snug [&_div[data-description]]:opacity-100 [&_div[data-description]]:!text-muted-foreground",
          closeButton:
            "group-[.toaster]:border-border group-[.toaster]:bg-muted group-[.toaster]:text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
