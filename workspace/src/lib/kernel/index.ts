/**
 * SCHOLARIO-OS — Enterprise Platform Kernel Core
 * Manages tenant context, user session resolution, kernel initialization, and runtime state.
 */

export interface TenantContext {
  tenantId: string;
  schoolName: string;
  code: string;
  academicYear: string;
  domain?: string;
  isMultiSchoolEnabled: boolean;
}

export interface UserContext {
  userId: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STUDENT' | 'PARENT';
  tenantId: string;
  permissions: string[];
}

export interface KernelState {
  isInitialized: boolean;
  tenant: TenantContext | null;
  user: UserContext | null;
  activeModules: string[];
}

class PlatformKernel {
  private state: KernelState = {
    isInitialized: false,
    tenant: null,
    user: null,
    activeModules: [],
  };

  private listeners: Set<(state: KernelState) => void> = new Set();

  public initialize(tenant: TenantContext, user?: UserContext): void {
    this.state = {
      isInitialized: true,
      tenant,
      user: user || null,
      activeModules: [],
    };
    this.notify();
  }

  public getTenant(): TenantContext | null {
    return this.state.tenant;
  }

  public getUser(): UserContext | null {
    return this.state.user;
  }

  public isReady(): boolean {
    return this.state.isInitialized;
  }

  public subscribe(listener: (state: KernelState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const kernel = new PlatformKernel();
