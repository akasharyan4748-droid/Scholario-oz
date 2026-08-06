'use client'

import React from 'react'
import { BookOpen, Award, Landmark, ShieldCheck } from 'lucide-react'

interface AboutSectionProps {
  schoolName: string
}

export function AboutSection({ schoolName }: AboutSectionProps) {
  return (
    <section id="about" className="py-16 sm:py-24 bg-card border-y border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* About Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Legacy of Learning</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">About Our Institution</h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Founded with a commitment to academic brilliance, character formation, and holistic development, {schoolName} provides a nurturing ecosystem where young minds blossom into global leaders.
          </p>
        </div>

        {/* Principal's Message & Core Values */}
        <div className="grid lg:grid-cols-12 gap-8 items-center">

          {/* Principal Card */}
          <div className="lg:col-span-5 glass-strong rounded-3xl p-6 sm:p-8 border border-border/80 shadow-premium relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                AI
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">Dr. Ananya Iyer</h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Principal & Academic Director</p>
                <p className="text-[11px] text-muted-foreground">Ph.D. Educational Leadership (DU)</p>
              </div>
            </div>

            <blockquote className="text-sm text-foreground/90 italic leading-relaxed border-l-2 border-emerald-500 pl-4 my-4">
              &ldquo;Education is not merely the accumulation of facts, but the training of the mind to think critically, act compassionately, and lead with unwavering integrity.&rdquo;
            </blockquote>

            <p className="text-xs text-muted-foreground leading-relaxed">
              At {schoolName}, we blend traditional values with cutting-edge pedagogy. Every child is empowered to discover their unique strengths in academics, sports, arts, and leadership.
            </p>
          </div>

          {/* Core Pillars */}
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Academic Excellence', desc: 'Comprehensive CBSE curriculum supplemented with STEM, coding, and analytical reasoning.', icon: BookOpen },
              { title: 'Holistic Growth', desc: 'Over 15 co-curricular clubs, public speaking forums, music, drama, and fine arts.', icon: Award },
              { title: 'Modern Facilities', desc: 'Smart classrooms, robotics labs, Olympic-size sports arenas, and digital libraries.', icon: Landmark },
              { title: 'Safe & Inclusive', desc: '24/7 CCTV surveillance, GPS bus tracking, biometrics, and dedicated student counseling.', icon: ShieldCheck },
            ].map((pillar, i) => (
              <div key={i} className="p-5 rounded-2xl border border-border/80 bg-background/50 hover:border-emerald-500/30 transition-all space-y-2">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <h4 className="font-display font-bold text-base">{pillar.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  )
}
