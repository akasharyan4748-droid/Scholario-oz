'use client'

import React from 'react'
import { CheckCircle2 } from 'lucide-react'

export function AcademicsSection() {
  return (
    <section id="academics" className="py-16 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Curriculum & Pedagogy</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">Academic Wings</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Structured progressive learning paths designed to nurture cognitive development from primary foundation to senior specialization.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              wing: 'Primary School (Grades 1 - 5)',
              focus: 'Foundational Literacy, Numeracy & Experiential Learning',
              points: ['Activity-based learning modules', 'Language immersion (English, Hindi, Sanskrit)', 'Interactive smartboard lessons', 'Environmental studies & arts'],
              color: 'from-emerald-500/20 to-teal-500/20',
            },
            {
              wing: 'Middle School (Grades 6 - 8)',
              focus: 'Analytical Thinking, STEM & Scientific Inquiry',
              points: ['Physics, Chemistry & Biology lab exposure', 'Computer science & scratch programming', 'Mathematics problem-solving clubs', 'Inter-house competitions'],
              color: 'from-amber-500/20 to-orange-500/20',
            },
            {
              wing: 'Secondary & Senior (Grades 9 - 12)',
              focus: 'CBSE Board Rigor & Career Stream Preparation',
              points: ['Science (PCM/PCB), Commerce & Humanities', 'JEE / NEET / CUET competitive coaching', 'Career counseling & mentorship', 'Comprehensive laboratory research'],
              color: 'from-indigo-500/20 to-violet-500/20',
            },
          ].map((wing, i) => (
            <div key={i} className="rounded-3xl border border-border/80 bg-card p-6 shadow-premium hover:shadow-premium-lg transition-all space-y-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-r ${wing.color} border border-border/50`}>
                <h3 className="font-display font-bold text-lg text-foreground">{wing.wing}</h3>
                <p className="text-xs text-muted-foreground font-medium mt-1">{wing.focus}</p>
              </div>
              <ul className="space-y-2.5 text-xs text-foreground/80">
                {wing.points.map((pt, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
