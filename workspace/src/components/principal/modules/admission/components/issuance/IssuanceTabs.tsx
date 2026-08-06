'use client'

import { FileText, Wallet, KeyRound, Sparkles, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type IssuanceTabKey = 'letter' | 'receipt' | 'credentials' | 'welcome' | 'dispatches'

interface IssuanceTabsProps {
  activeTab: IssuanceTabKey
  onTabChange: (tab: IssuanceTabKey) => void
}

const TABS: { key: IssuanceTabKey; label: string; icon: React.ElementType }[] = [
  { key: 'letter', label: 'Official Admission Letter', icon: FileText },
  { key: 'receipt', label: 'Official Fee Receipt', icon: Wallet },
  { key: 'credentials', label: 'Student Portal Credentials', icon: KeyRound },
  { key: 'welcome', label: 'Welcome & Orientation Letter', icon: Sparkles },
  { key: 'dispatches', label: 'Multi-Channel Notifications', icon: MessageSquare },
]

export function IssuanceTabs({ activeTab, onTabChange }: IssuanceTabsProps) {
  return (
    <div className="flex items-center gap-2 border-b pb-2">
      {TABS.map(({ key, label, icon: Icon }) => (
        <Button
          key={key}
          size="sm"
          variant={activeTab === key ? 'default' : 'ghost'}
          onClick={() => onTabChange(key)}
          className={`text-xs gap-1.5 ${activeTab === key ? 'bg-emerald-600 text-white' : ''}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Button>
      ))}
    </div>
  )
}
