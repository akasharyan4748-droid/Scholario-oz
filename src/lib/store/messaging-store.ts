/**
 * Messaging store — Zustand store for the Messages & Inbox module.
 *
 * One connected messaging system:
 *   Conversations → Messages → Send/Reply → Star/Archive/Draft
 *
 * Recipient data comes from canonical Teachers + Students (for parents).
 * No fake "online" status — we use role/department labels instead.
 * No fake "read receipts" or "typing" indicators.
 *
 * Folders: Inbox · Starred · Sent · Drafts · Archive
 * Labels: Staff · Parents · Groups · Urgent (all functional filters)
 *
 * State mutations:
 *   - sendMessage (creates/replies to conversation)
 *   - markRead (clears unread on open)
 *   - starConversation / unstarConversation
 *   - archiveConversation / unarchiveConversation
 *   - saveDraft / deleteDraft / sendDraft
 *   - markUrgent
 *   - composeNew (recipient picker)
 */

import { create } from 'zustand'
import { teachers } from '@/lib/mock/teachers'
import { useStudentsStore } from '@/lib/store/students-store'

// ─── Types ───────────────────────────────────────────────────────────

export type ConversationType = 'staff' | 'parent' | 'group'
export type Folder = 'inbox' | 'starred' | 'sent' | 'drafts' | 'archive'
export type Label = 'Staff' | 'Parents' | 'Groups' | 'Urgent'
export type MessageStatus = 'sent' | 'delivered'

export interface Message {
  id: string
  conversationId: string
  sender: 'me' | 'them'
  senderName?: string // for group messages
  text: string
  timestamp: string // ISO string
  status?: MessageStatus
}

export interface Conversation {
  id: string
  name: string
  avatar: string
  role: string // e.g. "Senior Teacher · Maths" or "Parent · Aarav Sharma" or "Group · 18 members"
  type: ConversationType
  lastMessage: string
  lastTimestamp: string // ISO string
  unread: number
  starred: boolean
  archived: boolean
  urgent: boolean
  // For parent conversations — linked student
  studentName?: string
  studentClass?: string
  // For group conversations
  memberCount?: number
  // For staff — linked teacher
  teacherId?: string
}

export interface Draft {
  id: string
  conversationId?: string // if replying to existing
  recipientName?: string // if composing new
  text: string
  timestamp: string
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const day = Math.floor(hr / 24)
  if (day === 1) return 'yesterday'
  if (day < 7) return `${day} days ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// ─── Seed Conversations (connected to canonical data) ───────────────

const SEED_CONVERSATIONS: Conversation[] = [
  // Staff conversations — linked to real teachers
  { id: 'C01', name: 'Rohan Mehta', avatar: 'RM', role: 'Senior Teacher · Maths', type: 'staff', lastMessage: 'Submitted the Unit Test 3 marks, please review.', lastTimestamp: new Date(Date.now() - 2 * 60000).toISOString(), unread: 2, starred: true, archived: false, urgent: false, teacherId: 'T-014' },
  { id: 'C03', name: 'Pooja Bhatt', avatar: 'PB', role: 'HoD Science', type: 'staff', lastMessage: 'Lab equipment needs restocking — 4 microscopes down.', lastTimestamp: new Date(Date.now() - 60 * 60000).toISOString(), unread: 1, starred: false, archived: false, urgent: true, teacherId: 'T-038' },
  { id: 'C05', name: 'Rajesh Khanna', avatar: 'RK', role: 'HoD Mathematics', type: 'staff', lastMessage: 'Pre-board timetable draft attached for approval.', lastTimestamp: new Date(Date.now() - 5 * 60 * 60000).toISOString(), unread: 0, starred: false, archived: false, urgent: false, teacherId: 'T-035' },
  { id: 'C06', name: 'Suresh Pillai', avatar: 'SP', role: 'Teacher · Social Sci', type: 'staff', lastMessage: 'On medical leave till Friday, sub arranged.', lastTimestamp: new Date(Date.now() - 26 * 60 * 60000).toISOString(), unread: 0, starred: false, archived: false, urgent: false, teacherId: 'T-029' },
  { id: 'C08', name: 'Admin Office', avatar: 'AO', role: 'Front Office', type: 'staff', lastMessage: '3 new admission enquiries logged today.', lastTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(), unread: 0, starred: false, archived: false, urgent: false },

  // Parent conversations — linked to students
  { id: 'C04', name: 'Vikram Sharma', avatar: 'VS', role: 'Parent · Aarav Sharma', type: 'parent', lastMessage: 'When is the next parent-teacher meeting?', lastTimestamp: new Date(Date.now() - 3 * 60 * 60000).toISOString(), unread: 0, starred: false, archived: false, urgent: false, studentName: 'Aarav Sharma', studentClass: 'Class 9-A' },
  { id: 'C07', name: 'Nikhil Patel', avatar: 'NP', role: 'Parent · Diya Patel', type: 'parent', lastMessage: 'Diya will be late today due to a doctor appointment.', lastTimestamp: new Date(Date.now() - 26 * 60 * 60000).toISOString(), unread: 0, starred: false, archived: false, urgent: false, studentName: 'Diya Patel', studentClass: 'Class 9-A' },

  // Group conversations — linked to class structure
  { id: 'C02', name: 'Class 2-A Parents', avatar: '2A', role: 'Group · 18 members', type: 'group', lastMessage: 'Mrs. Sharma: Thank you for the PTM update!', lastTimestamp: new Date(Date.now() - 18 * 60000).toISOString(), unread: 5, starred: true, archived: false, urgent: false, memberCount: 18 },
  { id: 'C09', name: 'Science Department', avatar: 'SD', role: 'Group · 6 members', type: 'group', lastMessage: 'Kavita: Lab safety protocols updated for Term 2.', lastTimestamp: new Date(Date.now() - 4 * 60 * 60000).toISOString(), unread: 0, starred: false, archived: false, urgent: false, memberCount: 6 },
  { id: 'C10', name: 'Class 10 Teachers', avatar: '10T', role: 'Group · 8 members', type: 'group', lastMessage: 'Rajesh: Pre-board exam preparation meeting tomorrow.', lastTimestamp: new Date(Date.now() - 8 * 60 * 60000).toISOString(), unread: 3, starred: false, archived: false, urgent: true, memberCount: 8 },

  // Archived
  { id: 'C11', name: 'Deepa Menon', avatar: 'DM', role: 'Senior Teacher · English', type: 'staff', lastMessage: 'PTM preparation notes shared.', lastTimestamp: new Date(Date.now() - 5 * 24 * 60 * 60000).toISOString(), unread: 0, starred: false, archived: true, urgent: false, teacherId: 'T-020' },
]

const SEED_MESSAGES: Record<string, Message[]> = {
  C01: [
    { id: 'M01', conversationId: 'C01', sender: 'them', text: "Good morning, Ma'am. I've completed the Unit Test 3 marking for Class 2-A Mathematics.", timestamp: new Date(Date.now() - 90 * 60000).toISOString() },
    { id: 'M02', conversationId: 'C01', sender: 'them', text: 'Overall class average is 78%. Top scorer is Myra Iyer with 48/50.', timestamp: new Date(Date.now() - 88 * 60000).toISOString() },
    { id: 'M03', conversationId: 'C01', sender: 'me', text: 'Excellent work, Rohan! Please publish the results and send me the analysis report.', timestamp: new Date(Date.now() - 80 * 60000).toISOString(), status: 'delivered' },
    { id: 'M04', conversationId: 'C01', sender: 'them', text: 'Will do. I noticed 3 students scored below 60% — should I schedule remedial sessions?', timestamp: new Date(Date.now() - 78 * 60000).toISOString() },
    { id: 'M05', conversationId: 'C01', sender: 'me', text: "Yes, please coordinate with their parents. Let's discuss in the staff meeting at 3 PM.", timestamp: new Date(Date.now() - 75 * 60000).toISOString(), status: 'delivered' },
    { id: 'M06', conversationId: 'C01', sender: 'them', text: 'Submitted the Unit Test 3 marks, please review.', timestamp: new Date(Date.now() - 2 * 60000).toISOString() },
  ],
  C02: [
    { id: 'M01', conversationId: 'C02', sender: 'me', text: 'Dear Parents, the Primary PTM is scheduled for Saturday, 7th December from 9 AM to 12 PM. Please be on time.', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), status: 'delivered' },
    { id: 'M02', conversationId: 'C02', sender: 'them', senderName: 'Mrs. Sharma', text: 'Thank you for the PTM update! Will be there.', timestamp: new Date(Date.now() - 18 * 60000).toISOString() },
    { id: 'M03', conversationId: 'C02', sender: 'them', senderName: 'Mr. Patel', text: 'Can we get a specific time slot to avoid waiting?', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: 'M04', conversationId: 'C02', sender: 'me', text: "Mr. Patel — slots are first-come-first-serve but we'll try to keep it under 10 min per family.", timestamp: new Date(Date.now() - 12 * 60000).toISOString(), status: 'delivered' },
  ],
  C03: [
    { id: 'M01', conversationId: 'C03', sender: 'them', text: 'Lab equipment needs restocking — 4 microscopes down.', timestamp: new Date(Date.now() - 60 * 60000).toISOString() },
    { id: 'M02', conversationId: 'C03', sender: 'them', text: 'Can we approve the procurement request by Friday?', timestamp: new Date(Date.now() - 58 * 60000).toISOString() },
  ],
  C04: [
    { id: 'M01', conversationId: 'C04', sender: 'them', text: "Good morning Ma'am, this is Vikram, Aarav's father.", timestamp: new Date(Date.now() - 4 * 60 * 60000).toISOString() },
    { id: 'M02', conversationId: 'C04', sender: 'them', text: 'When is the next parent-teacher meeting?', timestamp: new Date(Date.now() - 3 * 60 * 60000).toISOString() },
    { id: 'M03', conversationId: 'C04', sender: 'me', text: "Hello Mr. Sharma! The primary PTM is on 7th December, 9 AM–12 PM. Looking forward to discussing Aarav's excellent progress.", timestamp: new Date(Date.now() - 2.5 * 60 * 60000).toISOString(), status: 'delivered' },
  ],
  C05: [
    { id: 'M01', conversationId: 'C05', sender: 'them', text: 'Pre-board timetable draft attached for approval.', timestamp: new Date(Date.now() - 5 * 60 * 60000).toISOString() },
  ],
  C10: [
    { id: 'M01', conversationId: 'C10', sender: 'them', senderName: 'Rajesh Khanna', text: 'Pre-board exam preparation meeting tomorrow at 2 PM in the staff room.', timestamp: new Date(Date.now() - 8 * 60 * 60000).toISOString() },
    { id: 'M02', conversationId: 'C10', sender: 'them', senderName: 'Pooja Bhatt', text: 'I will share the science practical schedule after the meeting.', timestamp: new Date(Date.now() - 7 * 60 * 60000).toISOString() },
    { id: 'M03', conversationId: 'C10', sender: 'them', senderName: 'Deepa Menon', text: 'Should we also discuss the answer sheet evaluation rubric?', timestamp: new Date(Date.now() - 6.5 * 60 * 60000).toISOString() },
  ],
}

const SEED_DRAFTS: Draft[] = [
  { id: 'D01', conversationId: 'C03', text: 'Yes, I will approve the procurement request today. Please send the vendor details.', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 'D02', conversationId: 'C10', text: 'Yes, please include the rubric discussion in the agenda.', timestamp: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: 'D03', recipientName: 'Accounts Office', text: 'Please share the Q3 expense summary for the board meeting.', timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString() },
]

// ─── Zustand Store ───────────────────────────────────────────────────

interface MessagingState {
  conversations: Conversation[]
  messages: Record<string, Message[]>
  drafts: Draft[]
  activeConversationId: string | null
  activeFolder: Folder
  activeLabel: Label | null
  searchQuery: string

  // actions
  setActiveFolder: (folder: Folder) => void
  setActiveLabel: (label: Label | null) => void
  setSearchQuery: (query: string) => void
  openConversation: (id: string) => void
  sendMessage: (conversationId: string, text: string) => void
  starConversation: (id: string) => void
  archiveConversation: (id: string) => void
  unarchiveConversation: (id: string) => void
  markUrgent: (id: string) => void
  saveDraft: (conversationId: string, text: string) => void
  saveNewDraft: (recipientName: string, text: string) => void
  deleteDraft: (id: string) => void
  sendDraft: (id: string) => void
  composeNew: (recipientName: string, text: string) => void

  // selectors
  getFilteredConversations: () => Conversation[]
  getUnreadCount: () => number
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  conversations: SEED_CONVERSATIONS,
  messages: SEED_MESSAGES,
  drafts: SEED_DRAFTS,
  activeConversationId: 'C01',
  activeFolder: 'inbox',
  activeLabel: null,
  searchQuery: '',

  setActiveFolder: (folder) => set({ activeFolder: folder, activeLabel: null }),
  setActiveLabel: (label) => set({ activeLabel: label }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  openConversation: (id) => {
    const state = get()
    const convo = state.conversations.find((c) => c.id === id)
    if (!convo) return
    set({
      activeConversationId: id,
      conversations: state.conversations.map((c) => c.id === id ? { ...c, unread: 0 } : c),
    })
  },

  sendMessage: (conversationId, text) => {
    const state = get()
    if (!text.trim()) return
    const newMsg: Message = {
      id: `M${Date.now()}`,
      conversationId,
      sender: 'me',
      text: text.trim(),
      timestamp: new Date().toISOString(),
      status: 'sent',
    }
    const existingMessages = state.messages[conversationId] ?? []
    set({
      messages: {
        ...state.messages,
        [conversationId]: [...existingMessages, newMsg],
      },
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessage: text.trim(), lastTimestamp: new Date().toISOString(), unread: 0 }
          : c,
      ),
    })

    // Simulate delivered status after 800ms
    setTimeout(() => {
      const currentState = get()
      set({
        messages: {
          ...currentState.messages,
          [conversationId]: (currentState.messages[conversationId] ?? []).map((m) =>
            m.id === newMsg.id ? { ...m, status: 'delivered' as MessageStatus } : m,
          ),
        },
      })
    }, 800)

    // Simulate auto-reply for staff/parent conversations after 3.5s
    const convo = state.conversations.find((c) => c.id === conversationId)
    if (convo && (convo.type === 'staff' || convo.type === 'parent')) {
      const replies = [
        'Thank you, Ma\'am. I will follow up on this.',
        'Noted. Will get back to you shortly.',
        'Understood. I will take care of it.',
        'Thanks for the update. Let me check and confirm.',
        'Got it. Will coordinate accordingly.',
      ]
      setTimeout(() => {
        const replyState = get()
        const reply: Message = {
          id: `M${Date.now() + 1}`,
          conversationId,
          sender: 'them',
          senderName: convo.type === 'group' ? convo.name.split(' ')[0] : undefined,
          text: replies[Math.floor(Math.random() * replies.length)],
          timestamp: new Date().toISOString(),
        }
        set({
          messages: {
            ...replyState.messages,
            [conversationId]: [...(replyState.messages[conversationId] ?? []), reply],
          },
          conversations: replyState.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, lastMessage: reply.text, lastTimestamp: reply.timestamp }
              : c,
          ),
        })
      }, 3500)
    }
  },

  starConversation: (id) => {
    const state = get()
    set({
      conversations: state.conversations.map((c) => c.id === id ? { ...c, starred: !c.starred } : c),
    })
  },

  archiveConversation: (id) => {
    const state = get()
    set({
      conversations: state.conversations.map((c) => c.id === id ? { ...c, archived: true, starred: false } : c),
      activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
    })
  },

  unarchiveConversation: (id) => {
    const state = get()
    set({
      conversations: state.conversations.map((c) => c.id === id ? { ...c, archived: false } : c),
    })
  },

  markUrgent: (id) => {
    const state = get()
    set({
      conversations: state.conversations.map((c) => c.id === id ? { ...c, urgent: !c.urgent } : c),
    })
  },

  saveDraft: (conversationId, text) => {
    const state = get()
    if (!text.trim()) return
    // Remove existing draft for this conversation
    const filteredDrafts = state.drafts.filter((d) => d.conversationId !== conversationId)
    set({
      drafts: [...filteredDrafts, {
        id: `D${Date.now()}`,
        conversationId,
        text: text.trim(),
        timestamp: new Date().toISOString(),
      }],
    })
  },

  saveNewDraft: (recipientName, text) => {
    const state = get()
    if (!text.trim()) return
    set({
      drafts: [...state.drafts, {
        id: `D${Date.now()}`,
        recipientName,
        text: text.trim(),
        timestamp: new Date().toISOString(),
      }],
    })
  },

  deleteDraft: (id) => {
    const state = get()
    set({ drafts: state.drafts.filter((d) => d.id !== id) })
  },

  sendDraft: (id) => {
    const state = get()
    const draft = state.drafts.find((d) => d.id === id)
    if (!draft) return
    if (draft.conversationId) {
      get().sendMessage(draft.conversationId, draft.text)
    } else if (draft.recipientName) {
      get().composeNew(draft.recipientName, draft.text)
    }
    set({ drafts: state.drafts.filter((d) => d.id !== id) })
  },

  composeNew: (recipientName, text) => {
    const state = get()
    if (!text.trim()) return

    // Check if conversation with this recipient already exists
    const existing = state.conversations.find((c) => c.name === recipientName && !c.archived)
    if (existing) {
      get().sendMessage(existing.id, text)
      set({ activeFolder: 'inbox', activeConversationId: existing.id })
      return
    }

    // Create new conversation
    const id = `C${Date.now()}`
    const isGroup = recipientName.includes('Parents') || recipientName.includes('Department') || recipientName.includes('Teachers')
    const isStaff = !isGroup && teachers.some((t) => t.name === recipientName)
    const teacher = teachers.find((t) => t.name === recipientName)
    const type: ConversationType = isGroup ? 'group' : isStaff ? 'staff' : 'parent'

    const newConvo: Conversation = {
      id,
      name: recipientName,
      avatar: recipientName.split(' ').map((n) => n[0]).slice(0, 2).join(''),
      role: teacher ? `${teacher.designation} · ${teacher.department}` : isGroup ? 'Group' : 'Parent',
      type,
      lastMessage: text.trim(),
      lastTimestamp: new Date().toISOString(),
      unread: 0,
      starred: false,
      archived: false,
      urgent: false,
      teacherId: teacher?.id,
      memberCount: isGroup ? 8 : undefined,
    }

    const newMsg: Message = {
      id: `M${Date.now()}`,
      conversationId: id,
      sender: 'me',
      text: text.trim(),
      timestamp: new Date().toISOString(),
      status: 'sent',
    }

    set({
      conversations: [newConvo, ...state.conversations],
      messages: { ...state.messages, [id]: [newMsg] },
      activeFolder: 'inbox',
      activeConversationId: id,
    })
  },

  getFilteredConversations: () => {
    const state = get()
    let result = state.conversations

    // Folder filter
    switch (state.activeFolder) {
      case 'inbox':
        result = result.filter((c) => !c.archived)
        break
      case 'starred':
        result = result.filter((c) => c.starred && !c.archived)
        break
      case 'sent':
        // Conversations where the last message was sent by me
        result = result.filter((c) => {
          const msgs = state.messages[c.id] ?? []
          return msgs.length > 0 && msgs[msgs.length - 1].sender === 'me' && !c.archived
        })
        break
      case 'drafts':
        // Conversations that have an associated draft
        const draftConvIds = new Set(state.drafts.filter((d) => d.conversationId).map((d) => d.conversationId!))
        result = result.filter((c) => draftConvIds.has(c.id) && !c.archived)
        break
      case 'archive':
        result = result.filter((c) => c.archived)
        break
    }

    // Label filter
    if (state.activeLabel) {
      switch (state.activeLabel) {
        case 'Staff': result = result.filter((c) => c.type === 'staff'); break
        case 'Parents': result = result.filter((c) => c.type === 'parent'); break
        case 'Groups': result = result.filter((c) => c.type === 'group'); break
        case 'Urgent': result = result.filter((c) => c.urgent); break
      }
    }

    // Search filter
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase()
      result = result.filter((c) => {
        if (c.name.toLowerCase().includes(q)) return true
        if (c.lastMessage.toLowerCase().includes(q)) return true
        // Search in message content
        const msgs = state.messages[c.id] ?? []
        return msgs.some((m) => m.text.toLowerCase().includes(q))
      })
    }

    // Sort: starred first, then by latest activity
    return result.sort((a, b) => {
      if (a.starred && !b.starred) return -1
      if (!a.starred && b.starred) return 1
      return new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    })
  },

  getUnreadCount: () => {
    return get().conversations.filter((c) => !c.archived).reduce((sum, c) => sum + c.unread, 0)
  },
}))

// ─── Recipient options (for Compose) ────────────────────────────────

export function getRecipientOptions(): Array<{ name: string; role: string; type: ConversationType; avatar: string }> {
  const students = useStudentsStore.getState().students
  const activeStudents = students.filter((s) => s.status === 'Active')

  const staff = teachers.map((t) => ({
    name: t.name,
    role: `${t.designation} · ${t.department}`,
    type: 'staff' as ConversationType,
    avatar: t.avatar,
  }))

  // Some parents (based on students)
  const parents = activeStudents.slice(0, 8).map((s) => ({
    name: s.fatherName,
    role: `Parent · ${s.name}`,
    type: 'parent' as ConversationType,
    avatar: s.fatherName.split(' ').map((n) => n[0]).slice(0, 2).join(''),
  }))

  // Groups
  const groups = [
    { name: 'Class 2-A Parents', role: 'Group · 18 members', type: 'group' as ConversationType, avatar: '2A' },
    { name: 'Class 10 Teachers', role: 'Group · 8 members', type: 'group' as ConversationType, avatar: '10T' },
    { name: 'Science Department', role: 'Group · 6 members', type: 'group' as ConversationType, avatar: 'SD' },
    { name: 'Mathematics Department', role: 'Group · 5 members', type: 'group' as ConversationType, avatar: 'MD' },
    { name: 'Class 9 Parents', role: 'Group · 42 members', type: 'group' as ConversationType, avatar: '9P' },
    { name: 'All Staff', role: 'Group · 28 members', type: 'group' as ConversationType, avatar: 'AS' },
  ]

  return [...staff, ...parents, ...groups]
}

// ─── Format helpers ──────────────────────────────────────────────────

export { formatTimeAgo, formatMessageTime }
