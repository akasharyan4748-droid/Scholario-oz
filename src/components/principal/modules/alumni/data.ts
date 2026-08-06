export type Tab = 'directory' | 'donations' | 'reunions'

export const TAB_CONFIG: { id: Tab; label: string; icon: string; count: number }[] = [
  { id: 'directory', label: 'Alumni Directory', icon: 'users', count: 0 },
  { id: 'donations', label: 'Donations', icon: 'heart', count: 0 },
  { id: 'reunions', label: 'Reunions', icon: 'calendar', count: 0 },
]
