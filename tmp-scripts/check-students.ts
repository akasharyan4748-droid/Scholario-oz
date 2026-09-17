import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const students = await db.student.findMany({
    where: { class: { name: { contains: '9' } } },
    select: { rollNo: true, admissionNo: true, guardianName: true, guardianPhone: true, dob: true, gender: true, bloodGroup: true, user: { select: { name: true, email: true } } },
    take: 3,
  })
  console.log(JSON.stringify(students, null, 1))
}
main().then(() => db.$disconnect())
