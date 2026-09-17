import {
  User, LockKeyhole, MonitorSmartphone, Bell, Palette, Briefcase, Info,
} from 'lucide-react'

// ============================================================
// TS-SETTINGS — Teacher Settings section registry
// ------------------------------------------------------------
// One sidebar entry ("Settings") in the Teacher Workspace; everything
// below lives INSIDE it. Personal account/preferences only — school
// configuration stays in the Principal's School Settings.
// ============================================================

export type TeacherSettingsSectionId =
  | 'profile' | 'security' | 'devices'
  | 'notifications' | 'appearance'
  | 'workspace' | 'about'

export interface TeacherSettingsNavItem {
  id: TeacherSettingsSectionId
  label: string
  icon: typeof User
  /** One-line context for the mobile list + section header. */
  caption: string
}

export interface TeacherSettingsNavGroup {
  label: string
  items: TeacherSettingsNavItem[]
}

export const TEACHER_SETTINGS_NAV: TeacherSettingsNavGroup[] = [
  {
    label: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: User, caption: 'Your photo and official staff information' },
      { id: 'security', label: 'Login & Security', icon: LockKeyhole, caption: 'Password and sign-in' },
      { id: 'devices', label: 'Devices', icon: MonitorSmartphone, caption: 'Where your account is signed in' },
    ],
  },
  {
    label: 'Preferences',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell, caption: 'What you get notified about' },
      { id: 'appearance', label: 'Appearance', icon: Palette, caption: 'Theme and accent colour' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { id: 'workspace', label: 'Workspace Defaults', icon: Briefcase, caption: 'Default class and session' },
    ],
  },
  {
    label: 'About',
    items: [
      { id: 'about', label: 'About', icon: Info, caption: 'Scholario on this device' },
    ],
  },
]

export const TEACHER_SETTINGS_ITEMS: TeacherSettingsNavItem[] =
  TEACHER_SETTINGS_NAV.flatMap((g) => g.items)

export function getTeacherSettingsItem(id: TeacherSettingsSectionId): TeacherSettingsNavItem {
  return TEACHER_SETTINGS_ITEMS.find((i) => i.id === id) ?? TEACHER_SETTINGS_ITEMS[0]
}
