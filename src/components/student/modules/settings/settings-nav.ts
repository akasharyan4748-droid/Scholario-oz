import {
  User, LockKeyhole, MonitorSmartphone, Bell, Palette, Accessibility,
  GraduationCap, ShieldCheck, ShieldAlert, LifeBuoy, Info,
} from 'lucide-react'

// ============================================================
// SS-1 — SETTINGS SECTION REGISTRY
// ------------------------------------------------------------
// Single source for the settings navigation (desktop rail + mobile
// list), palette deep-link targets, and section metadata. One sidebar
// entry ("Settings") — everything below lives INSIDE it.
// ============================================================

export type SettingsSectionId =
  | 'profile' | 'security' | 'devices'
  | 'notifications' | 'appearance' | 'accessibility'
  | 'learning' | 'privacy' | 'safety'
  | 'support' | 'about'

export interface SettingsNavItem {
  id: SettingsSectionId
  label: string
  icon: typeof User
  /** One-line context for the mobile list + section header. */
  caption: string
}

export interface SettingsNavGroup {
  label: string
  items: SettingsNavItem[]
}

export const SETTINGS_NAV: SettingsNavGroup[] = [
  {
    label: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: User, caption: 'Your photo and official student information' },
      { id: 'security', label: 'Login & Security', icon: LockKeyhole, caption: 'Password and sign-in' },
      { id: 'devices', label: 'Devices', icon: MonitorSmartphone, caption: 'Where your account is signed in' },
    ],
  },
  {
    label: 'Preferences',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell, caption: 'What you get notified about' },
      { id: 'appearance', label: 'Appearance', icon: Palette, caption: 'Theme and accent colour' },
      { id: 'accessibility', label: 'Accessibility', icon: Accessibility, caption: 'Motion and text size' },
    ],
  },
  {
    label: 'Learning',
    items: [
      { id: 'learning', label: 'Study Preferences', icon: GraduationCap, caption: 'Dashboard study reminders' },
    ],
  },
  {
    label: 'Privacy & Safety',
    items: [
      { id: 'privacy', label: 'Privacy', icon: ShieldCheck, caption: 'Who can see what' },
      { id: 'safety', label: 'Account Safety', icon: ShieldAlert, caption: 'Security status and actions' },
    ],
  },
  {
    label: 'Support',
    items: [
      { id: 'support', label: 'Help & Support', icon: LifeBuoy, caption: 'Contact your school office' },
      { id: 'about', label: 'About', icon: Info, caption: 'Scholario on this device' },
    ],
  },
]

export const SETTINGS_ITEMS: SettingsNavItem[] = SETTINGS_NAV.flatMap((g) => g.items)

export function getSettingsItem(id: SettingsSectionId): SettingsNavItem {
  return SETTINGS_ITEMS.find((i) => i.id === id) ?? SETTINGS_ITEMS[0]
}

/** Palette deep-link pseudo-keys (student-panel remaps them). */
export const SETTINGS_SEARCH_HINTS: Record<string, string> = {
  profile: 'profile photo student information name class',
  security: 'password change password login email sign in',
  devices: 'sessions devices sign out other devices browsers',
  notifications: 'notifications alerts announcements messages reminders channels',
  appearance: 'theme dark light system accent colour appearance',
  accessibility: 'accessibility reduce motion larger text font size',
  learning: 'study preferences flashcards planner reminders',
  privacy: 'privacy visibility classmates school managed',
  safety: 'account safety security status sessions',
  support: 'help support contact school office report problem',
  about: 'about version scholario school',
}
