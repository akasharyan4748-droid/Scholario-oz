// Messaging / Inbox data — internal staff + parent communication

export interface Conversation {
  id: string
  name: string
  avatar: string
  role: string
  lastMessage: string
  lastTime: string
  unread: number
  online: boolean
  pinned: boolean
  type: 'staff' | 'parent' | 'group'
}

export const conversations: Conversation[] = [
  { id: 'C01', name: 'Rohan Mehta', avatar: 'RM', role: 'Senior Teacher · Maths', lastMessage: 'Submitted the Unit Test 3 marks, please review.', lastTime: '2 min ago', unread: 2, online: true, pinned: true, type: 'staff' },
  { id: 'C02', name: 'Class 2-A Parents', avatar: '2A', role: 'Group · 18 members', lastMessage: 'Mrs. Sharma: Thank you for the PTM update!', lastTime: '18 min ago', unread: 5, online: false, pinned: true, type: 'group' },
  { id: 'C03', name: 'Pooja Bhatt', avatar: 'PB', role: 'HoD Science', lastMessage: 'Lab equipment needs restocking — 4 microscopes down.', lastTime: '1 hr ago', unread: 1, online: true, pinned: false, type: 'staff' },
  { id: 'C04', name: 'Vikram Sharma', avatar: 'VS', role: 'Parent · Aarav Sharma', lastMessage: 'When is the next parent-teacher meeting?', lastTime: '3 hrs ago', unread: 0, online: false, pinned: false, type: 'parent' },
  { id: 'C05', name: 'Rajesh Khanna', avatar: 'RK', role: 'HoD Mathematics', lastMessage: 'Pre-board timetable draft attached for approval.', lastTime: '5 hrs ago', unread: 0, online: false, pinned: false, type: 'staff' },
  { id: 'C06', name: 'Suresh Pillai', avatar: 'SP', role: 'Teacher · Social Sci', lastMessage: 'On medical leave till Friday, sub arranged.', lastTime: 'Yesterday', unread: 0, online: false, pinned: false, type: 'staff' },
  { id: 'C07', name: 'Nikhil Patel', avatar: 'NP', role: 'Parent · Diya Patel', lastMessage: 'Diya will be late today due to a doctor appointment.', lastTime: 'Yesterday', unread: 0, online: true, pinned: false, type: 'parent' },
  { id: 'C08', name: 'Admin Office', avatar: 'AO', role: 'Front Office', lastMessage: '3 new admission enquiries logged today.', lastTime: '2 days ago', unread: 0, online: true, pinned: false, type: 'staff' },
]

export interface Message {
  id: string
  sender: 'me' | 'them'
  text: string
  time: string
  status?: 'sent' | 'delivered' | 'read'
}

export const messageThread: Record<string, Message[]> = {
  C01: [
    { id: 'M01', sender: 'them', text: 'Good morning, Ma\'am. I\'ve completed the Unit Test 3 marking for Class 2-A Mathematics.', time: '09:12 AM' },
    { id: 'M02', sender: 'them', text: 'Overall class average is 78%. Top scorer is Myra Iyer with 48/50.', time: '09:13 AM' },
    { id: 'M03', sender: 'me', text: 'Excellent work, Rohan! Please publish the results and send me the analysis report.', time: '09:20 AM', status: 'read' },
    { id: 'M04', sender: 'them', text: 'Will do. I noticed 3 students scored below 60% — should I schedule remedial sessions?', time: '09:22 AM' },
    { id: 'M05', sender: 'me', text: 'Yes, please coordinate with their parents. Let\'s discuss in the staff meeting at 3 PM.', time: '09:25 AM', status: 'read' },
    { id: 'M06', sender: 'them', text: 'Submitted the Unit Test 3 marks, please review.', time: '10:45 AM' },
  ],
  C02: [
    { id: 'M01', sender: 'me', text: 'Dear Parents, the Primary PTM is scheduled for Saturday, 7th December from 9 AM to 12 PM. Please be on time.', time: '08:00 AM', status: 'read' },
    { id: 'M02', sender: 'them', text: 'Mrs. Sharma: Thank you for the PTM update! Will be there.', time: '08:15 AM' },
    { id: 'M03', sender: 'them', text: 'Mr. Patel: Can we get a specific time slot to avoid waiting?', time: '08:30 AM' },
    { id: 'M04', sender: 'me', text: 'Mr. Patel — slots are first-come-first-serve but we\'ll try to keep it under 10 min per family.', time: '08:45 AM', status: 'read' },
  ],
  C04: [
    { id: 'M01', sender: 'them', text: 'Good morning Ma\'am, this is Vikram, Aarav\'s father.', time: '11:30 AM' },
    { id: 'M02', sender: 'them', text: 'When is the next parent-teacher meeting?', time: '11:31 AM' },
    { id: 'M03', sender: 'me', text: 'Hello Mr. Sharma! The primary PTM is on 7th December, 9 AM–12 PM. Looking forward to discussing Aarav\'s excellent progress.', time: '11:45 AM', status: 'read' },
  ],
}

export const messageStats = {
  total: 142,
  unread: 8,
  starred: 12,
  archived: 34,
  sentToday: 18,
  responseRate: 94,
  avgResponseTime: '12 min',
}

export const messageFolders = [
  { id: 'inbox', label: 'Inbox', icon: 'Inbox', count: 8 },
  { id: 'starred', label: 'Starred', icon: 'Star', count: 12 },
  { id: 'sent', label: 'Sent', icon: 'Send', count: 0 },
  { id: 'drafts', label: 'Drafts', icon: 'FileText', count: 3 },
  { id: 'archive', label: 'Archive', icon: 'Archive', count: 0 },
]
