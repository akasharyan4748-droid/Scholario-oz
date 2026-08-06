/**
 * SCHOLARIO-OS — Enterprise Feature Flag Engine
 * Controls modular activation of modules across schools/tenants without code modification.
 */

export interface FeatureFlagDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  category: 'core' | 'academic' | 'finance' | 'operations' | 'ai' | 'integrations';
  defaultValue: boolean;
  requiresTier?: 'starter' | 'pro' | 'enterprise';
}

export const FEATURE_FLAG_REGISTRY: Record<string, FeatureFlagDefinition> = {
  HOSTEL_MANAGEMENT: {
    id: 'ff_hostel',
    key: 'enable_hostel',
    name: 'Hostel & Mess Management',
    description: 'Bed allocation, mess fee tracking, and hostel warden logs',
    category: 'operations',
    defaultValue: true,
  },
  TRANSPORT_GPS: {
    id: 'ff_transport',
    key: 'enable_transport_gps',
    name: 'Transport & Real-Time GPS',
    description: 'Route tracking, bus stop timelines, and driver assignment',
    category: 'operations',
    defaultValue: true,
  },
  AI_EXAM_GENERATOR: {
    id: 'ff_ai_exam',
    key: 'enable_ai_exam_gen',
    name: 'AI Question & Exam Generator',
    description: 'Gemini-powered automated question paper generation',
    category: 'ai',
    defaultValue: true,
    requiresTier: 'pro',
  },
  FACE_ATTENDANCE: {
    id: 'ff_face_att',
    key: 'enable_face_attendance',
    name: 'Biometric & Face Recognition Attendance',
    description: 'AI-assisted instant photo/face attendance marking',
    category: 'academic',
    defaultValue: true,
    requiresTier: 'enterprise',
  },
  WHATSAPP_NOTIFICATIONS: {
    id: 'ff_whatsapp',
    key: 'enable_whatsapp_alerts',
    name: 'WhatsApp Direct Alerts',
    description: 'Instant WhatsApp circulars and fee due reminders',
    category: 'integrations',
    defaultValue: true,
  },
  DIGITAL_DIARY: {
    id: 'ff_diary',
    key: 'enable_digital_diary',
    name: 'Student Digital Reflection Diary',
    description: 'Daily mood tracking, goal setting, and teacher responses',
    category: 'academic',
    defaultValue: true,
  },
  FEE_ONLINE_GATEWAY: {
    id: 'ff_fee_gateway',
    key: 'enable_fee_online_payment',
    name: 'Online Fee Payment Gateway',
    description: 'UPI, Card, and Netbanking fee collection portal',
    category: 'finance',
    defaultValue: true,
  },
  RECRUITMENT_PORTAL: {
    id: 'ff_recruitment',
    key: 'enable_teacher_recruitment',
    name: 'Staff Recruitment & Hiring Pipeline',
    description: 'Candidate applications, interview scheduling, and offer letters',
    category: 'operations',
    defaultValue: true,
  },
};

class FeatureFlagService {
  private overrides: Map<string, boolean> = new Map();

  public isEnabled(flagKey: string, tenantId?: string): boolean {
    if (this.overrides.has(flagKey)) {
      return this.overrides.get(flagKey)!;
    }
    const def = Object.values(FEATURE_FLAG_REGISTRY).find((f) => f.key === flagKey || f.id === flagKey);
    return def ? def.defaultValue : true;
  }

  public setOverride(flagKey: string, enabled: boolean): void {
    this.overrides.set(flagKey, enabled);
  }

  public getAllFlags(): Array<FeatureFlagDefinition & { enabled: boolean }> {
    return Object.values(FEATURE_FLAG_REGISTRY).map((flag) => ({
      ...flag,
      enabled: this.isEnabled(flag.key),
    }));
  }
}

export const featureFlags = new FeatureFlagService();
