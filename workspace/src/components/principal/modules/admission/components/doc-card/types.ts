export interface DocItem {
  key: string
  name: string
  description: string
  mandatory: boolean
}

export interface DocStatusState {
  status: 'uploaded' | 'pending' | 'later'
  fileName?: string
  ocrConfidence?: number
  verifiedBy?: string
  verificationTime?: string
}

export interface CompactEnterpriseDocCardProps {
  doc: DocItem
  statusState: DocStatusState
  onUpdateStatus: (
    key: string,
    status: 'uploaded' | 'pending' | 'later',
    fileName?: string,
    ocrConfidence?: number,
    verifiedBy?: string,
    verificationTime?: string
  ) => void
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  action: string
  actor: string
  details: string
}
