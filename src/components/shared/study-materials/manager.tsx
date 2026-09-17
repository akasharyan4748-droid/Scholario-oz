'use client'

/**
 * StudyMaterialsManager — the STAFF surface (teacher + principal) of the
 * Study Materials repository (spec §5–§7, §10).
 *
 * PERMISSION-DRIVEN (never role-hardcoded in the UI logic):
 *   · canTargetSchool — may publish school-wide material (principal /
 *     authorized admin; teachers target classes/students only).
 *   · canManageAll    — may archive/delete ANY material (principal /
 *     admin). Teachers manage their OWN uploads only — the SERVER
 *     re-checks both rules on every call; these props only shape the UI.
 *
 * IA: scope chips → [Add Material] + status tabs → rows with lifecycle
 * actions. No page header (the sidebar names the module).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  UploadCloud, FileText, Image as ImageIcon, FileSpreadsheet, Presentation,
  File as FileIcon, Download, Archive, RotateCcw, Trash2, Send, Inbox,
  RefreshCw, Loader2, Search, Users, School as SchoolIcon, GraduationCap, X, Check,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatDate, formatBytes } from '@/lib/format'
import { ScopeChips, SectionLabel } from '@/components/student/shell/page-header'
import { useAcademicSession } from '@/lib/academic-session'
import {
  fetchSchoolMaterials,
  fetchUploadContext,
  uploadMaterial,
  patchMaterial,
  deleteMaterial,
  materialFileUrl,
  type StudyMaterialDto,
  type UploadContext,
} from '@/lib/study-materials/client'
import { toast } from 'sonner'

/* ── Type meta ──────────────────────────────────────────────────────────── */

const KIND_META: Record<string, { icon: typeof FileText; label: string; tint: string }> = {
  pdf: { icon: FileText, label: 'PDF', tint: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  image: { icon: ImageIcon, label: 'Image', tint: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  doc: { icon: FileText, label: 'Document', tint: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  sheet: { icon: FileSpreadsheet, label: 'Sheet', tint: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  slides: { icon: Presentation, label: 'Slides', tint: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  text: { icon: FileIcon, label: 'Text', tint: 'bg-muted text-muted-foreground' },
}

function kindMeta(kind: string) {
  return KIND_META[kind] ?? KIND_META.text
}

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'DRAFT', label: 'Drafts' },
  { key: 'ARCHIVED', label: 'Archived' },
] as const

/* ── Manager ────────────────────────────────────────────────────────────── */

export interface StudyMaterialsManagerProps {
  /** May publish school-wide material (principal / authorized admin). */
  canTargetSchool: boolean
  /** May archive/delete ANY material (principal / admin). Teachers: own only. */
  canManageAll: boolean
  /** Display name of the acting staff member (marks "yours" rows). */
  actorName: string
}

export function StudyMaterialsManager({ canTargetSchool, canManageAll, actorName }: StudyMaterialsManagerProps) {
  const session = useAcademicSession()
  const [materials, setMaterials] = useState<StudyMaterialDto[] | null>(null)
  const [context, setContext] = useState<UploadContext | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [statusTab, setStatusTab] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<StudyMaterialDto | null>(null)

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let alive = true
    fetchSchoolMaterials()
      .then((list) => alive && (setMaterials(list), setError(null)))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Could not load materials.'))
    fetchUploadContext()
      .then((ctx) => alive && setContext(ctx))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [reloadKey])

  const counts = useMemo(() => {
    const c = { all: materials?.length ?? 0, PUBLISHED: 0, DRAFT: 0, ARCHIVED: 0 }
    for (const m of materials ?? []) c[m.status] += 1
    return c
  }, [materials])

  const filtered = useMemo(() => {
    if (!materials) return []
    const q = query.trim().toLowerCase()
    return materials.filter((m) => {
      if (statusTab !== 'all' && m.status !== statusTab) return false
      if (!q) return true
      return (
        m.title.toLowerCase().includes(q) ||
        (m.subject?.toLowerCase().includes(q) ?? false) ||
        m.uploadedByName.toLowerCase().includes(q) ||
        (m.className?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [materials, statusTab, query])

  const handleStatus = async (m: StudyMaterialDto, status: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT') => {
    try {
      const updated = await patchMaterial(m.id, { status })
      setMaterials((prev) => prev?.map((x) => (x.id === updated.id ? updated : x)) ?? null)
      const verb = status === 'PUBLISHED' ? 'published' : status === 'ARCHIVED' ? 'archived' : 'restored to drafts'
      toast.success(`Material ${verb}`, { description: updated.title })
    } catch (e) {
      toast.error('Could not update material', { description: e instanceof Error ? e.message : undefined })
    }
  }

  const handleDelete = async (m: StudyMaterialDto) => {
    try {
      await deleteMaterial(m.id)
      setMaterials((prev) => prev?.filter((x) => x.id !== m.id) ?? null)
      setConfirmDelete(null)
      toast.success('Material deleted', { description: m.title })
    } catch (e) {
      toast.error('Could not delete material', { description: e instanceof Error ? e.message : undefined })
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <ScopeChips
        chips={[
          { label: session.label, tone: 'primary' },
          ...(materials ? [{ label: `${counts.PUBLISHED} published` }] : []),
        ]}
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by status">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatusTab(t.key)}
              aria-pressed={statusTab === t.key}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                statusTab === t.key
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
              )}
            >
              {t.label}
              {t.key !== 'all' && counts[t.key as keyof typeof counts] > 0 && (
                <span className="ml-1 tabular-nums opacity-70">{counts[t.key as keyof typeof counts]}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              aria-label="Search materials"
              className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button size="sm" className="h-9 gap-2" onClick={() => setAddOpen(true)}>
            <UploadCloud className="h-4 w-4" /> Add Material
          </Button>
        </div>
      </div>

      {/* States */}
      {materials === null && !error && (
        <GlassCard className="p-0">
          <div className="divide-y divide-border/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-4">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/5 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-3/5 animate-pulse rounded bg-muted/70" />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {error && (
        <GlassCard className="flex flex-col items-center gap-3 p-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <RefreshCw className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold">Couldn't load materials</p>
          <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" className="gap-2" onClick={reload}>
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </Button>
        </GlassCard>
      )}

      {materials !== null && !error && filtered.length === 0 && (
        <GlassCard className="flex flex-col items-center gap-2.5 p-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Inbox className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold text-muted-foreground">
            {materials.length === 0 ? 'No materials yet' : 'Nothing here'}
          </p>
          <p className="text-xs text-muted-foreground/70">
            Upload notes, worksheets or circulars and target them to your students.
          </p>
        </GlassCard>
      )}

      {materials !== null && !error && filtered.length > 0 && (
        <GlassCard className="p-0">
          <div className="px-4 pt-3.5 pb-1">
            <SectionLabel hint={`${filtered.length} shown`}>Repository</SectionLabel>
          </div>
          <div className="divide-y divide-border/60">
            {filtered.map((m, i) => (
              <ManagerRow
                key={m.id}
                material={m}
                index={i}
                mine={m.uploadedByName === actorName}
                canManageAll={canManageAll}
                onStatus={handleStatus}
                onDelete={setConfirmDelete}
              />
            ))}
          </div>
        </GlassCard>
      )}

      {/* Upload dialog */}
      {addOpen && (
        <UploadMaterialDialog
          context={context}
          canTargetSchool={canTargetSchool}
          onClose={() => setAddOpen(false)}
          onUploaded={(m) => {
            setMaterials((prev) => [m, ...(prev ?? [])])
            reload() // re-sync statuses/counts from the server list
          }}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <Dialog open onOpenChange={(open) => !open && setConfirmDelete(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogTitle>Delete material?</DialogTitle>
            <DialogDescription>
              “{confirmDelete.title}” will be removed for everyone. This cannot be undone.
            </DialogDescription>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => handleDelete(confirmDelete)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

/* ── Manager row ────────────────────────────────────────────────────────── */

function ManagerRow({ material, index, mine, canManageAll, onStatus, onDelete }: {
  material: StudyMaterialDto
  index: number
  mine: boolean
  canManageAll: boolean
  onStatus: (m: StudyMaterialDto, status: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT') => void
  onDelete: (m: StudyMaterialDto) => void
}) {
  const meta = kindMeta(material.kind)
  const Icon = meta.icon
  const canManage = mine || canManageAll

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.25) }}
      className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30 lg:flex-row lg:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', meta.tint)}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-foreground">{material.title}</p>
            {material.subject && (
              <Badge variant="secondary" className="bg-muted text-[10px] text-muted-foreground">{material.subject}</Badge>
            )}
            {material.status === 'DRAFT' && <StatusBadge status="Draft" variant="warning" dot />}
            {material.status === 'ARCHIVED' && <StatusBadge status="Archived" variant="neutral" dot />}
            {mine && <StatusBadge status="Yours" variant="info" />}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            <AudienceTag material={material} />
            {meta.label}
            {material.sizeBytes > 0 && <> · {formatBytes(material.sizeBytes)}</>}
            {' · '}
            {material.uploadedByName}
            {' · '}
            {formatDate(material.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5 lg:justify-end">
        <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2.5 text-muted-foreground" asChild>
          <a href={materialFileUrl(material.id, true)} download={material.fileName}>
            <Download className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:text-xs">Download</span>
          </a>
        </Button>
        {canManage && material.status === 'DRAFT' && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 px-2.5 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            onClick={() => onStatus(material, 'PUBLISHED')}
          >
            <Send className="h-3.5 w-3.5" /> Publish
          </Button>
        )}
        {canManage && material.status === 'PUBLISHED' && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 px-2.5 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400"
            onClick={() => onStatus(material, 'ARCHIVED')}
          >
            <Archive className="h-3.5 w-3.5" /> Archive
          </Button>
        )}
        {canManage && material.status === 'ARCHIVED' && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 px-2.5 text-xs"
            onClick={() => onStatus(material, 'PUBLISHED')}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restore
          </Button>
        )}
        {canManage && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1 px-2.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400"
            onClick={() => onDelete(material)}
          >
            <Trash2 className="h-3.5 w-3.5" /> <span className="sr-only">Delete</span>
          </Button>
        )}
      </div>
    </motion.div>
  )
}

function AudienceTag({ material }: { material: StudyMaterialDto }) {
  const icon =
    material.audience === 'SCHOOL' ? SchoolIcon : material.audience === 'CLASS' ? GraduationCap : Users
  const Icon = icon
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="h-3 w-3 text-muted-foreground/70" aria-hidden />
      {material.audienceLabel}
      {' · '}
    </span>
  )
}

/* ── Upload dialog (spec §6) ───────────────────────────────────────────── */

type Audience = 'SCHOOL' | 'CLASS' | 'STUDENTS'

function UploadMaterialDialog({ context, canTargetSchool, onClose, onUploaded }: {
  context: UploadContext | null
  canTargetSchool: boolean
  onClose: () => void
  onUploaded: (m: StudyMaterialDto) => void
}) {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [audience, setAudience] = useState<Audience>(canTargetSchool ? 'CLASS' : 'CLASS')
  const [classId, setClassId] = useState('')
  const [studentIds, setStudentIds] = useState<Set<string>>(new Set())
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const audienceOptions: { key: Audience; label: string; icon: typeof SchoolIcon }[] = [
    ...(canTargetSchool ? [{ key: 'SCHOOL' as Audience, label: 'Whole school', icon: SchoolIcon }] : []),
    { key: 'CLASS', label: 'Class', icon: GraduationCap },
    { key: 'STUDENTS', label: 'Selected students', icon: Users },
  ]

  // Students pickable for STUDENTS targeting — searchable, class-labeled.
  const [studentQuery, setStudentQuery] = useState('')
  const pickableStudents = useMemo(() => {
    if (!context) return []
    const q = studentQuery.trim().toLowerCase()
    return context.students.filter(
      (s) => !q || s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)
    )
  }, [context, studentQuery])

  const toggleStudent = (id: string) => {
    setStudentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const valid =
    title.trim().length > 0 &&
    !!file &&
    (audience !== 'CLASS' || !!classId) &&
    (audience !== 'STUDENTS' || studentIds.size > 0)

  const submit = async (status: 'PUBLISHED' | 'DRAFT') => {
    if (!valid || !file) return
    setSubmitting(true)
    try {
      const created = await uploadMaterial({
        title: title.trim(),
        subject: subject.trim() || null,
        description: description.trim() || null,
        audience,
        classId: audience === 'CLASS' ? classId : null,
        studentIds: audience === 'STUDENTS' ? [...studentIds] : [],
        status,
        file,
      })
      toast.success(status === 'PUBLISHED' ? 'Material published' : 'Saved as draft', {
        description: created.title,
      })
      onUploaded(created)
      onClose()
    } catch (e) {
      toast.error('Upload failed', { description: e instanceof Error ? e.message : undefined })
    } finally {
      setSubmitting(false)
    }
  }

  const chosenClass = context?.classes.find((c) => c.id === classId)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogTitle>Add Study Material</DialogTitle>
        <DialogDescription>
          Upload once — students see it the moment it's published, based on the audience you pick.
        </DialogDescription>

        <div className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="material-title" className="mb-1.5 block text-xs font-semibold text-foreground">
              Title
            </label>
            <input
              id="material-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={140}
              placeholder="e.g. Fractions — Revision Notes"
              className="h-9 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="material-subject" className="mb-1.5 block text-xs font-semibold text-foreground">
              Subject <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="material-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              list="material-subjects"
              maxLength={60}
              placeholder="e.g. Mathematics"
              className="h-9 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
            <datalist id="material-subjects">
              {(context?.subjects ?? []).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {/* Audience */}
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-foreground">Target audience</span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Target audience">
              {audienceOptions.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setAudience(o.key)}
                  aria-pressed={audience === o.key}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    audience === o.key
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
                  )}
                >
                  <o.icon className="h-3.5 w-3.5" aria-hidden /> {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Class picker */}
          {audience === 'CLASS' && (
            <div>
              <label htmlFor="material-class" className="mb-1.5 block text-xs font-semibold text-foreground">
                Class
              </label>
              <select
                id="material-class"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Pick a class…</option>
                {(context?.classes ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Student picker */}
          {audience === 'STUDENTS' && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Students <span className="font-normal text-muted-foreground">({studentIds.size} selected)</span>
                </span>
                {studentIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setStudentIds(new Set())}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
              {studentIds.size > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {[...studentIds].map((id) => {
                    const s = context?.students.find((x) => x.id === id)
                    const cls = context?.classes.find((c) => c.id === s?.classId)
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleStudent(id)}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/[0.07] px-2 py-0.5 text-[11px] font-medium text-primary"
                      >
                        {s?.name}
                        {cls ? ` · ${cls.name}` : ''}
                        <X className="h-3 w-3" aria-hidden />
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Search students…"
                  aria-label="Search students"
                  className="mb-2 h-9 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="max-h-44 overflow-y-auto rounded-xl border border-border bg-card">
                {!context ? (
                  <p className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading roster…
                  </p>
                ) : pickableStudents.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">No students match.</p>
                ) : (
                  pickableStudents.slice(0, 60).map((s) => {
                    const selected = studentIds.has(s.id)
                    const cls = context.classes.find((c) => c.id === s.classId)
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleStudent(s.id)}
                        className={cn(
                          'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-muted/50',
                          selected && 'bg-primary/[0.06]',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                            selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                          )}
                          aria-hidden
                        >
                          {selected && <Check className="h-3 w-3" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs font-medium">{s.name}</span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {cls?.name ?? ''}
                          {s.rollNo ? ` · Roll ${s.rollNo}` : ''}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* File */}
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-foreground">File</span>
            <input
              ref={fileRef}
              type="file"
              className="sr-only"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                'flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-5 transition-colors',
                file
                  ? 'border-emerald-500/40 bg-emerald-500/[0.04]'
                  : 'border-border hover:border-primary/40 hover:bg-primary/[0.03]',
              )}
            >
              {file ? (
                <>
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <span className="max-w-full truncate text-sm font-semibold">{file.name}</span>
                  <span className="text-[11px] text-muted-foreground">{formatBytes(file.size)}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-5 w-5 text-muted-foreground" aria-hidden />
                  <span className="text-sm font-medium">Choose a file</span>
                  <span className="text-[11px] text-muted-foreground">PDF, image, Word, Excel, slides · max 15 MB</span>
                </>
              )}
            </button>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="material-desc" className="mb-1.5 block text-xs font-semibold text-foreground">
              Short description <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="material-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={400}
              rows={2}
              placeholder="One line about what this material covers"
              className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="sm" disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!valid || submitting}
            onClick={() => submit('DRAFT')}
          >
            <Archive className="h-3.5 w-3.5" /> Save as Draft
          </Button>
          <Button size="sm" className="gap-1.5" disabled={!valid || submitting} onClick={() => submit('PUBLISHED')}>
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {audience === 'SCHOOL' && canTargetSchool ? 'Publish to school' : 'Publish'}
          </Button>
        </div>
        {valid && audience === 'CLASS' && chosenClass && (
          <p className="mt-1 text-center text-[11px] text-muted-foreground">
            {chosenClass.name} students will see this immediately.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
