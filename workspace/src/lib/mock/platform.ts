// Super Admin — Platform management data architecture

export interface School {
  id: string
  name: string
  logo: string
  plan: 'Starter' | 'Growth' | 'Enterprise'
  status: 'Active' | 'Trial' | 'Suspended' | 'Churned'
  city: string
  state: string
  students: number
  teachers: number
  mrr: number
  startedAt: string
  renewalAt: string
  adminName: string
  adminEmail: string
  health: number
  gradient: string
  isDemo?: boolean
}

// Single Demo Tenant for initial onboarding and testing
export const schools: School[] = [
  {
    id: 'demo-school',
    name: 'Demo School of Scholario',
    logo: 'D',
    plan: 'Enterprise',
    status: 'Active',
    city: 'Gurugram',
    state: 'Delhi NCR',
    students: 18,
    teachers: 3,
    mrr: 25000,
    startedAt: '2025-01-01',
    renewalAt: '2026-01-01',
    adminName: 'Dr. Sarah Jenkins',
    adminEmail: 'principal@demoschool.edu',
    health: 98,
    gradient: 'from-indigo-600 to-violet-600',
    isDemo: true,
  },
]

export interface Invoice {
  id: string
  invoiceNo: string
  school: string
  schoolId: string
  amount: number
  gst: number
  total: number
  date: string
  dueDate: string
  status: 'Paid' | 'Pending' | 'Overdue' | 'Refunded'
  plan: string
  method: 'UPI' | 'Card' | 'Net Banking' | 'Cheque'
}

export const invoices: Invoice[] = [
  { id: 'INV01', invoiceNo: 'INV-2025-0001', school: 'Demo School of Scholario', schoolId: 'demo-school', amount: 25000, gst: 4500, total: 29500, date: '2025-01-01', dueDate: '2025-01-15', status: 'Paid', plan: 'Enterprise — Demo', method: 'UPI' },
]

export interface InfrastructureMetric {
  id: string
  service: string
  status: 'Operational' | 'Degraded' | 'Down'
  uptime: number
  latency: number
  load: number
  region: string
}

export const infrastructure: InfrastructureMetric[] = [
  { id: 'IF01', service: 'API Gateway', status: 'Operational', uptime: 99.98, latency: 42, load: 12, region: 'ap-south-1' },
  { id: 'IF02', service: 'PostgreSQL Primary', status: 'Operational', uptime: 99.99, latency: 8, load: 15, region: 'ap-south-1' },
  { id: 'IF03', service: 'Redis Cache', status: 'Operational', uptime: 99.97, latency: 2, load: 10, region: 'ap-south-1' },
  { id: 'IF04', service: 'Object Storage (S3)', status: 'Operational', uptime: 99.99, latency: 24, load: 8, region: 'ap-south-1' },
  { id: 'IF05', service: 'CDN — CloudFront', status: 'Operational', uptime: 99.95, latency: 18, load: 14, region: 'Global' },
]

export interface SecurityEvent {
  id: string
  type: 'Login' | 'Failed Login' | 'Permission Change' | 'Data Export' | 'API Key' | 'Suspicious'
  user: string
  school: string
  ip: string
  location: string
  timestamp: string
  status: 'Success' | 'Blocked' | 'Flagged'
  device: string
}

export const securityEvents: SecurityEvent[] = [
  { id: 'SE01', type: 'Login', user: 'admin@erpsuite.io', school: 'Platform Console', ip: '103.21.58.42', location: 'New Delhi, IN', timestamp: 'Just now', status: 'Success', device: 'Chrome · macOS' },
  { id: 'SE02', type: 'Login', user: 'principal@demoschool.edu', school: 'Demo School of Scholario', ip: '103.21.58.10', location: 'Gurugram, IN', timestamp: '10 min ago', status: 'Success', device: 'Safari · iOS' },
]

export interface ApiKey {
  id: string
  name: string
  key: string
  school: string
  created: string
  lastUsed: string
  requests: number
  status: 'Active' | 'Revoked'
  scopes: string[]
}

export const apiKeys: ApiKey[] = [
  { id: 'AK01', name: 'Demo School — Integration Key', key: 'sk_live_demo_••••••••••••4f8a', school: 'Demo School of Scholario', created: '2025-01-01', lastUsed: '5 min ago', requests: 1240, status: 'Active', scopes: ['read:students', 'write:fees', 'read:reports'] },
]

export interface SupportTicket {
  id: string
  subject: string
  school: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  category: 'Technical' | 'Billing' | 'Onboarding' | 'Feature Request' | 'Bug'
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  createdAt: string
  assignee: string
  messages: number
}

export const supportTickets: SupportTicket[] = []

export const platformStats = {
  totalSchools: 1,
  activeSchools: 1,
  trialSchools: 0,
  churnedSchools: 0,
  totalStudents: 18,
  totalTeachers: 3,
  mrr: 25000,
  arr: 300000,
  mrrGrowth: 0,
  arrGrowth: 0,
  churnRate: 0,
  ltv: 300000,
  cac: 0,
  grossMargin: 95,
  netRevenueRetention: 100,
  activeApiKeys: 1,
  totalApiCalls: 1240,
  uptime: 99.99,
  openTickets: 0,
  slaCompliance: 100,
  nps: 100,
  monthlyRevenue: [
    { month: 'Jan', mrr: 25000, arr: 300000 },
  ],
  planDistribution: [
    { name: 'Enterprise', value: 1, color: 'oklch(0.45 0.18 265)' },
  ],
  geographicDistribution: [
    { name: 'North India', value: 1, color: 'oklch(0.55 0.14 162)' },
  ],
  cohortRetention: [
    { month: 'M0', retention: 100 },
  ],
  usageMetrics: {
    storageUsed: 0.2,
    storageTotal: 10,
    bandwidthThisMonth: 0.1,
    bandwidthTotal: 5,
    apiCallsToday: 1240,
    apiCallsLimit: 1000000,
    activeUsers: 22,
    mauGrowth: 0,
  },
}

export interface FeatureFlag {
  id: string
  name: string
  key: string
  status: 'Enabled' | 'Disabled' | 'Beta'
  schools: number
  percentage: number
  description: string
  lastModified: string
}

export const featureFlags: FeatureFlag[] = [
  { id: 'FF01', name: 'AI Report Card Comments', key: 'ai_report_comments', status: 'Enabled', schools: 1, percentage: 100, description: 'AI-generated personalized comments for report cards.', lastModified: '1 day ago' },
  { id: 'FF02', name: 'WhatsApp Messaging', key: 'whatsapp_integration', status: 'Beta', schools: 1, percentage: 100, description: 'Send notices & reminders via WhatsApp Business API.', lastModified: '2 days ago' },
]

export interface AuditLogEntry {
  id: string
  action: string
  actor: string
  target: string
  timestamp: string
  ip: string
  category: 'Admin' | 'Billing' | 'Security' | 'Data' | 'System'
}

export const auditTrail: AuditLogEntry[] = [
  { id: 'AL01', action: 'Demo School Configured', actor: 'Super Admin', target: 'demo-school', timestamp: 'Today', ip: '10.0.0.1', category: 'Admin' },
]
