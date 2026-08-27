import { db } from '../../src/lib/db'

const tables = await db.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name`
console.log('===CURRENT DB TABLES===')
console.log(tables.map(t => t.name).join('\n'))
console.log('===TOTAL: ' + tables.length + ' tables ===')
await db.$disconnect()
