'use client'

import React from 'react'
import { Calendar, CheckCircle2, Lock } from 'lucide-react'
import type { PublicSchoolData } from '../types'

interface EventsSectionProps {
  schoolData: PublicSchoolData | null
  onOpenPortal: () => void
}

export function EventsSection({ schoolData, onOpenPortal }: EventsSectionProps) {
  return (
    <section id="events" className="py-16 sm:py-24 bg-card border-y border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">School Updates</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">Latest Announcements & Events</h2>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">

          {/* Database Announcements */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-display font-bold text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Official School Notices
            </h3>

            {schoolData?.announcements && schoolData.announcements.length > 0 ? (
              schoolData.announcements.map((ann) => (
                <div key={ann.id} className="p-5 rounded-2xl border border-border/80 bg-background space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      ann.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      {ann.priority} Priority
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-display font-bold text-base text-foreground">{ann.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ann.message}</p>
                </div>
              ))
            ) : (
              <div className="space-y-4">
                {[
                  { title: 'Annual Science & Technology Expo 2025', date: 'October 15, 2025', desc: 'Students from Grades 6-12 will display working models in robotics, renewable energy, and AI.' },
                  { title: 'Inter-House Sports Meet & Athletics', date: 'November 20, 2025', desc: 'Three-day athletic tournament featuring track events, football, basketball, and gymnastics.' },
                  { title: 'Parent-Teacher Meeting (PTM - Term 1)', date: 'December 05, 2025', desc: 'Comprehensive academic progress evaluation and individual feedback session with subject teachers.' },
                ].map((evt, i) => (
                  <div key={i} className="p-5 rounded-2xl border border-border/80 bg-background space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{evt.date}</span>
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">Upcoming</span>
                    </div>
                    <h4 className="font-display font-bold text-base">{evt.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{evt.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Portal Access Box */}
          <div className="lg:col-span-5 glass-strong rounded-3xl p-6 border border-border/80 shadow-premium flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-2xl">Digital Parent & Student Portal</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Access real-time student attendance, exam results, timetable schedules, fee payment receipts, and direct teacher communications through our unified portal.
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Instant fee payment & digital receipts</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Biometric attendance calendar alerts</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Report cards & exam performance analytics</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-border">
              <button
                onClick={() => onOpenPortal()}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm shadow-md hover:bg-emerald-700 transition-all"
              >
                <Lock className="h-4 w-4" />
                Sign In to School Portal
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
