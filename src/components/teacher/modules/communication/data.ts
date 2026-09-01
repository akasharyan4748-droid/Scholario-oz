// Static data and constants for the Teacher Communication module

export const categoryColor: Record<string, string> = {
  Event: 'bg-emerald-500/10 text-emerald-600',
  Academic: 'bg-violet-500/10 text-violet-600',
  Holiday: 'bg-amber-500/10 text-amber-600',
  Urgent: 'bg-rose-500/10 text-rose-600',
  General: 'bg-cyan-500/10 text-cyan-600',
}

export interface MessageTemplate {
  id: string
  name: string
  text: string
}

export const sampleTemplates: MessageTemplate[] = [
  { id: 'T1', name: 'Absent Notification', text: 'Dear Parent, your child {student_name} was absent today from Class 2-A. Please send a leave note. — Demo School of Scholario' },
  { id: 'T2', name: 'Homework Reminder', text: 'Dear Parent, this is a reminder that {student_name} has pending homework (Addition Worksheet 4) due tomorrow. — Rohan Mehta, Class Teacher' },
  { id: 'T3', name: 'PTM Invitation', text: 'Dear Parent, Parent-Teacher Meeting for Class 2-A is scheduled on Saturday, 7th Dec 2024, 9:00 AM. Your presence is requested. — Demo School of Scholario' },
  { id: 'T4', name: 'Excellent Performance', text: 'Dear Parent, congratulations! {student_name} scored 96% in Mathematics UT3. We are proud of this achievement. — Rohan Mehta' },
]

export type MsgChannel = 'sms' | 'email' | 'push'

export interface AnnouncementForm {
  title: string
  content: string
  category: string
  audience: string
  pin: boolean
}
