'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  GraduationCap,
  BookOpen,
  FlaskConical,
  Trophy,
  Target,
  Heart,
  Building2,
  ShieldCheck,
  MonitorPlay,
  Dumbbell,
  Library,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Sparkles,
  Menu,
  X,
  Lock,
  Moon,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/lib/store/auth-store'
import { usePublicSchoolData, useAdmissionForm } from './use-public-website-data'

/* ------------------------------------------------------------------ */
/*  Small primitives — kept local to this file so the landing page    */
/*  is fully self-contained (no external section files needed).       */
/* ------------------------------------------------------------------ */

type FadeInProps = {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
}

function FadeIn({ children, delay = 0, y = 24, className }: FadeInProps) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function PrimaryCta({
  children,
  onClick,
  href,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
}) {
  const cls = `group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold text-white bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all ${className}`
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    )
  }
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  )
}

function GhostCta({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-white/60 dark:bg-white/5 backdrop-blur border border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all ${className}`}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function PublicWebsite({ onOpenPortal, onOpenPlatform }: {
  onOpenPortal: () => void
  onOpenPlatform?: () => void
}) {
  const { isAuthenticated, user, logout } = useAuth()
  void isAuthenticated
  void user
  void logout

  const { schoolData, loading } = usePublicSchoolData()
  void loading

  const {
    admForm,
    setAdmForm,
    admSubmitting,
    admSuccess,
    setAdmSuccess,
    admError,
    handleAdmissionSubmit,
  } = useAdmissionForm()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // school-derived strings
  const schoolName = schoolData?.name || 'Demo School of Scholario'
  const city = schoolData?.city || 'Gurugram'
  const phone = schoolData?.phone || '+91 124 4567 800'
  const email = schoolData?.email || 'office@demoschool.edu'
  const address = schoolData?.address || '100 Knowledge Parkway, Sector 47, Gurugram'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="min-h-screen mesh-bg text-foreground selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
      <Header
        schoolName={schoolName}
        scrolled={scrolled}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onOpenPortal={onOpenPortal}
      />

      <main>
        <Hero
          schoolData={schoolData}
          schoolName={schoolName}
          onOpenPortal={onOpenPortal}
        />

        <WhyChooseUs />

        <Journey />

        <Facilities />

        <Admissions
          schoolName={schoolName}
          admForm={admForm}
          setAdmForm={setAdmForm}
          admSubmitting={admSubmitting}
          admSuccess={admSuccess}
          setAdmSuccess={setAdmSuccess}
          admError={admError}
          handleAdmissionSubmit={handleAdmissionSubmit}
        />
      </main>

      <Footer
        schoolName={schoolName}
        phone={phone}
        email={email}
        address={address}
        city={city}
        onOpenPortal={onOpenPortal}
        onOpenPlatform={onOpenPlatform}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

function Header({
  schoolName,
  scrolled,
  mobileMenuOpen,
  setMobileMenuOpen,
  onOpenPortal,
}: {
  schoolName: string
  scrolled: boolean
  mobileMenuOpen: boolean
  setMobileMenuOpen: (v: boolean) => void
  onOpenPortal: () => void
}) {
  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Academics', href: '#journey' },
    { label: 'Facilities', href: '#facilities' },
    { label: 'Admissions', href: '#admissions' },
    { label: 'Contact', href: '#footer' },
  ]

  const shortName = schoolName.split(' ')[0] || 'Demo'

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-strong shadow-premium border-b border-border/60'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <a href="#top" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display font-bold text-foreground text-base">{shortName}</h1>
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-widest uppercase">
              Of Scholario
            </p>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="hover:text-foreground transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-px after:bg-emerald-500 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            aria-label="Toggle theme"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-border bg-card/40"
          >
            <Moon className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenPortal}
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            Login Portal
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          className="md:hidden p-2 rounded-lg text-foreground hover:bg-accent transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden glass-strong border-t border-border/60 overflow-hidden"
        >
          <div className="px-6 py-4 flex flex-col gap-2">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                onOpenPortal()
              }}
              className="mt-3 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md"
            >
              <Lock className="w-3.5 h-3.5" />
              Login Portal
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </header>
  )
}

/* ------------------------------------------------------------------ */
/*  Hero — left text + right stats dashboard card                      */
/* ------------------------------------------------------------------ */

type Stat = { label: string; value: string; icon: LucideIcon }

const heroStats: Stat[] = [
  { label: 'Students', value: '1,840', icon: GraduationCap },
  { label: 'Faculty', value: '152', icon: BookOpen },
  { label: 'Labs', value: '18', icon: FlaskConical },
  { label: 'Awards', value: '240+', icon: Trophy },
]

function Hero({
  schoolData,
  schoolName,
  onOpenPortal,
}: {
  schoolData: any
  schoolName: string
  onOpenPortal: () => void
}) {
  const legacyStats = [
    { label: 'Years Legacy', value: '30+' },
    { label: 'Teacher Ratio', value: '1:12' },
    { label: 'Board Pass', value: '98%' },
  ]

  return (
    <section id="top" className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
      {/* ambient orbs */}
      <div aria-hidden className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div aria-hidden className="absolute top-32 -right-32 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left */}
          <FadeIn className="space-y-7">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Admissions open for {schoolData?.academicYear || '2025–26'}
            </span>

            <h2 className="font-display text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Empowering Minds, <br />
              <span
                className="bg-clip-text text-transparent bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500"
                style={{
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Inspiring Excellence
              </span>
            </h2>

            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              A future-ready learning community where tradition meets innovation. Discover an education that
              nurtures intellect, character, and curiosity at <span className="font-semibold text-foreground">{schoolName}</span>.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <PrimaryCta href="#admissions">
                Apply for Admission
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </PrimaryCta>
              <GhostCta onClick={onOpenPortal}>Login Portal</GhostCta>
            </div>

            <div className="flex items-center gap-10 pt-6">
              {legacyStats.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-3xl font-bold text-foreground tabular-nums">{s.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Right: stats dashboard card */}
          <FadeIn delay={0.15} className="relative">
            <div className="bg-white/40 dark:bg-white/[0.03] backdrop-blur-sm border-4 border-emerald-500/60 rounded-[2.5rem] p-5 sm:p-6 grid grid-cols-2 gap-4 shadow-premium-lg">
              {heroStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-3xl p-5 sm:p-6 border border-emerald-500/15 hover:-translate-y-1 hover:shadow-premium transition-all"
                >
                  <stat.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-10" strokeWidth={1.5} />
                  <div className="font-display text-3xl font-bold text-foreground tabular-nums">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* floating accent */}
            <div
              aria-hidden
              className="hidden lg:block absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 opacity-80 blur-2xl"
            />
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Why families choose us                                             */
/* ------------------------------------------------------------------ */

const pillars: Array<{
  title: string
  desc: string
  icon: LucideIcon
  bg: string
}> = [
  {
    title: 'Academic Excellence',
    desc: 'A rigorous, NEP-aligned curriculum that consistently produces top-tier board results.',
    icon: Target,
    bg: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Holistic Growth',
    desc: 'Sports, arts, and life-skills programs that shape confident, well-rounded individuals.',
    icon: Heart,
    bg: 'from-rose-400 to-rose-500',
  },
  {
    title: 'Modern Facilities',
    desc: 'Smart classrooms, advanced labs, and digital libraries built for 21st-century learning.',
    icon: Building2,
    bg: 'from-sky-400 to-sky-500',
  },
  {
    title: 'Safe & Inclusive',
    desc: 'A nurturing, secure campus where every child feels seen, heard, and valued.',
    icon: ShieldCheck,
    bg: 'from-lime-400 to-lime-500',
  },
]

function WhyChooseUs() {
  return (
    <section id="about" className="max-w-7xl mx-auto px-6 py-24">
      <FadeIn className="text-center mb-14">
        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
          Why families choose us
        </h2>
        <p className="text-lg text-muted-foreground">
          Four pillars that define the Scholario experience.
        </p>
      </FadeIn>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {pillars.map((p, i) => (
          <FadeIn key={p.title} delay={i * 0.08}>
            <div className="h-full bg-card rounded-3xl p-8 shadow-premium border border-border/60 hover:-translate-y-1.5 hover:shadow-premium-lg transition-all">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${p.bg} flex items-center justify-center text-white shadow-lg mb-6`}>
                <p.icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{p.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{p.desc}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  A journey for every stage                                          */
/* ------------------------------------------------------------------ */

const stages: Array<{
  grade: string
  title: string
  desc: string
  accent: string
  badge: string
}> = [
  {
    grade: 'Grade 1 – 5',
    title: 'Primary School',
    desc: 'Activity-led learning that builds strong foundations in literacy, numeracy, and curiosity.',
    accent: 'from-emerald-400 to-teal-500',
    badge: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    grade: 'Grade 6 – 8',
    title: 'Middle School',
    desc: 'Inquiry-based classrooms that develop critical thinking, collaboration, and creativity.',
    accent: 'from-sky-400 to-blue-500',
    badge: 'text-sky-600 dark:text-sky-400',
  },
  {
    grade: 'Grade 9 – 12',
    title: 'Senior School',
    desc: 'Specialised streams in Science, Commerce, and Humanities with expert mentorship.',
    accent: 'from-orange-400 to-pink-500',
    badge: 'text-orange-600 dark:text-orange-400',
  },
]

function Journey() {
  return (
    <section id="journey" className="max-w-7xl mx-auto px-6 py-24">
      <FadeIn className="text-center mb-14">
        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
          A journey for every stage
        </h2>
        <p className="text-lg text-muted-foreground">
          From first steps to graduation, we grow with your child.
        </p>
      </FadeIn>

      <div className="grid md:grid-cols-3 gap-8">
        {stages.map((s, i) => (
          <FadeIn key={s.title} delay={i * 0.1}>
            <div className="relative h-full bg-card rounded-3xl pt-2 pb-8 px-8 shadow-premium border border-border/60 hover:-translate-y-1.5 hover:shadow-premium-lg transition-all overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${s.accent}`} />
              <div className={`text-xs font-bold ${s.badge} uppercase tracking-wider mt-6 mb-2`}>
                {s.grade}
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-4">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  World-class facilities                                             */
/* ------------------------------------------------------------------ */

const facilities: Array<{ title: string; desc: string; icon: LucideIcon }> = [
  { title: 'Smart Classrooms', desc: 'AI-enabled interactive boards in every room.', icon: MonitorPlay },
  { title: 'Science Labs', desc: 'Physics, chemistry & biology labs of university grade.', icon: FlaskConical },
  { title: 'Sports Complex', desc: 'Olympic-sized pool, courts, and a 400m track.', icon: Dumbbell },
  { title: 'Library', desc: '30,000+ titles and a fully digital research hub.', icon: Library },
]

function Facilities() {
  return (
    <section id="facilities" className="max-w-7xl mx-auto px-6 py-24">
      <FadeIn className="text-center mb-14">
        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
          World-class facilities
        </h2>
        <p className="text-lg text-muted-foreground">Spaces designed to inspire discovery.</p>
      </FadeIn>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {facilities.map((f, i) => (
          <FadeIn key={f.title} delay={i * 0.08}>
            <div className="h-full bg-card rounded-3xl p-8 shadow-premium border border-border/60 hover:-translate-y-1.5 hover:shadow-premium-lg hover:border-emerald-500/40 transition-all">
              <f.icon className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-6" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{f.desc}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Admissions form                                                    */
/* ------------------------------------------------------------------ */

function Admissions({
  schoolName,
  admForm,
  setAdmForm,
  admSubmitting,
  admSuccess,
  setAdmSuccess,
  admError,
  handleAdmissionSubmit,
}: {
  schoolName: string
  admForm: any
  setAdmForm: (f: any) => void
  admSubmitting: boolean
  admSuccess: boolean
  setAdmSuccess: (v: boolean) => void
  admError: string
  handleAdmissionSubmit: (e: React.FormEvent) => Promise<void>
}) {
  void schoolName
  const formRef = useRef<HTMLFormElement>(null)

  const update = (k: keyof typeof admForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setAdmForm({ ...admForm, [k]: e.target.value })
  }

  return (
    <section id="admissions" className="max-w-4xl mx-auto px-6 py-24">
      <FadeIn className="text-center mb-10">
        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
          Begin your admissions journey
        </h2>
        <p className="text-lg text-muted-foreground">
          Tell us a little about your child and we&apos;ll be in touch.
        </p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="relative bg-card/70 backdrop-blur-md rounded-[2rem] p-8 md:p-12 shadow-premium-lg border border-emerald-500/15">
          {/* subtle gradient halo */}
          <div aria-hidden className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          {admSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground">Inquiry received!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Thank you. Our admissions team will reach out within 24 hours to schedule a campus visit and
                answer any questions.
              </p>
              <button
                onClick={() => setAdmSuccess(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
              >
                Submit another inquiry
              </button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleAdmissionSubmit} className="space-y-6 text-left relative">
              <div className="grid md:grid-cols-2 gap-6">
                <Field label="Parent / Guardian Name">
                  <input
                    type="text"
                    required
                    value={admForm.parentName}
                    onChange={update('parentName')}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background/60 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    required
                    value={admForm.email}
                    onChange={update('email')}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background/60 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none"
                  />
                </Field>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Field label="Phone">
                  <input
                    type="tel"
                    required
                    value={admForm.phone}
                    onChange={update('phone')}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background/60 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none"
                  />
                </Field>
                <Field label="Grade applying for">
                  <select
                    required
                    value={admForm.grade}
                    onChange={update('grade')}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background/60 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none appearance-none"
                  >
                    <option value="">Select grade</option>
                    <option value="primary">Primary (1–5)</option>
                    <option value="middle">Middle (6–8)</option>
                    <option value="senior">Senior (9–12)</option>
                  </select>
                </Field>
              </div>

              <Field label="Student&apos;s Name">
                <input
                  type="text"
                  value={admForm.studentName}
                  onChange={update('studentName')}
                  placeholder="Your child's full name"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background/60 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none"
                />
              </Field>

              <Field label="Notes (optional)">
                <textarea
                  value={admForm.notes}
                  onChange={update('notes')}
                  placeholder="Anything else you'd like us to know?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background/60 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none resize-none"
                />
              </Field>

              {admError && (
                <div className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm">
                  {admError}
                </div>
              )}

              <button
                type="submit"
                disabled={admSubmitting}
                className="group w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                {admSubmitting ? 'Submitting…' : 'Submit Inquiry'}
                {!admSubmitting && (
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                )}
              </button>
            </form>
          )}
        </div>
      </FadeIn>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

function Footer({
  schoolName,
  phone,
  email,
  address,
  city,
  onOpenPortal,
  onOpenPlatform,
}: {
  schoolName: string
  phone: string
  email: string
  address: string
  city: string
  onOpenPortal: () => void
  onOpenPlatform?: () => void
}) {
  const shortName = schoolName.split(' ')[0] || 'Demo'
  void onOpenPlatform

  const quickLinks = [
    { label: 'About Us', href: '#about' },
    { label: 'Academics', href: '#journey' },
    { label: 'Facilities', href: '#facilities' },
    { label: 'Admissions', href: '#admissions' },
  ]

  return (
    <footer id="footer" className="bg-card border-t border-border/60 pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-foreground leading-tight">{shortName}</h2>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-widest uppercase">
                Of Scholario
              </p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Nurturing minds, shaping character, and inspiring excellence since 1995.
          </p>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-bold text-foreground mb-4">Contact</h3>
          <ul className="space-y-4 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{address}, {city}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <a href={`tel:${phone}`} className="hover:text-foreground transition-colors">{phone}</a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <a href={`mailto:${email}`} className="hover:text-foreground transition-colors">{email}</a>
            </li>
          </ul>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="font-bold text-foreground mb-4">Quick Links</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Portal */}
        <div>
          <h3 className="font-bold text-foreground mb-4">Portal Access</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Students, teachers, and staff — access your dashboard.
          </p>
          <button
            onClick={onOpenPortal}
            className="group inline-flex items-center gap-2 px-5 py-2.5 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/5 rounded-full text-sm font-semibold transition-colors"
          >
            Open Login Portal
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} {schoolName}. All rights reserved.</span>
        <span>
          Powered by <span className="text-emerald-600 dark:text-emerald-400 font-semibold">SCHOLARIO-OS</span>
        </span>
      </div>
    </footer>
  )
}
