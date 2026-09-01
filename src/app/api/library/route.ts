import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const books = await db.libraryBook.findMany({
      where: { schoolId },
      orderBy: { title: 'asc' },
      include: { _count: { select: { issues: true } } },
      take: 300,
    })
    const issues = await db.bookIssue.findMany({
      where: { status: 'ISSUED', book: { schoolId } },
      include: { book: true, student: { include: { user: { select: { name: true } } } } },
      take: 100,
    })
    return { books, issues }
  })
}

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const action = body.action

      if (action === 'issue') {
        const book = await db.libraryBook.findUnique({ where: { id: body.bookId } })
        if (!book || book.schoolId !== schoolId) throw new Error('NOT_FOUND')
        if (book.available <= 0) throw new Error('No copies available')
        const issue = await db.$transaction([
          db.bookIssue.create({
            data: {
              bookId: book.id,
              studentId: body.studentId,
              dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 14 * 86400000),
              status: 'ISSUED',
            },
          }),
          db.libraryBook.update({ where: { id: book.id }, data: { available: { decrement: 1 } } }),
        ])
        return issue[0]
      }

      if (action === 'return') {
        const issue = await db.bookIssue.findUnique({ where: { id: body.issueId }, include: { book: true } })
        if (!issue) throw new Error('NOT_FOUND')
        if (issue.book.schoolId !== schoolId) throw new Error('FORBIDDEN')
        await db.$transaction([
          db.bookIssue.update({ where: { id: issue.id }, data: { returnDate: new Date(), status: 'RETURNED' } }),
          db.libraryBook.update({ where: { id: issue.bookId }, data: { available: { increment: 1 } } }),
        ])
        return { ok: true }
      }

      // add book
      const title = String(body.title || '').trim()
      if (!title) throw new Error('Title required')
      const copies = Number(body.copies) || 1
      const book = await db.libraryBook.create({
        data: {
          schoolId,
          title,
          author: body.author || null,
          isbn: body.isbn || null,
          category: body.category || null,
          publisher: body.publisher || null,
          copies,
          available: copies,
          shelf: body.shelf || null,
        },
      })
      return book
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
