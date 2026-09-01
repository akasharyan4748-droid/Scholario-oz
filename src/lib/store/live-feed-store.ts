'use client'

import { create } from 'zustand'

/**
 * live-feed-store — in-memory ring of realtime stream events.
 *
 * The AppShell's socket.io subscription (mini-services/event-stream :3003)
 * pushes every in-scope `school-event` frame here, and any surface can
 * subscribe without opening a second connection. The principal dashboard's
 * Live Activity ticker is the primary consumer.
 *
 * NOT persisted: a live feed is, by definition, only meaningful while the
 * tab is open. Reconnecting simply resumes appending.
 */

export type LiveFeedKind = 'payment' | 'announcement' | 'message'

export interface LiveFeedEvent {
  id: string
  kind: LiveFeedKind
  title: string
  detail: string
  /** payment events: paise-free rupee amount */
  amount?: number
  /** payment events: raw channel code (UPI/CARD/…) */
  method?: string
  /** epoch ms string from the stream frame */
  at: string
  /** local receive time (epoch ms) — powers relative timestamps */
  seenAt: number
}

interface LiveFeedState {
  events: LiveFeedEvent[]
  connected: boolean
  lastEventAt: number | null
  setConnected: (v: boolean) => void
  push: (evt: Omit<LiveFeedEvent, 'id' | 'seenAt'> & { id?: string }) => void
  clear: () => void
}

const MAX_EVENTS = 14

export const useLiveFeedStore = create<LiveFeedState>((set) => ({
  events: [],
  connected: false,
  lastEventAt: null,
  setConnected: (connected) => set({ connected }),
  push: (evt) =>
    set((s) => ({
      lastEventAt: Date.now(),
      events: [
        {
          ...evt,
          id: evt.id ?? `${evt.kind}-${evt.at}-${Math.random().toString(36).slice(2, 7)}`,
          seenAt: Date.now(),
        },
        ...s.events,
      ].slice(0, MAX_EVENTS),
    })),
  clear: () => set({ events: [], lastEventAt: null }),
}))
