import { school } from '@/lib/mock/school'

export const CATEGORIES = ['General', 'Academic', 'Event', 'Urgent', 'Holiday'] as const
export const AUDIENCES = ['All', 'Parents', 'Teachers', 'Students'] as const

export const SMS_TEMPLATES = [
  { id: 't1', name: 'Fee Reminder', text: `Dear Parent, this is a reminder that the quarterly fee for {student_name} is due on {due_date}. Kindly pay before the due date to avoid a late fine. — ${school.name}` },
  { id: 't2', name: 'Absent Alert', text: `Dear Parent, your child {student_name} was absent today ({date}). Please contact the class teacher if unexpected. — ${school.name}` },
  { id: 't3', name: 'Holiday Notice', text: `Dear Parent, the school will remain closed on {date} on account of {occasion}. Classes resume from {reopen_date}. — ${school.name}` },
  { id: 't4', name: 'PTM Reminder', text: `Dear Parent, PTM for {class} is scheduled on {date} from 9 AM to 12 PM. Your presence is requested. — ${school.name}` },
]

export const EMAIL_TEMPLATES = [
  { id: 'e1', name: 'Monthly Newsletter', subject: `${school.shortName} Monthly Newsletter — Recent Month`, body: `Dear Parents,\n\nGreetings from ${school.name}! November has been an exciting month with Sports Day preparations, Inter-House Quiz and our Annual Science Exhibition around the corner.\n\nKey Highlights:\n• 47 new admissions this month\n• Sports Day on 15th December\n• Pre-Board exams from 9th December\n\nWarm regards,\nDr. Ananya Iyer\nPrincipal` },
  { id: 'e2', name: 'Fee Receipt', subject: `Fee Payment Receipt — ${school.shortName}`, body: `Dear Parent,\n\nWe acknowledge the receipt of your fee payment. The detailed receipt is attached with this email for your records.\n\nThank you for your timely payment.\n\nAccounts Team\n${school.name}` },
  { id: 'e3', name: 'Event Invitation', subject: 'Invitation — Annual Sports Day 2025', body: `Dear Parents,\n\nYou are cordially invited to the Annual Sports Day on 15th December 2025 at 7:30 AM. The event will be held at the school sports ground.\n\nLooking forward to seeing you!\n\nSports Department\n${school.name}` },
]

export const PUSH_AUDIENCES = ['All Parents', 'Class Teachers', 'Class 2-A Parents', 'Senior Section', 'Primary Section']

export const CIRCULARS = [
  { id: 'C1', title: 'Pre-Board Exam Circular', date: '2025-11-25', ref: 'DSO/CIR/2025/042', audience: 'Class 10 & 12', color: 'oklch(0.62 0.2 25)' },
  { id: 'C2', title: 'Winter Uniform Circular', date: '2025-11-20', ref: 'DSO/CIR/2025/041', audience: 'All Classes', color: 'oklch(0.7 0.15 200)' },
  { id: 'C3', title: 'Transport Fee Revision', date: '2025-11-15', ref: 'DSO/CIR/2025/040', audience: 'All Parents', color: 'oklch(0.55 0.14 162)' },
  { id: 'C4', title: 'Annual Day Practice Schedule', date: '2025-11-12', ref: 'DSO/CIR/2025/039', audience: 'Class 3–8', color: 'oklch(0.65 0.16 75)' },
  { id: 'C5', title: 'Diwali Holiday Circular', date: '2025-10-25', ref: 'DSO/CIR/2025/038', audience: 'All', color: 'oklch(0.6 0.18 300)' },
  { id: 'C6', title: 'PTM Schedule — Term 2', date: '2025-10-18', ref: 'DSO/CIR/2025/037', audience: 'All Parents', color: 'oklch(0.55 0.16 250)' },
]

export const ANNOUNCEMENT_STATS = [
  { label: 'Total Sent', value: '1,284', sub: 'this term', icon: 'send', color: 'text-emerald-600 bg-emerald-500/10' },
  { label: 'Open Rate', value: '74.6%', sub: 'emails', icon: 'mail', color: 'text-amber-600 bg-amber-500/10' },
  { label: 'Delivery Rate', value: '98.2%', sub: 'SMS', icon: 'sms', color: 'text-violet-600 bg-violet-500/10' },
] as const
