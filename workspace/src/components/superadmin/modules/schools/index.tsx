'use client'

import { useState, useEffect, useMemo } from 'react'
import { Building2, Search, Plus, Users, Star, Sparkles } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { GlassCard } from '@/components/shared/ui'
import type { School } from './types'
import { SchoolsTable } from './schools-table'
import { OnboardingModal, type OnboardForm } from './onboarding-modal'

export function SchoolsModule() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [showDemo, setShowDemo] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('All')
  const [selected, setSelected] = useState<School | null>(null)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<OnboardForm>({ name: '', code: '', city: '', plan: 'STANDARD', principalName: '', principalEmail: '' })

  useEffect(() => {
    fetch('/api/superadmin/settings')
      .then(async (r) => { if (!r.ok || !r.headers.get('content-type')?.includes('application/json')) return {}; return r.json().catch(() => ({})) })
      .then((j) => { if (j?.data?.showDemoSchool !== undefined) setShowDemo(j.data.showDemoSchool) })
      .catch(() => {})
  }, [])

  const fetchSchools = () => {
    setLoading(true)
    fetch(`/api/schools?includeDemo=${showDemo}`)
      .then(async (r) => { if (!r.ok || !r.headers.get('content-type')?.includes('application/json')) return {}; return r.json().catch(() => ({})) })
      .then((j) => { if (j?.data && Array.isArray(j.data)) setSchools(j.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchSchools() }, [showDemo])

  const toggleDemoVisibility = async (enabled: boolean) => {
    setShowDemo(enabled)
    try {
      await fetch('/api/superadmin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ showDemoSchool: enabled }) })
      toast.success(enabled ? 'Demo School shown' : 'Demo School hidden')
    } catch { toast.error('Failed to update settings') }
  }

  const handleOnboard = async () => {
    if (!form.name || !form.code) { toast.error('School Name and Code are required'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/schools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const isJson = res.headers.get('content-type')?.includes('application/json')
      const j = isJson ? await res.json().catch(() => ({})) : {}
      if (!res.ok) throw new Error(j?.error || 'Failed to onboard school')
      toast.success(`School "${form.name}" successfully onboarded!`)
      setOnboardingOpen(false)
      setForm({ name: '', code: '', city: '', plan: 'STANDARD', principalName: '', principalEmail: '' })
      fetchSchools()
    } catch (e: any) { toast.error(e.message || 'Onboarding error') }
    finally { setSubmitting(false) }
  }

  const filtered = useMemo(() => schools.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()) || (s.city && s.city.toLowerCase().includes(search.toLowerCase()))
    const matchPlan = planFilter === 'All' || s.plan.toUpperCase() === planFilter.toUpperCase()
    return matchSearch && matchPlan
  }), [schools, search, planFilter])

  const totalStudents = schools.reduce((sum, s) => sum + (s.counts?.students || 0), 0)
  const totalTeachers = schools.reduce((sum, s) => sum + (s.counts?.teachers || 0), 0)

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Schools & Tenants"
        subtitle="Real database multi-tenant school management console"
        icon={<Building2 className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-1.5 shadow-xs">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium">Show Demo School</span>
              <Switch checked={showDemo} onCheckedChange={toggleDemoVisibility} />
            </div>
            <button onClick={() => setOnboardingOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-[0.97] transition-all">
              <Plus className="h-3.5 w-3.5" /> Onboard School
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Total Real Schools" value={schools.length} icon={<Building2 className="h-5 w-5" />} accent="emerald" delay={0} />
        <KpiCard label="Enrolled Students" value={totalStudents} icon={<Users className="h-5 w-5" />} accent="amber" delay={0.05} />
        <KpiCard label="Active Faculty" value={totalTeachers} icon={<Users className="h-5 w-5" />} accent="violet" delay={0.1} />
        <KpiCard label="Platform Uptime" value={99.9} suffix="%" icon={<Star className="h-5 w-5" />} accent="cyan" delay={0.15} />
      </div>

      <GlassCard className="p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search schools by name, code, or city…" className="w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 py-2 text-sm outline-none focus:border-primary/50" />
          </div>
          <div className="flex gap-1.5">
            {['All', 'Enterprise', 'Standard', 'Starter'].map((p) => (
              <button key={p} onClick={() => setPlanFilter(p)} className={cn('rounded-lg px-3 py-2 text-xs font-medium transition-colors', planFilter === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent')}>{p}</button>
            ))}
          </div>
        </div>
      </GlassCard>

      <SchoolsTable schools={filtered} loading={loading} showDemo={showDemo} onOnboard={() => setOnboardingOpen(true)} onSelect={setSelected} />

      <OnboardingModal open={onboardingOpen} form={form} setForm={setForm} submitting={submitting} onClose={() => setOnboardingOpen(false)} onSubmit={handleOnboard} />
    </div>
  )
}
