'use client'

// ============================================================
// STUDENT MESSAGING STORE — student ↔ teacher direct messages
// ------------------------------------------------------------
// Conversations are restricted to the student's OWN class teacher
// and subject teachers (the recipient picker derives that list from
// the students-store class record — never a school-wide directory).
//
// Unread is DERIVED honestly: a conversation is unread while its
// LAST message is from a teacher AND the student has not opened the
// thread since (seenAt). No fabricated teacher auto-replies — the
// teacher side of a thread only grows through seeds/manual writes.
//
// Tenant-scoped persistence (SaaS-STAGE-2A): the storage adapter
// namespaces by active tenant, same pattern as every other store.
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createTenantScopedStorage } from '@/lib/tenant/tenant-storage'

// ─── Entities ────────────────────────────────────────────────────────

export interface StudentMessage {
  id: string
  from: 'student' | 'teacher'
  body: string
  sentOn: string
}

export interface StudentConversation {
  id: string
  teacherId: string
  teacherName: string
  /** Subject the teacher teaches (e.g. 'Mathematics'). */
  teacherSubject: string
  /** Thread subject line (e.g. 'Maths homework — Unit 3'). */
  subject: string
  messages: StudentMessage[]
  lastOn: string
}

export interface StartConversationInput {
  teacherId: string
  teacherName: string
  teacherSubject: string
  subject: string
  body: string
}

interface StudentMessagingState {
  conversations: StudentConversation[]
  /** conversationId → ISO time the student last opened the thread. */
  seenAt: Record<string, string>
  sendMessage: (conversationId: string, body: string) => { ok: boolean; error?: string }
  startConversation: (input: StartConversationInput) => { ok: true; conversation: StudentConversation } | { ok: false; error: string }
  markConversationSeen: (conversationId: string) => void
  markAllRead: () => void
}

// ─── Seed ────────────────────────────────────────────────────────────

const HOUR = 3_600_000
const DAY = 24 * HOUR
const ago = (ms: number) => new Date(Date.now() - ms).toISOString()

function seedConversations(): StudentConversation[] {
  return [
    {
      id: 'SC-01',
      teacherId: 'T-014',
      teacherName: 'Rohan Mehta',
      teacherSubject: 'Mathematics',
      subject: 'Maths homework — Unit 3',
      messages: [
        { id: 'SM-101', from: 'teacher', body: 'Namaste! Please practise the multiplication tables exercise on page 42 before Friday.', sentOn: ago(2 * DAY) },
        { id: 'SM-102', from: 'student', body: 'Yes sir, I have started it.', sentOn: ago(DAY) },
        { id: 'SM-103', from: 'teacher', body: 'Great! Bring your notebook tomorrow, I will check the first 10 sums.', sentOn: ago(3 * HOUR) },
      ],
      lastOn: ago(3 * HOUR),
    },
    {
      id: 'SC-02',
      teacherId: 'T-011',
      teacherName: 'Kavita Joshi',
      teacherSubject: 'Science',
      subject: 'Science project — plant life cycle',
      messages: [
        { id: 'SM-201', from: 'teacher', body: 'Your group needs to submit the plant life cycle chart by Wednesday. Let me know if you need chart paper.', sentOn: ago(DAY) },
      ],
      lastOn: ago(DAY),
    },
  ]
}

const nowIso = () => new Date().toISOString()
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

// ─── Unread derivation (single source of truth) ─────────────────────

/**
 * A conversation is unread while its LAST message is from a teacher and
 * the student has not opened the thread since that message arrived.
 */
export function isConversationUnread(conversation: StudentConversation, seenAt: Record<string, string>): boolean {
  const last = conversation.messages[conversation.messages.length - 1]
  if (!last || last.from !== 'teacher') return false
  const seen = seenAt[conversation.id]
  if (!seen) return true
  return new Date(conversation.lastOn).getTime() > new Date(seen).getTime()
}

export function countUnreadConversations(conversations: StudentConversation[], seenAt: Record<string, string>): number {
  return conversations.filter((c) => isConversationUnread(c, seenAt)).length
}

// ─── Store ───────────────────────────────────────────────────────────

export const useStudentMessagingStore = create<StudentMessagingState>()(
  persist(
    (set, get) => ({
      conversations: seedConversations(),
      seenAt: {},

      sendMessage: (conversationId, body) => {
        const text = body.trim()
        if (!text) return { ok: false, error: 'Message cannot be empty.' }
        const conversation = get().conversations.find((c) => c.id === conversationId)
        if (!conversation) return { ok: false, error: 'Conversation not found.' }
        const message: StudentMessage = {
          id: newId('SM'),
          from: 'student',
          body: text,
          sentOn: nowIso(),
        }
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, message], lastOn: message.sentOn }
              : c,
          ),
        }))
        return { ok: true }
      },

      startConversation: ({ teacherId, teacherName, teacherSubject, subject, body }) => {
        const text = body.trim()
        const subjectLine = subject.trim()
        if (!teacherId || !subjectLine || !text) {
          return { ok: false, error: 'Recipient, subject and message are all required.' }
        }
        const message: StudentMessage = {
          id: newId('SM'),
          from: 'student',
          body: text,
          sentOn: nowIso(),
        }
        const conversation: StudentConversation = {
          id: newId('SC'),
          teacherId,
          teacherName,
          teacherSubject,
          subject: subjectLine,
          messages: [message],
          lastOn: message.sentOn,
        }
        set((s) => ({ conversations: [conversation, ...s.conversations] }))
        return { ok: true, conversation }
      },

      markConversationSeen: (conversationId) => {
        set((s) => {
          const prev = s.seenAt[conversationId]
          const stamp = nowIso()
          if (prev && new Date(prev).getTime() >= new Date(stamp).getTime()) return s
          return { seenAt: { ...s.seenAt, [conversationId]: stamp } }
        })
      },

      markAllRead: () => {
        // Flips the seen flag for every conversation — unread is derived
        // (last message from teacher + not seen since), so marking every
        // thread seen is the honest "mark all read".
        set((s) => {
          const stamp = nowIso()
          const seenAt: Record<string, string> = { ...s.seenAt }
          for (const c of s.conversations) seenAt[c.id] = stamp
          return { seenAt }
        })
      },
    }),
    {
      name: 'scholario-student-messages-v1',
      storage: createTenantScopedStorage('scholario-student-messages-v1'),
      version: 1,
      partialize: (s) => ({
        conversations: s.conversations,
        seenAt: s.seenAt,
      }),
    },
  ),
)
