/**
 * SCHOLARIO-OS — Enterprise Search Architecture
 * Unified query resolver interface across Students, Faculty, Admissions, Fees, and Certificates.
 */

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Student' | 'Teacher' | 'Admission' | 'Fee' | 'Exam' | 'Setting';
  url: string;
  metadata?: Record<string, unknown>;
}

export interface SearchQueryOptions {
  query: string;
  tenantId?: string;
  categories?: string[];
  limit?: number;
}

export interface SearchProvider {
  name: string;
  search(options: SearchQueryOptions): Promise<SearchResultItem[]>;
}

class SearchEngine {
  private providers: Map<string, SearchProvider> = new Map();

  public registerProvider(provider: SearchProvider): void {
    this.providers.set(provider.name, provider);
  }

  public async globalSearch(options: SearchQueryOptions): Promise<SearchResultItem[]> {
    if (!options.query || options.query.trim().length < 2) return [];

    const results: SearchResultItem[] = [];
    for (const provider of this.providers.values()) {
      try {
        const items = await provider.search(options);
        results.push(...items);
      } catch (err) {
        console.error(`[SEARCH_ENGINE_ERROR] Provider ${provider.name} failed:`, err);
      }
    }

    const limit = options.limit || 20;
    return results.slice(0, limit);
  }
}

export const searchEngine = new SearchEngine();
