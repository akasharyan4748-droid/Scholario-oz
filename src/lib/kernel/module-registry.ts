/**
 * SCHOLARIO-OS — Enterprise Module Registry
 * Discovers, registers, and validates modular ERP capabilities.
 */

export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  category: 'core' | 'academic' | 'finance' | 'operations' | 'ai' | 'analytics';
  dependencies?: string[];
  requiredPermissions?: string[];
  featureFlagKey?: string;
  routes?: string[];
  isCore?: boolean;
}

class ModuleRegistry {
  private modules: Map<string, ModuleManifest> = new Map();

  constructor() {
    this.registerCoreModules();
  }

  private registerCoreModules(): void {
    const coreManifests: ModuleManifest[] = [
      { id: 'admissions', name: 'Admissions Workspace', version: '1.0.0', description: 'Student application pipeline & OCR form processing', category: 'academic', isCore: true },
      { id: 'students', name: 'Student Directory & Profiles', version: '1.0.0', description: 'Student records, documents, and historical data', category: 'academic', isCore: true },
      { id: 'teachers', name: 'Faculty & HR Management', version: '1.0.0', description: 'Staff directory, appointments, and workload', category: 'operations', isCore: true },
      { id: 'finance', name: 'Fees & Accounting', version: '1.0.0', description: 'Fee structures, collection receipts, and statements', category: 'finance', isCore: true },
      { id: 'exams', name: 'Examinations & Marks', version: '1.0.0', description: 'Exam schedules, gradebooks, and report cards', category: 'academic', isCore: true },
      { id: 'attendance', name: 'Attendance Management', version: '1.0.0', description: 'Daily attendance logs, biometrics, and analytics', category: 'academic', isCore: true },
      { id: 'communication', name: 'Communication & Notices', version: '1.0.0', description: 'Circulars, SMS, WhatsApp alerts, and messaging', category: 'operations', isCore: true },
      { id: 'transport', name: 'Transport & GPS', version: '1.0.0', description: 'Bus routes, vehicle tracking, and stop timelines', category: 'operations', featureFlagKey: 'enable_transport_gps' },
      { id: 'hostel', name: 'Hostel & Mess', version: '1.0.0', description: 'Bed allocations and mess fee logs', category: 'operations', featureFlagKey: 'enable_hostel' },
      { id: 'library', name: 'Digital Library', version: '1.0.0', description: 'Book cataloging, issue tracking, and fines', category: 'academic' },
      { id: 'inventory', name: 'Store Inventory', version: '1.0.0', description: 'Asset tracking, reorder levels, and stock logs', category: 'operations' },
    ];

    coreManifests.forEach((m) => this.register(m));
  }

  public register(manifest: ModuleManifest): void {
    this.modules.set(manifest.id, manifest);
  }

  public getModule(id: string): ModuleManifest | undefined {
    return this.modules.get(id);
  }

  public getAllModules(): ModuleManifest[] {
    return Array.from(this.modules.values());
  }

  public getCoreModules(): ModuleManifest[] {
    return this.getAllModules().filter((m) => m.isCore);
  }
}

export const moduleRegistry = new ModuleRegistry();
