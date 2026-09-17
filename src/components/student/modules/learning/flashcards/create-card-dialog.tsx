'use client'

/**
 * learning/flashcards/create-card-dialog — REAL card creation (§19/§62).
 *
 * Supports question/answer, subject (→ picks or creates the deck), topic,
 * optional hint, and links back to the resource it came from (§71
 * resource → flashcard). Pre-filled when created from a resource.
 */

import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useLearningStore } from '@/lib/store/learning-store'

export interface CardPrefill {
  subject?: string
  topic?: string
  resourceId?: string
  deckId?: string
  front?: string
}

interface CreateCardDialogProps {
  open: boolean
  onClose: () => void
  prefill?: CardPrefill
}

const SUBJECTS = ['Mathematics', 'English', 'Science', 'Hindi', 'Social Studies', 'Computer Science']

export function CreateCardDialog({ open, onClose, prefill }: CreateCardDialogProps) {
  const decks = useLearningStore((s) => s.decks)
  const addCard = useLearningStore((s) => s.addCard)
  const addDeck = useLearningStore((s) => s.addDeck)

  const [subject, setSubject] = useState(prefill?.subject ?? 'Mathematics')
  const [topic, setTopic] = useState(prefill?.topic ?? '')
  const [front, setFront] = useState(prefill?.front ?? '')
  const [back, setBack] = useState('')
  const [hint, setHint] = useState('')
  const [touched, setTouched] = useState(false)

  // Reset when reopened with a different prefill
  const [lastPrefill, setLastPrefill] = useState<CardPrefill | undefined>(prefill)
  if (open && prefill !== lastPrefill) {
    setLastPrefill(prefill)
    setSubject(prefill?.subject ?? 'Mathematics')
    setTopic(prefill?.topic ?? '')
    setFront(prefill?.front ?? '')
    setBack('')
    setHint('')
    setTouched(false)
  }

  const subjectDeck = useMemo(
    () => decks.find((d) => d.subject === subject && d.source === 'school') ?? decks.find((d) => d.subject === subject),
    [decks, subject],
  )

  const valid = front.trim().length >= 3 && back.trim().length >= 1

  const submit = () => {
    setTouched(true)
    if (!valid) return
    let deckId = prefill?.deckId ?? subjectDeck?.id
    if (!deckId) {
      deckId = addDeck({ name: topic.trim() || `${subject} cards`, subject, topic: topic.trim() || undefined })
      toast.success('New deck created', { description: `${topic.trim() || subject} — your cards live here from now on.` })
    }
    addCard({
      deckId,
      front: front.trim(),
      back: back.trim(),
      hint: hint.trim() || undefined,
      subject,
      resourceId: prefill?.resourceId,
    })
    toast.success('Card added', { description: 'It joins your review queue today.' })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="on-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New flashcard</DialogTitle>
          <DialogDescription>
            {prefill?.resourceId ? 'Created from your study material — it links back to it.' : 'Your own card, scheduled like every other card.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-1">
          <div className="grid gap-1.5">
            <Label htmlFor="fc-front">Question / front</Label>
            <Textarea
              id="fc-front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="e.g. What is 1/2 of 10?"
              className="min-h-16 resize-none text-sm"
              aria-invalid={touched && front.trim().length < 3}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fc-back">Answer / back</Label>
            <Textarea
              id="fc-back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="e.g. 5"
              className="min-h-16 resize-none text-sm"
              aria-invalid={touched && back.trim().length < 1}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fc-topic">Topic (optional)</Label>
              <Input id="fc-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Fractions" className="text-sm" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fc-hint">Hint (optional)</Label>
            <Input id="fc-hint" value={hint} onChange={(e) => setHint(e.target.value)} placeholder="Shown before the answer" className="text-sm" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {subjectDeck
              ? `Joins the ${subjectDeck.name} deck — ${prefill?.deckId ? 'the resource\u2019s own deck.' : 'your subject\u2019s deck.'}`
              : `A new “${topic.trim() || subject}” deck will be created for it.`}
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={touched && !valid}>Add card</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
