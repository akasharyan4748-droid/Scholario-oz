'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, X } from 'lucide-react'
import type { QAItem } from '@/lib/mock/peer-collab'
import { toast } from 'sonner'

interface Props {
  onClose: () => void
  onPost: (newQ: QAItem) => void
}

export function NewQuestionModal({ onClose, onPost }: Props) {
  const [questionTitle, setQuestionTitle] = useState('')
  const [questionBody, setQuestionBody] = useState('')

  const handlePostQuestion = () => {
    if (!questionTitle.trim()) {
      toast.error('Please add a question title')
      return
    }
    onPost({
      id: `QA${Date.now()}`,
      question: questionTitle,
      askedBy: 'Aarav Sharma',
      avatar: 'AS',
      subject: 'General',
      askedOn: 'Just now',
      answers: 0,
      upvotes: 0,
      hasAcceptedAnswer: false,
      tags: ['new'],
    })
    setQuestionTitle('')
    setQuestionBody('')
    onClose()
    toast.success('Question posted! 🎉', { description: '+10 XP for participating' })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg rounded-2xl border border-border glass-strong shadow-premium-lg overflow-hidden"
      >
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-5 text-white">
          <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"><X className="h-4 w-4" /></button>
          <h2 className="font-display text-lg font-bold">Ask a Question</h2>
          <p className="text-violet-50/90 text-xs mt-0.5">Your classmates will help you out!</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">Subject</p>
            <select className="w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50">
              <option>Mathematics</option>
              <option>English</option>
              <option>Science</option>
              <option>Hindi</option>
              <option>Computer Science</option>
              <option>General</option>
            </select>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">Question</p>
            <input
              value={questionTitle}
              onChange={(e) => setQuestionTitle(e.target.value)}
              placeholder="What's your question?"
              className="w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">Details (optional)</p>
            <textarea
              value={questionBody}
              onChange={(e) => setQuestionBody(e.target.value)}
              placeholder="Add more details so friends can help better…"
              rows={3}
              className="w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none"
            />
          </div>
          <button
            onClick={handlePostQuestion}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 py-2.5 text-sm font-semibold text-white shadow-md"
          >
            <Send className="h-4 w-4" /> Post Question
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
