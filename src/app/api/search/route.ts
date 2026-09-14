import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import { requireStudent, authorizedMaterials } from '@/lib/learning'
import type { SearchResultItem } from '@/lib/search-service/types'

export const runtime = 'nodejs'

// GET /api/search?q=... — DB-backed global search across people, fees,
// notices — and, for students, their authorized LEARNING content (L2D
// spec §50: resources, flashcard decks, study groups). Role-aware (spec
// §9/§78): students never enumerate other students, other families'
// contact details or other students' fee rows — every result they see is
// either theirs, school-wide public (notices) or authorized learning.
export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const q = (req.nextUrl.searchParams.get('q') || '').trim()
    if (q.length < 2) return { results: [] }

    const schoolId = user.schoolId
    if (!schoolId) return { results: [] }

    const isStudent = user.role === 'STUDENT'
    // Students navigate the student workspace — module keys resolve there.
    const navNotice = isStudent ? 'notices' : 'communication'
    const navMessaging = isStudent ? 'messages' : 'messaging'

    const results: SearchResultItem[] = []
    const take = 6

    // 1. STUDENTS — search by name (User relation), admission no, roll no
    //    (staff surfaces only — students must not enumerate classmates)
    if (!isStudent) {
    const students = await db.student.findMany({
      where: {
        schoolId,
        OR: [
          { user: { name: { contains: q } } },
          { admissionNo: { contains: q } },
          { rollNo: { contains: q } },
        ],
      },
      take,
      include: {
        user: { select: { name: true, status: true } },
        class: { select: { name: true, section: true } },
      },
    })
    students.forEach((s) => {
      const cls = s.class ? `${s.class.name}${s.class.section ? `-${s.class.section}` : ''}` : 'Unassigned'
      results.push({
        id: `stu-${s.id}`,
        title: s.user?.name ?? 'Unnamed student',
        subtitle: `${cls} · Adm: ${s.admissionNo ?? '—'} · Roll: ${s.rollNo ?? '—'}`,
        category: 'Students',
        type: 'student',
        moduleKey: 'students',
        iconName: 'User',
        badge: s.user?.status === 'ACTIVE' ? cls : (s.user?.status ?? 'Unknown'),
        badgeVariant: s.user?.status === 'ACTIVE' ? 'success' : 'warning',
        keywords: `${s.admissionNo ?? ''} ${s.rollNo ?? ''} ${s.guardianName ?? ''} student`,
      })
    })
    }

    // 2. TEACHERS — search by name, employee id (staff directory — not a
    //    student surface; students get faculty context via Learning instead)
    if (!isStudent) {
    const teachers = await db.teacher.findMany({
      where: {
        schoolId,
        OR: [
          { user: { name: { contains: q } } },
          { employeeId: { contains: q } },
          { department: { contains: q } },
        ],
      },
      take,
      include: { user: { select: { name: true, email: true, status: true } } },
    })
    teachers.forEach((t) => {
      results.push({
        id: `tch-${t.id}`,
        title: t.user?.name ?? 'Unnamed teacher',
        subtitle: `${t.department ?? 'Faculty'}${t.employeeId ? ` · Emp: ${t.employeeId}` : ''}${t.user?.email ? ` · ${t.user.email}` : ''}`,
        category: 'Teachers & Faculty',
        type: 'teacher',
        moduleKey: 'teachers',
        iconName: 'GraduationCap',
        badge: t.user?.status === 'ACTIVE' ? 'Active' : (t.user?.status ?? 'Unknown'),
        badgeVariant: t.user?.status === 'ACTIVE' ? 'success' : 'warning',
        keywords: `${t.employeeId ?? ''} ${t.department ?? ''} ${t.qualification ?? ''} teacher faculty`,
      })
    })
    } // end !isStudent (staff directory)

    // 3. FEES — staff search by fee title + student name; STUDENTS see
    //    only THEIR OWN fee rows (RLS by studentId — never classmates')
    if (!isStudent) {
      const fees = await db.fee.findMany({
        where: {
          schoolId,
          OR: [
            { title: { contains: q } },
            { student: { user: { name: { contains: q } } } },
          ],
        },
        take,
        orderBy: { createdAt: 'desc' },
        include: { student: { include: { user: { select: { name: true } } } } },
      })
      fees.forEach((f) => {
        const paidPct = f.amount > 0 ? Math.round((f.paid / f.amount) * 100) : 0
        results.push({
          id: `fee-${f.id}`,
          title: `${f.title} — ${f.student?.user?.name ?? 'Student'}`,
          subtitle: `₹${f.amount.toLocaleString('en-IN')} · ${f.paid.toLocaleString('en-IN')} collected (${paidPct}%)${f.dueDate ? ` · due ${new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`,
          category: 'Fees & Finance',
          type: 'fee',
          moduleKey: 'fees',
          iconName: 'IndianRupee',
          badge: f.status,
          badgeVariant: f.status === 'PAID' ? 'success' : f.status === 'OVERDUE' ? 'destructive' : 'warning',
          keywords: `fee payment dues finance ${f.type ?? ''} ${f.status}`,
        })
      })
    } else {
      // Student — only their own fee rows (RLS by studentId).
      const ctx = await requireStudent(user)
      const myFees = await db.fee.findMany({
        where: {
          schoolId,
          studentId: ctx.studentId,
          title: { contains: q },
        },
        take,
        orderBy: { createdAt: 'desc' },
      })
      myFees.forEach((f) => {
        const paidPct = f.amount > 0 ? Math.round((f.paid / f.amount) * 100) : 0
        results.push({
          id: `fee-${f.id}`,
          title: f.title,
          subtitle: `₹${f.amount.toLocaleString('en-IN')} · ${f.paid.toLocaleString('en-IN')} paid (${paidPct}%)${f.dueDate ? ` · due ${new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}`,
          category: 'Fees & Finance',
          type: 'fee',
          moduleKey: 'fees',
          iconName: 'IndianRupee',
          badge: f.status,
          badgeVariant: f.status === 'PAID' ? 'success' : f.status === 'OVERDUE' ? 'destructive' : 'warning',
          keywords: `fee payment dues finance ${f.type ?? ''} ${f.status}`,
        })
      })
    }

    // 4. ANNOUNCEMENTS — notice board items.
    // One announcement is fanned out per target class at publish time (identical
    // title+message, different `audience`). Collapse those broadcast rows into a
    // single result and surface the reach in the subtitle — mirrors the
    // dedup logic in /api/notifications-feed.
    const notifications = await db.notification.findMany({
      where: {
        schoolId,
        OR: [{ title: { contains: q } }, { message: { contains: q } }],
      },
      take: 18,
      orderBy: { createdAt: 'desc' },
    })
    const seenBroadcasts = new Set<string>()
    const broadcastAudiences = new Map<string, string[]>()
    notifications.forEach((n) => {
      const key = `${n.title}\u0000${n.message}`
      if (seenBroadcasts.has(key)) {
        const auds = broadcastAudiences.get(key)
        if (auds && n.audience) auds.push(n.audience)
        return
      }
      seenBroadcasts.add(key)
      broadcastAudiences.set(key, n.audience ? [n.audience] : [])
    })
    let noticeCount = 0
    notifications.forEach((n) => {
      if (noticeCount >= take) return
      const key = `${n.title}\u0000${n.message}`
      const auds = broadcastAudiences.get(key) ?? []
      if (auds.length === 0) return // already emitted (first row of this broadcast)
      const audienceSummary =
        auds.length > 1
          ? ` · broadcast to ${auds.length} classes`
          : auds[0]?.toUpperCase().startsWith('CLASS:')
            ? ` · ${auds[0].slice(6).trim()}`
            : ''
      broadcastAudiences.set(key, [])
      results.push({
        id: `ntf-${n.id}`,
        title: n.title,
        subtitle:
          n.message.length > 90
            ? `${n.message.slice(0, 90)}…${audienceSummary}`
            : `${n.message}${audienceSummary}`,
        category: 'Notices & Announcements',
        type: 'notice',
        moduleKey: navNotice,
        iconName: 'Megaphone',
        badge: n.priority,
        badgeVariant: n.priority === 'HIGH' ? 'destructive' : 'info',
        timestamp: n.createdAt.getTime(),
        keywords: `notice announcement ${n.audience} ${n.priority}`,
      })
      noticeCount += 1
    })

    // 5. MESSAGES — inbox items addressed to the current user
    const messages = await db.message.findMany({
      where: {
        schoolId,
        recipientId: user.id,
        OR: [{ subject: { contains: q } }, { body: { contains: q } }],
      },
      take,
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: { name: true } } },
    })
    messages.forEach((m) => {
      results.push({
        id: `msg-${m.id}`,
        title: m.subject,
        subtitle: `From ${m.sender?.name ?? 'Unknown'}${m.body ? ` · ${m.body.slice(0, 70)}…` : ''}`,
        category: 'Notices & Announcements',
        type: 'notice',
        moduleKey: navMessaging,
        iconName: 'Mail',
        badge: m.read ? 'Read' : 'Unread',
        badgeVariant: m.read ? 'outline' : 'default',
        timestamp: m.createdAt.getTime(),
        keywords: `message inbox mail ${m.read ? 'read' : 'unread'}`,
      })
    })

    // 6. PARENTS & GUARDIANS — from Student.guardian* fields (replaces mock
    // parentConversations). Staff-only: students/parents must not enumerate
    // other families' contact details.
    if (user.role !== 'STUDENT' && user.role !== 'PARENT') {
      const guardians = await db.student.findMany({
        where: {
          schoolId,
          OR: [
            { guardianName: { contains: q } },
            { guardianPhone: { contains: q } },
          ],
        },
        take,
        include: {
          user: { select: { name: true } },
          class: { select: { name: true, section: true } },
        },
      })
      guardians.forEach((s) => {
        if (!s.guardianName) return
        const ward = s.user?.name ?? 'student'
        const cls = s.class ? `${s.class.name}${s.class.section ? `-${s.class.section}` : ''}` : null
        results.push({
          id: `grd-${s.id}`,
          title: s.guardianName,
          subtitle: `Guardian of ${ward}${cls ? ` · ${cls}` : ''}${s.guardianPhone ? ` · ${s.guardianPhone}` : ''}`,
          category: 'Parents & Guardians',
          type: 'parent',
          moduleKey: 'messaging',
          iconName: 'Users',
          badge: 'Guardian',
          badgeVariant: 'info',
          keywords: `${s.guardianName} ${ward} ${s.guardianPhone ?? ''} parent guardian contact`,
        })
      })
    }

    // 7. LEARNING (students only, L2D spec §50) — authorized materials,
    //    flashcard decks and study groups. Permission-aware through the
    //    same authorizedMaterials resolver the Learning module uses
    //    (published + whole-school / class-targeted / student-targeted).
    if (isStudent) {
      const ctx = await requireStudent(user)
      const [materials, decks, groups] = await Promise.all([
        authorizedMaterials(ctx, {
          filter: { OR: [{ title: { contains: q } }, { description: { contains: q } }] },
        }),
        db.flashcardDeck.findMany({
          where: {
            schoolId,
            OR: [{ name: { contains: q } }, { description: { contains: q } }],
          },
          take,
          include: { subject: { select: { name: true } }, _count: { select: { cards: true } } },
        }),
        db.studyGroup.findMany({
          where: {
            schoolId,
            OR: [{ name: { contains: q } }, { description: { contains: q } }],
          },
          take,
          include: { subject: { select: { name: true } }, _count: { select: { members: true } } },
        }),
      ])

      materials.slice(0, take).forEach((m) => {
        results.push({
          id: `mat-${m.id}`,
          title: m.title,
          subtitle: `${m.className ? `${m.className} · ` : ''}${m.category.replace('-', ' ')}`,
          category: 'Learning',
          type: 'material',
          moduleKey: 'learning',
          iconName: 'BookOpen',
          badge: 'Resource',
          badgeVariant: 'info',
          keywords: `${m.title} ${m.description ?? ''} learning resource study material ${m.category}`,
        })
      })
      decks.forEach((d) => {
        results.push({
          id: `deck-${d.id}`,
          title: d.name,
          subtitle: `${d.subject?.name ?? 'All subjects'} · ${d._count.cards} card${d._count.cards === 1 ? '' : 's'}`,
          category: 'Learning',
          type: 'deck',
          moduleKey: 'flashcards',
          iconName: 'Layers',
          badge: 'Flashcards',
          badgeVariant: 'info',
          keywords: `${d.name} flashcards deck revise revision ${d.subject?.name ?? ''}`,
        })
      })
      groups.forEach((g) => {
        results.push({
          id: `grp-${g.id}`,
          title: g.name,
          subtitle: `${g.subject?.name ?? 'All subjects'} · ${g._count.members} member${g._count.members === 1 ? '' : 's'}`,
          category: 'Learning',
          type: 'group',
          moduleKey: 'peer',
          iconName: 'Users',
          badge: 'Study Group',
          badgeVariant: 'info',
          keywords: `${g.name} study group collaborate ${g.subject?.name ?? ''}`,
        })
      })
    }

    return { results }
  })
}
