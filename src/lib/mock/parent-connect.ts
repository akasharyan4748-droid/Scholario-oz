// Parent connect data — teacher-parent messaging

export interface ParentConversation {
  id: string
  parentName: string
  avatar: string
  studentName: string
  rollNo: string
  relationship: string
  lastMessage: string
  lastTime: string
  unread: number
  online: boolean
  pinned: boolean
  phone: string
  category: 'academic' | 'behavior' | 'attendance' | 'general' | 'urgent'
}

export const parentConversations: ParentConversation[] = [
  { id: 'PC01', parentName: 'Vikram Sharma', avatar: 'VS', studentName: 'Aarav Sharma', rollNo: '18', relationship: 'Father', lastMessage: 'Thank you sir! Aarav is excited about the math test.', lastTime: '5 min ago', unread: 2, online: true, pinned: true, phone: '+91 99800 89017', category: 'academic' },
  { id: 'PC02', parentName: 'Nikhil Patel', avatar: 'NP', studentName: 'Diya Patel', rollNo: '02', relationship: 'Father', lastMessage: 'Diya will be late tomorrow — doctor appointment.', lastTime: '32 min ago', unread: 1, online: false, pinned: true, phone: '+91 98201 23456', category: 'attendance' },
  { id: 'PC03', parentName: 'Karthik Reddy', avatar: 'KR', studentName: 'Vivaan Reddy', rollNo: '03', relationship: 'Father', lastMessage: 'Noted sir. We\'ll ensure homework is completed.', lastTime: '1 hr ago', unread: 0, online: false, pinned: false, phone: '+91 98300 34567', category: 'academic' },
  { id: 'PC04', parentName: 'Sneha Patel', avatar: 'SP', studentName: 'Diya Patel', rollNo: '02', relationship: 'Mother', lastMessage: 'How is Diya doing in class? Any concerns?', lastTime: '3 hrs ago', unread: 0, online: true, pinned: false, phone: '+91 98201 23456', category: 'general' },
  { id: 'PC05', parentName: 'Sandeep Kumar', avatar: 'SK', studentName: 'Reyansh Kumar', rollNo: '05', relationship: 'Father', lastMessage: 'Sorry for the absence. Will send a leave note.', lastTime: '5 hrs ago', unread: 0, online: false, pinned: false, phone: '+91 98500 56789', category: 'attendance' },
  { id: 'PC06', parentName: 'Sriram Iyer', avatar: 'SI', studentName: 'Myra Iyer', rollNo: '10', relationship: 'Father', lastMessage: 'Myra loved the quiz competition! Thanks for the opportunity.', lastTime: 'Yesterday', unread: 0, online: true, pinned: false, phone: '+91 99000 01234', category: 'general' },
  { id: 'PC07', parentName: 'Harish Khanna', avatar: 'HK', studentName: 'Kabir Khanna', rollNo: '11', relationship: 'Father', lastMessage: 'We\'d like to discuss Kabir\'s attendance. When are you free?', lastTime: 'Yesterday', unread: 1, online: false, pinned: false, phone: '+91 99100 12340', category: 'urgent' },
  { id: 'PC08', parentName: 'Meera Singh', avatar: 'MS', studentName: 'Ananya Singh', rollNo: '04', relationship: 'Mother', lastMessage: 'Thank you for the positive feedback about Ananya!', lastTime: '2 days ago', unread: 0, online: false, pinned: false, phone: '+91 98400 45678', category: 'behavior' },
]

export interface ParentMessage {
  id: string
  sender: 'me' | 'parent'
  text: string
  time: string
  status?: 'sent' | 'delivered' | 'read'
}

export const parentThreads: Record<string, ParentMessage[]> = {
  PC01: [
    { id: 'PM01', sender: 'me', text: 'Good morning Mr. Sharma! Aarav scored 48/50 in the Maths Unit Test. Excellent performance!', time: '09:30 AM', status: 'read' },
    { id: 'PM02', sender: 'parent', text: 'Wonderful news sir! We are so proud of Aarav.', time: '09:45 AM' },
    { id: 'PM03', sender: 'me', text: 'He has shown great improvement in subtraction concepts too. Keep encouraging him at home.', time: '09:48 AM', status: 'read' },
    { id: 'PM04', sender: 'parent', text: 'Thank you sir! Aarav is excited about the math test.', time: '10:15 AM' },
  ],
  PC02: [
    { id: 'PM01', sender: 'parent', text: 'Good morning sir, Diya has a doctor appointment tomorrow morning.', time: '08:20 AM' },
    { id: 'PM02', sender: 'parent', text: 'Diya will be late tomorrow — doctor appointment.', time: '08:21 AM' },
    { id: 'PM03', sender: 'me', text: 'No problem Mr. Patel. Please send a note when she arrives. We\'ll help her catch up on missed work.', time: '08:35 AM', status: 'read' },
  ],
  PC07: [
    { id: 'PM01', sender: 'parent', text: 'Good evening sir, this is Harish — Kabir\'s father.', time: '06:00 PM' },
    { id: 'PM02', sender: 'parent', text: 'We\'d like to discuss Kabir\'s attendance. When are you free?', time: '06:02 PM' },
  ],
}

export const parentConnectStats = {
  totalParents: 18,
  activeChats: 8,
  unreadMessages: 4,
  responseRate: 96,
  avgResponseTime: '18 min',
  messagesToday: 24,
  urgentCount: 1,
  satisfactionRate: 94,
  weeklyActivity: [
    { day: 'Mon', count: 18 }, { day: 'Tue', count: 24 },
    { day: 'Wed', count: 14 }, { day: 'Thu', count: 28 },
    { day: 'Fri', count: 22 }, { day: 'Sat', count: 8 },
    { day: 'Sun', count: 4 },
  ],
  categoryBreakdown: [
    { name: 'Academic', value: 42, color: 'oklch(0.55 0.14 162)' },
    { name: 'Attendance', value: 18, color: 'oklch(0.65 0.16 75)' },
    { name: 'Behavior', value: 12, color: 'oklch(0.6 0.18 300)' },
    { name: 'General', value: 28, color: 'oklch(0.7 0.15 200)' },
    { name: 'Urgent', value: 4, color: 'oklch(0.62 0.2 25)' },
  ],
}

export const quickReplyTemplates = [
  { id: 'QR1', label: 'Appreciation', text: 'I want to appreciate your child\'s excellent performance today. Keep it up!' },
  { id: 'QR2', label: 'Homework Reminder', text: 'Gentle reminder to ensure your child completes today\'s homework. Thank you!' },
  { id: 'QR3', label: 'Attendance Note', text: 'Please send a leave note if your child is absent. It helps us track attendance.' },
  { id: 'QR4', label: 'PTM Invite', text: 'You are cordially invited for the Parent-Teacher Meeting. Looking forward to meeting you!' },
  { id: 'QR5', label: 'Progress Update', text: 'Your child is showing good progress. Let\'s continue working together for their success.' },
]
