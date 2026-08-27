import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import type { SearchResultItem } from '@/lib/search-service/types'

export const runtime = 'nodejs'

// GET /api/search?q=... — DB-backed global search across people, fees, notices.
// Replaces mock-derived people/fee results in the command palette with real data.
export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const q = (req.nextUrl.searchParams.get('q') || '').trim()
    if (q.length < 2) return { results: [] }

    const schoolId = user.schoolId
    if (!schoolId) return { results: [] }

    const results: SearchResultItem[] = []
    const take = 6

    // 1. STUDENTS — search by name (User relation), admission no, roll no
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
        moduleKey: 'admission',
        iconName: 'User',
        badge: s.user?.status === 'ACTIVE' ? cls : (s.user?.status ?? 'Unknown'),
        badgeVariant: s.user?.status === 'ACTIVE' ? 'success' : 'warning',
        keywords: `${s.admissionNo ?? ''} ${s.rollNo ?? ''} ${s.guardianName ?? ''} student`,
      })
    })

    // 2. TEACHERS — search by name, employee id
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

    // 3. FEES — search by fee title, student name; scope by role (teachers skip)
    if (user.role !== 'TEACHER') {
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
    }

    // 4. ANNOUNCEMENTS — notice board items
    const notifications = await db.notification.findMany({
      where: {
        schoolId,
        OR: [{ title: { contains: q } }, { message: { contains: q } }],
      },
      take,
      orderBy: { createdAt: 'desc' },
    })
    notifications.forEach((n) => {
      results.push({
        id: `ntf-${n.id}`,
        title: n.title,
        subtitle: n.message.length > 90 ? `${n.message.slice(0, 90)}…` : n.message,
        category: 'Notices & Announcements',
        type: 'notice',
        moduleKey: 'communication',
        iconName: 'Megaphone',
        badge: n.priority,
        badgeVariant: n.priority === 'HIGH' ? 'destructive' : 'info',
        timestamp: n.createdAt.getTime(),
        keywords: `notice announcement ${n.audience} ${n.priority}`,
      })
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
        moduleKey: 'messages',
        iconName: 'Mail',
        badge: m.read ? 'Read' : 'Unread',
        badgeVariant: m.read ? 'outline' : 'default',
        timestamp: m.createdAt.getTime(),
        keywords: `message inbox mail ${m.read ? 'read' : 'unread'}`,
      })
    })

    return { results }
  })
}
