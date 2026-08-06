'use client'

import React from 'react'
import { GraduationCap, BookOpen, Lock, Sparkles } from 'lucide-react'
import Image from 'next/image'
import type { PublicSchoolData } from '../types'

interface HeroSectionProps {
  schoolData: PublicSchoolData | null
  schoolName: string
  onOpenPortal: () => void
}

export function HeroSection({ schoolData, schoolName, onOpenPortal }: HeroSectionProps) {
  return (
    <section id="hero" className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden mesh-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">

          {/* Left Content */}
          <div className="lg:col-span-7 space-y-6">

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Admissions Open for Academic Session {schoolData?.academicYear || '2025-2026'}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Empowering Minds, <br />
              <span className="text-gradient">Inspiring Excellence.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Welcome to <span className="font-semibold text-foreground">{schoolName}</span>. We foster academic rigor, character development, holistic growth, and modern technological innovation in a safe, vibrant learning sanctuary.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#admissions"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/35 transition-all active:scale-98"
              >
                <GraduationCap className="h-5 w-5" />
                Apply for Admission
              </a>
              <a
                href="#academics"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-border bg-card/60 backdrop-blur-md text-foreground font-semibold text-sm hover:bg-accent hover:border-border/80 transition-all"
              >
                <BookOpen className="h-4 w-4 text-emerald-600" />
                Explore Academics
              </a>
              <button
                onClick={() => onOpenPortal()}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl glass text-emerald-700 dark:text-emerald-400 font-semibold text-sm hover:bg-emerald-500/10 transition-all border border-emerald-500/30"
              >
                <Lock className="h-4 w-4" />
                Login Portal
              </button>
            </div>

            {/* Highlight Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-border/80">
              <div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  {schoolData?.counts?.students ? `${schoolData.counts.students}+` : '1,200+'}
                </div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">Enrolled Students</div>
              </div>
              <div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  {schoolData?.counts?.teachers ? `${schoolData.counts.teachers}+` : '50+'}
                </div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">Expert Faculty</div>
              </div>
              <div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">100%</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">CBSE Pass Rate</div>
              </div>
              <div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">15+</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">Clubs & Sports</div>
              </div>
            </div>

          </div>

          {/* Right Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-border/80 shadow-premium-lg bg-card">
              <Image
                src="https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&q=80&w=1000"
                alt="School Campus"
                width={800}
                height={600}
                className="w-full h-[400px] object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5">
                <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-500/80 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider">
                  Campus Life
                </span>
                <h3 className="font-display text-xl font-bold">{schoolName}</h3>
                <p className="text-xs text-white/80">State-of-the-art infrastructure designed for 21st century education.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
