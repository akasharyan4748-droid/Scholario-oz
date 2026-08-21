'use client'

/**
 * ComposeModal — recipient picker + message composer.
 *
 * - Searchable recipient picker (teachers/parents/groups from canonical data)
 * - Message text area
 * - Send button creates a new conversation OR opens an existing one (incl. groups)
 * - Supports `preselectedRecipient` so callers (GroupsPanel) can pre-fill the
 *   recipient — the user still sees the selected chip and can change it.
 */

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Send, X, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMessagingStore, getRecipientOptions, type ConversationType } from '@/lib/store/messaging-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  /** Optional recipient name to pre-fill the picker with. */
  preselectedRecipient?: string | null
}

export function ComposeModal({ open, onClose, preselectedRecipient }: Props) {
  const composeNew = useMessagingStore((s) => s.composeNew)
  const sendMessage = useMessagingStore((s) => s.sendMessage)
  const conversations = useMessagingStore((s) => s.conversations)
  const groups = useMessagingStore((s) => s.groups)
  const openConversation = useMessagingStore((s) => s.openConversation)
  const setActiveFolder = useMessagingStore((s) => s.setActiveFolder)
  const saveNewDraft = useMessagingStore((s) => s.saveNewDraft)
  const [search, setSearch] = useState('')
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null)
  const [text, setText] = useState('')

  // Recompute recipients whenever groups change (so new groups appear)
  const recipients = useMemo(() => getRecipientOptions(), [groups])

  const filtered = useMemo(() => {
    if (!search) return recipients.slice(0, 10)
    const q = search.toLowerCase()
    return recipients.filter((r) => r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q)).slice(0, 15)
  }, [recipients, search])

  useEffect(() => {
    if (open) {
      setSearch('')
      setText('')
      setSelectedRecipient(preselectedRecipient ?? null)
    }
  }, [open, preselectedRecipient])

  const handleSend = () => {
    if (!selectedRecipient) { toast.error('Select a recipient'); return }
    if (!text.trim()) { toast.error('Write a message'); return }

    // If a conversation already exists for this recipient, send directly to it
    // (covers existing group conversations and seeded staff/parent threads).
    const existing = conversations.find((c) => c.name === selectedRecipient && !c.archived)
    if (existing) {
      sendMessage(existing.id, text)
      openConversation(existing.id)
      // If the existing conversation is a group, jump to the Groups folder
      if (existing.type === 'group') setActiveFolder('groups')
      else setActiveFolder('inbox')
      toast.success('Message sent', { description: `To ${selectedRecipient}` })
      onClose()
      return
    }

    // Otherwise compose a new conversation
    composeNew(selectedRecipient, text)
    toast.success('Message sent', { description: `To ${selectedRecipient}` })
    onClose()
  }

  const handleSaveDraft = () => {
    if (!text.trim()) { onClose(); return }
    saveNewDraft(selectedRecipient ?? '(no recipient)', text)
    toast.success('Draft saved')
    onClose()
  }

  const selectedRecipientData = recipients.find((r) => r.name === selectedRecipient)
  const isGroupRecipient = selectedRecipientData?.type === 'group'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleSaveDraft}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold">New Message</h3>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSaveDraft}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Recipient search */}
              {!selectedRecipient ? (
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1 block">To</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search teachers, parents, or groups…"
                      className="w-full h-9 pl-8 pr-3 text-xs rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="mt-2 space-y-1 max-h-[280px] overflow-y-auto">
                    {filtered.map((r) => (
                      <button
                        key={`${r.type}-${r.name}`}
                        onClick={() => setSelectedRecipient(r.name)}
                        className="w-full flex items-center gap-2.5 rounded-md border border-border/40 hover:border-primary/40 hover:bg-muted/30 px-2.5 py-2 transition-colors text-left"
                      >
                        <div className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-semibold',
                          r.type === 'staff' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                          r.type === 'parent' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                          'bg-gradient-to-br from-violet-500 to-purple-600',
                        )}>
                          {r.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{r.name}</p>
                          <p className="text-[9px] text-muted-foreground truncate">{r.role}</p>
                        </div>
                        {r.type === 'group' && <Users className="h-3 w-3 text-muted-foreground shrink-0" />}
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <p className="text-center text-[10px] text-muted-foreground py-4">No recipients found</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Selected recipient */}
                  <div className="flex items-center gap-2.5 rounded-md bg-muted/30 px-2.5 py-2">
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-semibold',
                      selectedRecipientData?.type === 'staff' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                      selectedRecipientData?.type === 'parent' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                      'bg-gradient-to-br from-violet-500 to-purple-600',
                    )}>
                      {selectedRecipientData?.avatar ?? '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{selectedRecipient}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{selectedRecipientData?.role}</p>
                    </div>
                    <button
                      onClick={() => setSelectedRecipient(null)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {isGroupRecipient && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> Sending to the whole group — every member will see your message.
                    </p>
                  )}

                  {/* Message */}
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1 block">Message</label>
                    <textarea
                      autoFocus
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend() }}
                      placeholder="Write your message…"
                      rows={4}
                      className="w-full text-xs rounded-md border border-border bg-card px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleSaveDraft}>Save as Draft</Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleSend}
                disabled={!selectedRecipient || !text.trim()}
              >
                <Send className="h-3.5 w-3.5" /> Send
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
