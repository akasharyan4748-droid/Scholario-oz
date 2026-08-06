import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MasterReligion {
  id: string
  name: string
  code: string
  status: 'Published' | 'Draft' | 'Disabled'
  createdAt: string
  updatedAt: string
}

export interface MasterReligionState {
  religions: MasterReligion[]
  addReligion: (name: string, code?: string) => void
  editReligion: (id: string, name: string, code?: string) => void
  toggleStatus: (id: string, status: 'Published' | 'Draft' | 'Disabled') => void
  getPublishedReligions: () => MasterReligion[]
}

export const useMasterReligionStore = create<MasterReligionState>()(
  persist(
    (set, get) => ({
      religions: [
        { id: 'rel-1', name: 'Hindu', code: 'HINDU', status: 'Published', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
        { id: 'rel-2', name: 'Muslim', code: 'MUSLIM', status: 'Published', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
        { id: 'rel-3', name: 'Sikh', code: 'SIKH', status: 'Published', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
        { id: 'rel-4', name: 'Christian', code: 'CHRISTIAN', status: 'Published', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
        { id: 'rel-5', name: 'Jain', code: 'JAIN', status: 'Published', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
        { id: 'rel-6', name: 'Buddhist', code: 'BUDDHIST', status: 'Published', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
        { id: 'rel-7', name: 'Other', code: 'OTHER', status: 'Published', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
      ],
      addReligion: (name, code) =>
        set((state) => ({
          religions: [
            ...state.religions,
            {
              id: `rel-${Date.now()}`,
              name,
              code: code || name.toUpperCase().replace(/\s+/g, '_'),
              status: 'Published',
              createdAt: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString().split('T')[0],
            },
          ],
        })),
      editReligion: (id, name, code) =>
        set((state) => ({
          religions: state.religions.map((r) =>
            r.id === id
              ? {
                  ...r,
                  name,
                  code: code || name.toUpperCase().replace(/\s+/g, '_'),
                  updatedAt: new Date().toISOString().split('T')[0],
                }
              : r
          ),
        })),
      toggleStatus: (id, status) =>
        set((state) => ({
          religions: state.religions.map((r) =>
            r.id === id
              ? { ...r, status, updatedAt: new Date().toISOString().split('T')[0] }
              : r
          ),
        })),
      getPublishedReligions: () => {
        return get().religions.filter((r) => r.status === 'Published')
      },
    }),
    { name: 'scholario_master_religions_v1' }
  )
)
