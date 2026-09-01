'use client'

import { KeyRound, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/shared/ui'
import type { IssuanceArtifacts } from './letter-data'

interface CredentialsTabProps {
  artifacts: IssuanceArtifacts
  onCopy: () => void
}

export function CredentialsTab({ artifacts, onCopy }: CredentialsTabProps) {
  const { loginId, tempPassword } = artifacts

  return (
    <GlassCard className="p-6 max-w-lg mx-auto space-y-4 border text-center">
      <KeyRound className="h-10 w-10 text-emerald-600 mx-auto" />
      <div>
        <h3 className="font-bold text-lg">Student & Parent Portal Credentials</h3>
        <p className="text-xs text-muted-foreground">Auto-provisioned access for the Scholario Mobile & Web App.</p>
      </div>

      <div className="p-4 rounded-xl bg-muted/50 text-left space-y-3 border text-xs font-mono">
        <div>
          <span className="text-muted-foreground text-[10px] block font-sans">PORTAL URL</span>
          <span className="font-bold text-emerald-600">https://portal.scholario.app</span>
        </div>
        <div>
          <span className="text-muted-foreground text-[10px] block font-sans">LOGIN ID / USERNAME</span>
          <span className="font-extrabold text-sm text-foreground">{loginId}</span>
        </div>
        <div>
          <span className="text-muted-foreground text-[10px] block font-sans">TEMPORARY PASSWORD</span>
          <span className="font-extrabold text-sm text-foreground">{tempPassword}</span>
        </div>
      </div>

      <Button size="sm" onClick={onCopy} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 w-full">
        <Copy className="h-3.5 w-3.5" />
        Copy Login Credentials
      </Button>
    </GlassCard>
  )
}
