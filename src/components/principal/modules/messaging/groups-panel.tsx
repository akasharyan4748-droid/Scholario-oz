'use client'

/**
 * GroupsPanel — Group management UI for the Messages & Inbox module.
 *
 * Surfaces when the "Groups" folder is active (replaces the conversation
 * list). Each row shows the group's avatar, name, type pill, member count
 * and last activity (from the linked conversation). Clicking a row opens
 * the linked group conversation in the thread view; the "Members" button
 * opens the manage-members dialog; the "Compose" button opens the compose
 * modal with the group pre-selected as recipient.
 *
 * Create Group dialog: name + type + smart auto-fill (Class Group →
 * class+section → parents of that class section; Teachers Group → class →
 * teachers of that class; Department Group → department → teachers in
 * that department; Staff Group → all staff) plus a manual member picker
 * (search teachers + parents from canonical data — NO duplicate data).
 *
 * Manage Members dialog: list current members with remove buttons + add
 * a single member at a time via the SearchableSelect.
 *
 * SCHOLARIO visual language preserved: rounded-xl cards, soft tinted
 * type pills, emerald → teal gradient on primary CTAs, violet → purple
 * gradient on group avatars (consistent with the existing group colour).
 */

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Users, Search, Settings2, MessageSquare, Trash2, UserPlus,
  ChevronRight, X, GraduationCap, UserCog, Users2, Briefcase, Pencil,
  Clock, Check,
} from 'lucide-react'
import {
  useMessagingStore,
  resolveMemberRefs,
  resolveMemberRef,
  getParentsOfClassSection,
  getTeachersOfClass,
  getTeachersOfDepartment,
  getAllStaffRefs,
  formatTimeAgo,
  type GroupType,
  GROUP_TYPE_LIST,
  type Group,
  type MemberDisplay,
} from '@/lib/store/messaging-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { teachers } from '@/lib/mock/teachers'
import { ACADEMIC_CLASSES } from '@/lib/mock/academic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { SearchableSelect } from '@/components/principal/modules/shared/searchable-select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Visual config ────────────────────────────────────────────────────

const TYPE_ICON: Record<GroupType, React.ReactNode> = {
  'Class Group': <GraduationCap className="h-3 w-3" />,
  'Teachers Group': <UserCog className="h-3 w-3" />,
  'Staff Group': <Users2 className="h-3 w-3" />,
  'Department Group': <Briefcase className="h-3 w-3" />,
  'Parents Group': <Users className="h-3 w-3" />,
  'Custom Group': <Pencil className="h-3 w-3" />,
}

const TYPE_PILL: Record<GroupType, string> = {
  'Class Group': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  'Teachers Group': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  'Staff Group': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'Department Group': 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  'Parents Group': 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  'Custom Group': 'bg-muted text-muted-foreground',
}

function avatarFromName(name: string): string {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'G'
}

// ─── Member pool (teachers + parents from canonical data) ─────────────

interface PoolMember {
  ref: string
  name: string
  avatar: string
  role: string
  type: 'teacher' | 'parent'
}

function getMemberPool(): PoolMember[] {
  const students = useStudentsStore.getState().students
  const activeStudents = students.filter((s) => s.status === 'Active')

  const teachersPool: PoolMember[] = teachers
    .filter((t) => !t.archived)
    .map((t) => ({
      ref: `t:${t.id}`,
      name: t.name,
      avatar: t.avatar,
      role: `${t.designation} · ${t.department}`,
      type: 'teacher' as const,
    }))

  const parentsPool: PoolMember[] = activeStudents.map((s) => ({
    ref: `p:${s.id}`,
    name: s.fatherName,
    avatar: s.fatherName.split(' ').map((n) => n[0]).slice(0, 2).join(''),
    role: `Parent · ${s.name} (${s.className}-${s.section})`,
    type: 'parent' as const,
  }))

  return [...teachersPool, ...parentsPool]
}

// ─── Props ────────────────────────────────────────────────────────────

interface Props {
  /** Open the compose modal. Optional preselected recipient name. */
  onCompose: (recipientName?: string) => void
}

// ─── GroupsPanel ──────────────────────────────────────────────────────

export function GroupsPanel({ onCompose }: Props) {
  const groups = useMessagingStore((s) => s.groups)
  const conversations = useMessagingStore((s) => s.conversations)
  const openConversation = useMessagingStore((s) => s.openConversation)
  const searchQuery = useMessagingStore((s) => s.searchQuery)
  const setSearchQuery = useMessagingStore((s) => s.setSearchQuery)
  const activeConversationId = useMessagingStore((s) => s.activeConversationId)
  const deleteGroup = useMessagingStore((s) => s.deleteGroup)

  const [createOpen, setCreateOpen] = useState(false)
  const [manageGroup, setManageGroup] = useState<Group | null>(null)

  // Filter groups by search query (name or type)
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return groups
    return groups.filter(
      (g) => g.name.toLowerCase().includes(q) || g.type.toLowerCase().includes(q),
    )
  }, [groups, searchQuery])

  const handleOpenChat = (g: Group) => {
    openConversation(g.conversationId)
  }

  const handleDelete = (g: Group) => {
    deleteGroup(g.id)
    toast.success('Group deleted', { description: g.name })
  }

  return (
    <div className="flex flex-col border-r border-border bg-card min-w-0">
      {/* Header — search + Create Group */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups…"
            className="w-full h-8 pl-8 pr-8 text-xs rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Create Group
        </button>
      </div>

      {/* Groups list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length > 0 ? (
          filtered.map((g) => {
            const convo = conversations.find((c) => c.id === g.conversationId)
            const memberCount = g.memberRefs.length
            const isActive = activeConversationId === g.conversationId
            const lastActivity = convo ? formatTimeAgo(convo.lastTimestamp) : '—'
            const lastMessage = convo?.lastMessage ?? 'No messages yet'
            const unread = convo?.unread ?? 0
            return (
              <GroupRow
                key={g.id}
                group={g}
                isActive={isActive}
                memberCount={memberCount}
                lastActivity={lastActivity}
                lastMessage={lastMessage}
                unread={unread}
                onOpenChat={() => handleOpenChat(g)}
                onManage={() => setManageGroup(g)}
                onCompose={() => onCompose(g.name)}
                onDelete={() => handleDelete(g)}
              />
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-medium text-muted-foreground">
              {searchQuery ? 'No groups match your search' : 'No groups yet'}
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5 mb-3">
              {searchQuery ? 'Try a different search term.' : 'Create a group to start a group conversation.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Plus className="h-3 w-3" /> Create Group
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Group dialog */}
      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Manage Members dialog */}
      <ManageMembersDialog
        group={manageGroup}
        onOpenChange={(open) => { if (!open) setManageGroup(null) }}
      />
    </div>
  )
}

// ─── GroupRow ─────────────────────────────────────────────────────────

function GroupRow({
  group, isActive, memberCount, lastActivity, lastMessage, unread,
  onOpenChat, onManage, onCompose, onDelete,
}: {
  group: Group
  isActive: boolean
  memberCount: number
  lastActivity: string
  lastMessage: string
  unread: number
  onOpenChat: () => void
  onManage: () => void
  onCompose: () => void
  onDelete: () => void
}) {
  const [hover, setHover] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div
      onClick={onOpenChat}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setMenuOpen(false) }}
      className={cn(
        'relative cursor-pointer px-3 py-2.5 border-b border-border/30 transition-colors group',
        isActive ? 'bg-primary/5' : 'hover:bg-muted/30',
        unread > 0 && 'bg-muted/20',
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-[11px] font-semibold">
          {avatarFromName(group.name)}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className={cn('text-xs truncate', unread > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground/80')}>
              {group.name}
            </p>
            <span className="text-[9px] text-muted-foreground shrink-0 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {lastActivity}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
              TYPE_PILL[group.type],
            )}>
              {TYPE_ICON[group.type]}
              {group.type}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground tabular-nums">
              <Users className="h-2.5 w-2.5" />
              {memberCount} member{memberCount === 1 ? '' : 's'}
            </span>
            {unread > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[8px] font-bold tabular-nums ml-auto">
                {unread}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{lastMessage}</p>
        </div>
      </div>

      {/* Hover actions */}
      {hover && (
        <div className="absolute right-2 top-2 flex items-center gap-0.5 bg-card border border-border rounded-md shadow-sm p-0.5 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onCompose() }}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-emerald-500"
            title="Compose to group"
          >
            <MessageSquare className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onManage() }}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-violet-500"
            title="Manage members"
          >
            <Settings2 className="h-3 w-3" />
          </button>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
              title="More"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
                <div className="absolute right-0 mt-1 w-32 rounded-md border border-border bg-card shadow-md z-20 py-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onManage() }}
                    className="w-full text-left px-2.5 py-1.5 text-[10px] hover:bg-muted/40 flex items-center gap-1.5"
                  >
                    <Settings2 className="h-3 w-3" /> Manage members
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onCompose() }}
                    className="w-full text-left px-2.5 py-1.5 text-[10px] hover:bg-muted/40 flex items-center gap-1.5"
                  >
                    <MessageSquare className="h-3 w-3" /> Compose to group
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete() }}
                    className="w-full text-left px-2.5 py-1.5 text-[10px] hover:bg-muted/40 flex items-center gap-1.5 text-rose-600"
                  >
                    <Trash2 className="h-3 w-3" /> Delete group
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CreateGroupDialog ────────────────────────────────────────────────

function CreateGroupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createGroup = useMessagingStore((s) => s.createGroup)
  const [name, setName] = useState('')
  const [type, setType] = useState<GroupType>('Class Group')
  // Smart picker state
  const [className, setClassName] = useState<string>('') // e.g. "Class 10"
  const [section, setSection] = useState<string>('')      // e.g. "A"
  const [department, setDepartment] = useState<string>('') // e.g. "Science"
  const [allStaff, setAllStaff] = useState(false)
  // Members
  const [selectedRefs, setSelectedRefs] = useState<string[]>([])
  const [memberSearch, setMemberSearch] = useState('')

  const pool = useMemo(() => getMemberPool(), [])

  // Class + section + department options (deduped)
  const classOptions = useMemo(() => {
    const seen = new Set<string>()
    const out: { id: string; label: string }[] = []
    for (const c of ACADEMIC_CLASSES) {
      if (!seen.has(c.name)) {
        seen.add(c.name)
        out.push({ id: c.name, label: c.name })
      }
    }
    return out
  }, [])
  const sectionOptions = useMemo(() => {
    const cls = ACADEMIC_CLASSES.find((c) => c.name === className)
    return (cls?.sections ?? []).map((s) => ({ id: s, label: s }))
  }, [className])
  const departmentOptions = useMemo(() => {
    const seen = new Set<string>()
    const out: { id: string; label: string }[] = []
    for (const t of teachers) {
      if (t.archived) continue
      if (!seen.has(t.department)) {
        seen.add(t.department)
        out.push({ id: t.department, label: t.department })
      }
    }
    return out
  }, [])

  // Smart auto-fill: when the user picks a class+section / class / department,
  // pre-fill the suggested members and a suggested name. The user can still
  // tweak both before submitting.
  const smartFill = useMemo(() => {
    if (type === 'Class Group' || type === 'Parents Group') {
      if (!className || !section) return null
      const refs = getParentsOfClassSection(className, section)
      const suggestedName = `${className}-${section} Parents`
      return { refs, suggestedName }
    }
    if (type === 'Teachers Group') {
      if (!className) return null
      // Pull teachers across all sections of this class
      const cls = ACADEMIC_CLASSES.find((c) => c.name === className)
      const sections = cls?.sections ?? ['A']
      const refs = Array.from(new Set(sections.flatMap((s) => getTeachersOfClass(`${className}-${s}`))))
      const suggestedName = `${className} Teachers`
      return { refs, suggestedName }
    }
    if (type === 'Department Group') {
      if (!department) return null
      const refs = getTeachersOfDepartment(department)
      const suggestedName = `${department} Department`
      return { refs, suggestedName }
    }
    if (type === 'Staff Group') {
      const refs = getAllStaffRefs()
      const suggestedName = 'All Staff'
      return { refs, suggestedName }
    }
    return null
  }, [type, className, section, department])

  // Reset on dialog open + when type changes (clear smart picker state)
  useEffect(() => {
    if (open) {
      setName('')
      setType('Class Group')
      setClassName('')
      setSection('')
      setDepartment('')
      setAllStaff(false)
      setSelectedRefs([])
      setMemberSearch('')
    }
  }, [open])

  // When smart-fill produces a suggestion, sync the name (if user hasn't typed
  // anything yet) and merge the suggested refs into the selection (without
  // losing any the user has explicitly added).
  useEffect(() => {
    if (!open) return
    if (smartFill) {
      setName((prev) => prev || smartFill.suggestedName)
      setSelectedRefs((prev) => Array.from(new Set([...prev, ...smartFill.refs])))
    }
  }, [smartFill, open])

  // Filter the pool by member search
  const filteredPool = useMemo(() => {
    const q = memberSearch.trim().toLowerCase()
    if (!q) return pool
    return pool.filter((p) => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q))
  }, [pool, memberSearch])

  const selectedSet = useMemo(() => new Set(selectedRefs), [selectedRefs])
  const selectedMembers = useMemo(
    () => selectedRefs.map(resolveMemberRef).filter((x): x is MemberDisplay => x !== null),
    [selectedRefs],
  )

  const canSubmit = name.trim().length > 0 && selectedRefs.length > 0

  const toggleMember = (ref: string) => {
    setSelectedRefs((prev) => prev.includes(ref) ? prev.filter((r) => r !== ref) : [...prev, ref])
  }

  const clearSmart = () => {
    setSelectedRefs([])
    setName('')
  }

  const handleSubmit = () => {
    if (!canSubmit) {
      if (!name.trim()) toast.error('Group name is required')
      else if (selectedRefs.length === 0) toast.error('Add at least one member')
      return
    }
    createGroup({ name: name.trim(), type, memberRefs: selectedRefs })
    toast.success('Group created', {
      description: `${name.trim()} · ${selectedRefs.length} member${selectedRefs.length === 1 ? '' : 's'}`,
    })
    onOpenChange(false)
  }

  // Type select options
  const typeOptions = GROUP_TYPE_LIST

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-violet-600" />
            Create Group
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pick a type to auto-fill members from your school's teachers and parents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Group name */}
          <div className="space-y-1">
            <Label className="text-[11px] flex items-center gap-1.5">
              <Pencil className="h-3 w-3" /> Group Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Class 10-A Parents, Sports Committee…"
              className="h-9 text-sm"
            />
          </div>

          {/* Group type */}
          <div className="space-y-1">
            <Label className="text-[11px] flex items-center gap-1.5">
              <Briefcase className="h-3 w-3" /> Group Type
            </Label>
            <div className="grid grid-cols-3 gap-1.5">
              {typeOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setSelectedRefs([]); setName('') }}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1.5 rounded-md border text-[10px] font-medium transition-colors',
                    type === t
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/40',
                  )}
                >
                  {TYPE_ICON[t]}
                  <span className="truncate">{t.replace(' Group', '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Smart picker — varies by type */}
          {(type === 'Class Group' || type === 'Parents Group') && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Class</Label>
                <SearchableSelect
                  selectedId={className}
                  onSelect={setClassName}
                  placeholder="Pick a class"
                  options={classOptions}
                  pickerId="grp-class"
                  popoverWidth="w-56"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Section</Label>
                <SearchableSelect
                  selectedId={section}
                  onSelect={setSection}
                  placeholder="Pick a section"
                  options={sectionOptions}
                  pickerId="grp-section"
                  popoverWidth="w-40"
                />
              </div>
            </div>
          )}

          {type === 'Teachers Group' && (
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Class</Label>
              <SearchableSelect
                selectedId={className}
                onSelect={setClassName}
                placeholder="Pick a class (teachers across all sections)"
                options={classOptions}
                pickerId="grp-tch-class"
                popoverWidth="w-56"
              />
            </div>
          )}

          {type === 'Department Group' && (
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Department</Label>
              <SearchableSelect
                selectedId={department}
                onSelect={setDepartment}
                placeholder="Pick a department"
                options={departmentOptions}
                pickerId="grp-dept"
                popoverWidth="w-56"
              />
            </div>
          )}

          {type === 'Staff Group' && (
            <div className="rounded-md bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border border-amber-500/20 px-3 py-2 text-[11px] text-muted-foreground">
              <span className="font-semibold text-amber-700 dark:text-amber-300">All Staff:</span>{' '}
              All active teachers will be added as members. Untick the ones you want to exclude.
            </div>
          )}

          {type === 'Custom Group' && (
            <div className="rounded-md bg-muted/40 border border-border px-3 py-2 text-[11px] text-muted-foreground">
              Custom group — pick members manually below.
            </div>
          )}

          {/* Smart-fill hint */}
          {smartFill && smartFill.refs.length > 0 && (
            <div className="rounded-md bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border border-emerald-500/20 px-3 py-2 text-[11px] text-muted-foreground flex items-center justify-between gap-2">
              <span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">Auto-filled:</span>{' '}
                {smartFill.refs.length} member{smartFill.refs.length === 1 ? '' : 's'} from{' '}
                {type === 'Class Group' || type === 'Parents Group' ? `${className}-${section}` :
                  type === 'Teachers Group' ? className :
                  type === 'Department Group' ? department :
                  'all staff'}.
              </span>
              <button
                type="button"
                onClick={clearSmart}
                className="text-[10px] text-muted-foreground hover:text-foreground underline shrink-0"
              >
                Clear
              </button>
            </div>
          )}

          {/* Selected members */}
          <div className="space-y-1">
            <Label className="text-[11px] flex items-center justify-between">
              <span>Members ({selectedRefs.length})</span>
              {selectedRefs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRefs([])}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </Label>
            {selectedMembers.length > 0 ? (
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto rounded-md border border-border bg-muted/20 p-2">
                {selectedMembers.map((m) => (
                  <span
                    key={m.ref}
                    className="inline-flex items-center gap-1 rounded-full bg-card border border-border pl-1.5 pr-1 py-0.5 text-[10px]"
                  >
                    <span className={cn(
                      'h-3.5 w-3.5 rounded-full text-white text-[7px] font-bold flex items-center justify-center',
                      m.type === 'teacher'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        : 'bg-gradient-to-br from-amber-500 to-orange-600',
                    )}>
                      {m.avatar}
                    </span>
                    <span className="font-medium">{m.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleMember(m.ref)}
                      className="text-muted-foreground hover:text-rose-500"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">No members selected yet.</p>
            )}
          </div>

          {/* Member picker — search + checkbox list */}
          <div className="space-y-1">
            <Label className="text-[11px] flex items-center gap-1.5">
              <UserPlus className="h-3 w-3" /> Add Members
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search teachers or parents…"
                className="h-9 pl-8 text-xs"
              />
            </div>
            <div className="max-h-44 overflow-y-auto rounded-md border border-border divide-y divide-border/30">
              {filteredPool.slice(0, 60).map((p) => {
                const selected = selectedSet.has(p.ref)
                return (
                  <button
                    key={p.ref}
                    type="button"
                    onClick={() => toggleMember(p.ref)}
                    className={cn(
                      'w-full px-2.5 py-1.5 flex items-center gap-2 text-left transition-colors',
                      selected ? 'bg-emerald-500/[0.06] dark:bg-emerald-500/[0.08]' : 'hover:bg-muted/40',
                    )}
                  >
                    <div className={cn(
                      'h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0',
                      selected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-border',
                    )}>
                      {selected && <Check className="h-2.5 w-2.5" />}
                    </div>
                    <div className={cn(
                      'h-6 w-6 shrink-0 rounded-full text-white text-[8px] font-bold flex items-center justify-center',
                      p.type === 'teacher'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        : 'bg-gradient-to-br from-amber-500 to-orange-600',
                    )}>
                      {p.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium truncate">{p.name}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{p.role}</p>
                    </div>
                    <span className={cn(
                      'text-[8px] font-semibold px-1 py-0.5 rounded',
                      p.type === 'teacher' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
                    )}>
                      {p.type === 'teacher' ? 'Staff' : 'Parent'}
                    </span>
                  </button>
                )
              })}
              {filteredPool.length === 0 && (
                <p className="px-3 py-4 text-[10px] text-muted-foreground text-center">No matches.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── ManageMembersDialog ─────────────────────────────────────────────

function ManageMembersDialog({
  group, onOpenChange,
}: {
  group: Group | null
  onOpenChange: (open: boolean) => void
}) {
  const addMember = useMessagingStore((s) => s.addMember)
  const removeMember = useMessagingStore((s) => s.removeMember)
  const groups = useMessagingStore((s) => s.groups)
  const [addRef, setAddRef] = useState('')

  // Always read the latest group state from the store so member add/remove
  // updates show without remounting.
  const liveGroup = group ? groups.find((g) => g.id === group.id) : null
  const members = useMemo(
    () => liveGroup ? resolveMemberRefs(liveGroup.memberRefs) : [],
    [liveGroup],
  )

  const pool = useMemo(() => getMemberPool(), [])
  const memberSet = useMemo(() => new Set(liveGroup?.memberRefs ?? []), [liveGroup])
  const addable = useMemo(
    () => pool
      .filter((p) => !memberSet.has(p.ref))
      .map((p) => ({ id: p.ref, label: p.name, avatar: p.avatar, meta: p.role })),
    [pool, memberSet],
  )

  useEffect(() => {
    setAddRef('')
  }, [group?.id])

  const handleAdd = () => {
    if (!liveGroup || !addRef) return
    const result = addMember(liveGroup.id, addRef)
    if (!result.success) {
      toast.error(result.error || 'Could not add member')
      return
    }
    const display = resolveMemberRef(addRef)
    toast.success('Member added', {
      description: display ? `${display.name} added to ${liveGroup.name}` : 'Member added',
    })
    setAddRef('')
  }

  const handleRemove = (ref: string) => {
    if (!liveGroup) return
    const display = resolveMemberRef(ref)
    removeMember(liveGroup.id, ref)
    toast.success('Member removed', {
      description: display ? `${display.name} removed from ${liveGroup.name}` : 'Member removed',
    })
  }

  if (!group) return null

  return (
    <Dialog open={!!group} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-[10px] font-semibold">
              {avatarFromName(group.name)}
            </div>
            {group.name}
          </DialogTitle>
          <DialogDescription className="text-xs flex items-center gap-1.5">
            <span className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
              TYPE_PILL[group.type],
            )}>
              {TYPE_ICON[group.type]}
              {group.type}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground tabular-nums">
              <Users className="h-2.5 w-2.5" />
              {members.length} member{members.length === 1 ? '' : 's'}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Add member */}
          <div className="space-y-1">
            <Label className="text-[11px] flex items-center gap-1.5">
              <UserPlus className="h-3 w-3" /> Add a Member
            </Label>
            <div className="flex items-end gap-1.5">
              <div className="flex-1 min-w-0">
                <SearchableSelect
                  selectedId={addRef}
                  onSelect={setAddRef}
                  placeholder="Search teachers or parents…"
                  options={addable}
                  pickerId="grp-add-member"
                  popoverWidth="w-64"
                />
              </div>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!addRef}
                className="h-9 gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            {addable.length === 0 && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Everyone is already a member of this group.
              </p>
            )}
          </div>

          {/* Current members */}
          <div className="space-y-1">
            <Label className="text-[11px] flex items-center justify-between">
              <span>Current Members ({members.length})</span>
            </Label>
            <div className="max-h-64 overflow-y-auto rounded-md border border-border divide-y divide-border/30">
              {members.length > 0 ? (
                members.map((m) => (
                  <div key={m.ref} className="px-2.5 py-1.5 flex items-center gap-2 hover:bg-muted/30">
                    <div className={cn(
                      'h-7 w-7 shrink-0 rounded-full text-white text-[9px] font-bold flex items-center justify-center',
                      m.type === 'teacher'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        : 'bg-gradient-to-br from-amber-500 to-orange-600',
                    )}>
                      {m.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium truncate">{m.name}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{m.role}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(m.ref)}
                      className="p-1 text-muted-foreground hover:text-rose-500 rounded hover:bg-muted"
                      title="Remove from group"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="px-3 py-4 text-[10px] text-muted-foreground text-center">
                  No members yet. Add some above.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
