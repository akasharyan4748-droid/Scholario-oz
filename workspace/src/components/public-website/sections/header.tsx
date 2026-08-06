'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, ArrowRight, Lock, Users, Menu, X } from 'lucide-react'
import { useAuth } from '@/lib/store/auth-store'
import type { PublicSchoolData } from '../types'

interface HeaderProps {
  schoolData: PublicSchoolData | null
  schoolName: string
  city: string
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  onOpenPortal: () => void
}

export function PublicWebsiteHeader({
  schoolData,
  schoolName,
  city,
  mobileMenuOpen,
  setMobileMenuOpen,
  onOpenPortal,
}: HeaderProps) {
  void schoolData
  const { isAuthenticated, user } = useAuth()

  return (
    <header className="sticky top-0 z-40 w-full glass-strong border-b border-border/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* School Brand */}
        <a href="#hero" className="flex items-center gap-3 group">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg sm:text-xl tracking-tight leading-none text-foreground">
                {schoolName}
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Demo Tenant
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">CBSE Senior Secondary School · {city}</span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#about" className="hover:text-foreground transition-colors">About</a>
          <a href="#academics" className="hover:text-foreground transition-colors">Academics</a>
          <a href="#facilities" className="hover:text-foreground transition-colors">Facilities</a>
          <a href="#gallery" className="hover:text-foreground transition-colors">Gallery</a>
          <a href="#events" className="hover:text-foreground transition-colors">Events</a>
          <a href="#admissions" className="hover:text-foreground transition-colors">Admissions</a>
          <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
        </nav>

        {/* Action CTA: Login Portal */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenPortal()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
              >
                <Users className="h-4 w-4" />
                My Dashboard ({user.role})
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenPortal()}
              className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/35 transition-all active:scale-98"
            >
              <Lock className="h-4 w-4 text-emerald-200" />
              <span>Login Portal</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-b border-border bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 pt-3 pb-6 space-y-3 text-sm font-medium">
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-foreground/80 hover:text-primary">About Us</a>
              <a href="#academics" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-foreground/80 hover:text-primary">Academics</a>
              <a href="#facilities" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-foreground/80 hover:text-primary">Facilities</a>
              <a href="#gallery" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-foreground/80 hover:text-primary">Gallery</a>
              <a href="#events" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-foreground/80 hover:text-primary">Events & News</a>
              <a href="#admissions" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-foreground/80 hover:text-primary">Admissions</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-foreground/80 hover:text-primary">Contact</a>

              <div className="pt-2 border-t border-border">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onOpenPortal()
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm shadow-md"
                >
                  <Lock className="h-4 w-4" />
                  Open Login Portal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
