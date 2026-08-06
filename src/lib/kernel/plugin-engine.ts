/**
 * SCHOLARIO-OS — Enterprise Plugin Extension Engine
 * Extension point registry allowing zero-core-modification plugin registration (Hostel, Transport, LMS, AI).
 */

export interface PluginExtensionPoint {
  id: string;
  pluginId: string;
  name: string;
  targetSlot: 'sidebar' | 'dashboard_widget' | 'student_tab' | 'teacher_tab' | 'topbar_action';
  componentName: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  extensionPoints: PluginExtensionPoint[];
}

class PluginEngine {
  private registeredPlugins: Map<string, PluginManifest> = new Map();

  public registerPlugin(plugin: PluginManifest): void {
    this.registeredPlugins.set(plugin.id, plugin);
  }

  public getExtensionPointsForSlot(slot: PluginExtensionPoint['targetSlot']): PluginExtensionPoint[] {
    const points: PluginExtensionPoint[] = [];
    for (const plugin of this.registeredPlugins.values()) {
      points.push(...plugin.extensionPoints.filter((ep) => ep.targetSlot === slot));
    }
    return points;
  }

  public getInstalledPlugins(): PluginManifest[] {
    return Array.from(this.registeredPlugins.values());
  }
}

export const pluginEngine = new PluginEngine();
