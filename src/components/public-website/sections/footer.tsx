'use client'

import React from 'react'
import {
  GraduationCap, Phone, Mail, MapPin, Clock, ChevronRight, Lock, ExternalLink, School,
} from 'lucide-react'

interface FooterProps {
  schoolName: string
  phone: string
  email: string
  address: string
  onOpenPortal: () => void
  onOpenPlatform?: () => void
}

export function PublicWebsiteFooter({
  schoolName,
  phone,
  email,
  address,
  onOpenPortal,
  onOpenPlatform,
}: FooterProps) {
  return (
    <footer id="contact" className="bg-card border-t border-border/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-display font-bold text-lg">{schoolName}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Recognized CBSE Senior Secondary School committed to holistic academic excellence, innovation, and ethical leadership.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Affiliation No: 1630189</p>
              <p>School Code: 20184</p>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm">Quick Links</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="#about" className="hover:text-foreground">About School</a></li>
              <li><a href="#academics" className="hover:text-foreground">Academics & Streams</a></li>
              <li><a href="#facilities" className="hover:text-foreground">Campus Infrastructure</a></li>
              <li><a href="#admissions" className="hover:text-foreground">Admissions Process</a></li>
              <li><a href="#events" className="hover:text-foreground">News & Calendar</a></li>
            </ul>
          </div>

          {/* Col 3: Contact Info */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm">Contact Campus</h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{email}</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Mon - Sat: 8:00 AM - 4:00 PM</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Portal & Platform */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm">Portals & Access</h4>
            <div className="space-y-2">
              <button
                onClick={() => onOpenPortal()}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-background text-xs font-semibold hover:border-emerald-500/40 transition-all group"
              >
                <span className="flex items-center gap-2 text-foreground">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  School Login Portal
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>

              {onOpenPlatform && (
                <button
                  onClick={() => onOpenPlatform()}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-border/80 bg-muted/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <School className="h-3.5 w-3.5 text-indigo-500" />
                    Scholario Platform (SuperAdmin)
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {schoolName}. Powered by Scholario-OS.</p>
          <div className="flex items-center gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>CBSE Mandatory Disclosure</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
