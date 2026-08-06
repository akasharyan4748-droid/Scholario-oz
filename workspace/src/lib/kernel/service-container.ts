/**
 * SCHOLARIO-OS — Enterprise Service Container & Dependency Locator
 * Allows registration and resolution of shared infrastructure services without direct instantiation coupling.
 */

export interface ServiceIdentifier<T = unknown> {
  name: string;
}

class ServiceContainer {
  private services: Map<string, unknown> = new Map();
  private factories: Map<string, () => unknown> = new Map();

  public register<T>(identifier: string, instance: T): void {
    this.services.set(identifier, instance);
  }

  public registerFactory<T>(identifier: string, factory: () => T): void {
    this.factories.set(identifier, factory);
  }

  public resolve<T>(identifier: string): T {
    if (this.services.has(identifier)) {
      return this.services.get(identifier) as T;
    }

    if (this.factories.has(identifier)) {
      const instance = this.factories.get(identifier)!() as T;
      this.services.set(identifier, instance); // Cache singleton
      return instance;
    }

    throw new Error(`[SERVICE_CONTAINER] Service '${identifier}' is not registered in the kernel container.`);
  }

  public isRegistered(identifier: string): boolean {
    return this.services.has(identifier) || this.factories.has(identifier);
  }
}

export const container = new ServiceContainer();
