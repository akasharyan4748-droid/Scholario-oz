// Search result item shape used across the command palette and
// global search. Exported here so all domain searchers share one
// canonical definition.

export interface SearchResultItem {
  id: string
  title: string
  subtitle: string
  category:
    | 'Students'
    | 'Teachers & Faculty'
    | 'Classes & Subjects'
    | 'Parents & Guardians'
    | 'Examinations'
    | 'Notices & Announcements'
    | 'Library & Resources'
    | 'Fees & Finance'
    | 'Features & Pages'
    | 'Settings & System'
  type: 'student' | 'teacher' | 'class' | 'parent' | 'exam' | 'notice' | 'book' | 'fee' | 'feature' | 'setting' | 'subject'
  moduleKey: string
  iconName: string
  badge?: string
  badgeVariant?: 'success' | 'warning' | 'destructive' | 'info' | 'default' | 'outline'
  keywords?: string
  timestamp?: number
}
