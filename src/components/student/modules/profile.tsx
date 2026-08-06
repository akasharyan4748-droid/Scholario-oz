'use client'

import { motion } from 'framer-motion'
import {
  User, Phone, Mail, MapPin, Calendar, Droplet, Heart, School,
  Bus, BookMarked, Edit3, GraduationCap, FileText, ShieldCheck,
} from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { getStudentById } from '@/lib/mock/students'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'

export function ProfileModule() {
  const s = getStudentById('STU-2024-018')!

  const infoCards = [
    { label: 'Admission No', value: s.admissionNo, icon: <FileText className="h-4 w-4" />, color: 'from-violet-400 to-purple-500' },
    { label: 'Library ID', value: s.libraryId, icon: <BookMarked className="h-4 w-4" />, color: 'from-cyan-400 to-sky-500' },
    { label: 'Transport ID', value: s.transportId ?? '—', icon: <Bus className="h-4 w-4" />, color: 'from-emerald-400 to-teal-500' },
    { label: 'Roll Number', value: `#${s.rollNo}`, icon: <User className="h-4 w-4" />, color: 'from-amber-400 to-orange-500' },
  ]

  const personalInfo = [
    { label: 'Date of Birth', value: formatDate(s.dob), icon: <Calendar className="h-4 w-4" /> },
    { label: 'Gender', value: s.gender, icon: <User className="h-4 w-4" /> },
    { label: 'Blood Group', value: s.bloodGroup, icon: <Droplet className="h-4 w-4" /> },
    { label: 'Admission Date', value: formatDate(s.admissionDate), icon: <Calendar className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6">
      <SectionHeading
        title="My Profile"
        subtitle="Personal & academic information"
        icon={<User className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.info('Profile edit not available in demo', { description: 'Contact the school office for any updates to your information.' })}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md hover:shadow-lg transition-shadow"
          >
            <Edit3 className="h-3.5 w-3.5" /> Edit Profile
          </button>
        }
      />

      {/* Profile header card */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="relative h-32 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute left-1/4 -bottom-12 h-32 w-32 rounded-full bg-amber-300/30 blur-2xl" />
        </div>
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="relative"
            >
              <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-3xl sm:text-4xl font-extrabold border-4 border-background shadow-premium-lg">
                {s.avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-background">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            </motion.div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-2xl font-extrabold tracking-tight">{s.name}</h2>
                <StatusBadge status="Active" variant="success" dot />
              </div>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {s.className}-{s.section}</span>
                <span className="text-border">·</span>
                <span>Roll #{s.rollNo}</span>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {s.email}</span>
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {infoCards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <GlassCard className="p-3 sm:p-4" hover>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${c.color} text-white shadow-md mb-2.5`}>
                {c.icon}
              </div>
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
              <p className="font-display font-bold text-sm mt-0.5 font-mono">{c.value}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Personal info */}
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-violet-500" /> Personal Information
          </h3>
          <div className="space-y-3">
            {personalInfo.map((info, i) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  {info.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">{info.label}</p>
                  <p className="text-sm font-semibold">{info.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Parents info */}
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-500" /> Parents & Guardian
          </h3>
          <div className="space-y-3">
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
              <GradientAvatar name={s.fatherName} size="md" gradient="from-violet-400 to-purple-500" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">Father</p>
                <p className="text-sm font-semibold truncate">{s.fatherName}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
              <GradientAvatar name={s.motherName} size="md" gradient="from-rose-400 to-pink-500" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">Mother</p>
                <p className="text-sm font-semibold truncate">{s.motherName}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card/40 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-500" />
                <p className="text-[11px] text-muted-foreground">Guardian Phone</p>
              </div>
              <p className="text-sm font-semibold font-mono">{s.guardianPhone}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-border bg-card/40 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Mail className="h-3.5 w-3.5 text-cyan-500" />
                <p className="text-[11px] text-muted-foreground">Email</p>
              </div>
              <p className="text-sm font-semibold truncate">{s.email}</p>
            </motion.div>
          </div>
        </GlassCard>

        {/* Address & medical */}
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-500" /> Address & Medical
          </h3>
          <div className="space-y-3">
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-border bg-card/40 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                <p className="text-[11px] text-muted-foreground">Address</p>
              </div>
              <p className="text-sm font-medium leading-relaxed">{s.address}</p>
              <p className="text-xs text-muted-foreground mt-1">Gurugram, Haryana 122003</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-border bg-card/40 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Heart className="h-3.5 w-3.5 text-rose-500" />
                <p className="text-[11px] text-muted-foreground">Medical Information</p>
              </div>
              <p className="text-sm font-medium">{s.medical}</p>
              <div className="mt-2 flex items-center gap-2">
                <Droplet className="h-3.5 w-3.5 text-rose-500" />
                <span className="text-xs text-muted-foreground">Blood Group: <span className="font-semibold text-rose-600 dark:text-rose-400">{s.bloodGroup}</span></span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card/40 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <School className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-[11px] text-muted-foreground">Previous School</p>
              </div>
              <p className="text-sm font-medium">{s.previousSchool}</p>
            </motion.div>
          </div>
        </GlassCard>
      </div>

      {/* Academic summary */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" /> Academic Snapshot
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card/40 p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Class</p>
            <p className="font-display text-lg font-bold mt-0.5">{s.className}-{s.section}</p>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Attendance</p>
            <p className="font-display text-lg font-bold mt-0.5 text-emerald-600">{s.attendance}%</p>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Fee Status</p>
            <p className="font-display text-lg font-bold mt-0.5 text-amber-600">{s.feeStatus}</p>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Transport</p>
            <p className="font-display text-lg font-bold mt-0.5">{s.transport ? 'Yes' : 'No'}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card/40 p-3">
            <p className="text-[11px] text-muted-foreground mb-1">Fee Paid</p>
            <p className="font-display text-xl font-bold text-emerald-600">₹{s.feePaid.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">of ₹{s.feeTotal.toLocaleString('en-IN')} total</p>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-3">
            <p className="text-[11px] text-muted-foreground mb-1">Pending Fees</p>
            <p className="font-display text-xl font-bold text-rose-600">₹{(s.feeTotal - s.feePaid).toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Due by 15 Dec 2024</p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
