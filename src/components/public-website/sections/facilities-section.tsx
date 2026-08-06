'use client'

import React from 'react'
import { Laptop, Microscope, Dumbbell, Library, Bus, HeartPulse } from 'lucide-react'

export function FacilitiesSection() {
  return (
    <section id="facilities" className="py-16 sm:py-24 bg-card border-y border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">World-Class Campus</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">Campus Infrastructure</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Designed to stimulate creativity, physical health, scientific curiosity, and safety.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Smart Classrooms', desc: 'Fully air-conditioned classrooms equipped with interactive displays and high-speed Wi-Fi.', icon: Laptop },
            { title: 'Science & Robotics Labs', desc: 'Dedicated Physics, Chemistry, Biology, and Robotics tinkering facilities with modern equipment.', icon: Microscope },
            { title: 'Olympic Sports Complex', desc: 'Basketball court, football turf, badminton academy, swimming pool, and athletics track.', icon: Dumbbell },
            { title: 'Digital Library', desc: 'Over 12,000 physical volumes plus access to global e-learning repositories and quiet study bays.', icon: Library },
            { title: 'GPS Transport Fleet', desc: 'Air-conditioned buses monitored by live GPS tracking, RFID attendance, and onboard attendants.', icon: Bus },
            { title: 'Medical Center', desc: 'Full-time resident medical nurse, emergency medical kit, and immediate hospital tie-ups.', icon: HeartPulse },
          ].map((fac, i) => (
            <div key={i} className="p-6 rounded-2xl border border-border/80 bg-background hover:border-emerald-500/40 hover:shadow-md transition-all space-y-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <fac.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-lg">{fac.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{fac.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
