'use client'

/**
 * learning/planner/quick-add — deterministic natural-ish task parsing (§24).
 *
 * NOT AI and never labelled as such: a compact, honest parser that
 * recognises duration ("30 min", "1 hour"), relative dates ("today",
 * "tomorrow", weekday names), a priority marker ("!") and known subject
 * names. Everything it cannot parse stays in the title — nothing is lost,
 * nothing is fabricated. The full form remains available for details.
 */

import type { Priority, TaskType } from '@/lib/store/learning-types'

const SUBJECT_HINTS: { subject: string; words: string[] }[] = [
  { subject: 'Mathematics', words: ['math', 'maths', 'mathematics', 'fraction', 'fractions', 'addition', 'subtraction', 'number'] },
  { subject: 'Science', words: ['science', 'plant', 'plants', 'seed', 'seeds', 'living'] },
  { subject: 'English', words: ['english', 'reading', 'grammar', 'noun', 'nouns', 'story', 'writing'] },
  { subject: 'Hindi', words: ['hindi', 'varnamala', 'कहानी'] },
  { subject: 'Social Studies', words: ['social', 'community', 'neighbourhood', 'neighborhood', 'helpers'] },
  { subject: 'Computer Science', words: ['computer', 'keyboard', 'mouse', 'cpu'] },
]

const TYPE_HINTS: { type: TaskType; words: string[] }[] = [
  { type: 'revision', words: ['revise', 'revision', 'review'] },
  { type: 'practice', words: ['practice', 'practise', 'exercise', 'solve'] },
  { type: 'quiz', words: ['quiz', 'test'] },
  { type: 'reading', words: ['read', 'reading', 'watch'] },
  { type: 'notes', words: ['note', 'notes', 'write'] },
]

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export interface ParsedTask {
  title: string
  subject?: string
  date: string
  durationMin: number
  priority: Priority
  type: TaskType
}

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function parseQuickAdd(raw: string): ParsedTask {
  let text = ` ${raw.trim()} `
  let durationMin = 20
  let date = isoOf(new Date())
  let priority: Priority = 'normal'
  let type: TaskType = 'other'
  let subject: string | undefined

  // Duration — "30 min", "30min", "1 hour", "1.5 hours"
  const dur = text.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?|m|h)\b/i)
  if (dur) {
    const n = Number(dur[1])
    durationMin = /^h/i.test(dur[2]) ? Math.round(n * 60) : Math.round(n)
    text = text.replace(dur[0], ' ')
  }

  // Dates — today / tomorrow / weekday names
  if (/\btomorrow\b/i.test(text)) {
    const d = new Date(); d.setDate(d.getDate() + 1)
    date = isoOf(d)
    text = text.replace(/\btomorrow\b/i, ' ')
  } else if (/\btoday\b/i.test(text)) {
    text = text.replace(/\btoday\b/i, ' ')
  } else {
    for (let i = 0; i < 7; i++) {
      const re = new RegExp(`\\b${WEEKDAYS[i]}\\b`, 'i')
      if (re.test(text)) {
        const d = new Date()
        const delta = (i - d.getDay() + 7) % 7 || 7 // "next" occurrence
        d.setDate(d.getDate() + delta)
        date = isoOf(d)
        text = text.replace(re, ' ')
        break
      }
    }
  }

  // Priority — trailing "!"
  if (/(\s!+|\bhigh\b|\burgent\b)\s*$/i.test(text.trim())) {
    priority = 'high'
    text = text.replace(/(\s!+|\bhigh\b|\burgent\b)\s*$/i, ' ')
  }

  // Subject / type — keyword hints
  const lower = text.toLowerCase()
  for (const s of SUBJECT_HINTS) {
    if (s.words.some((w) => lower.includes(w))) { subject = s.subject; break }
  }
  for (const t of TYPE_HINTS) {
    if (t.words.some((w) => new RegExp(`\\b${w}\\b`).test(lower))) { type = t.type; break }
  }

  const title = text.replace(/\s+/g, ' ').trim()
  return { title, subject, date, durationMin, priority, type }
}
