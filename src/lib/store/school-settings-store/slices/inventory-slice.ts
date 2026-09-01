import type { StateCreator } from 'zustand'
import type { SchoolSettingsState } from '../types'

export const createInventorySlice: StateCreator<
  SchoolSettingsState,
  [],
  [],
  Pick<
    SchoolSettingsState,
    'addBook' | 'removeBook' | 'addUniformItem' | 'removeUniformItem' | 'addHouse' | 'updateHouse'
  >
> = (set) => ({
  addBook: (book) =>
    set((state) => ({
      bookStore: [...state.bookStore, { ...book, id: `bk-${Date.now()}` }],
    })),

  removeBook: (id) =>
    set((state) => ({
      bookStore: state.bookStore.filter((b) => b.id !== id),
    })),

  addUniformItem: (item) =>
    set((state) => ({
      uniforms: [...state.uniforms, { ...item, id: `un-${Date.now()}` }],
    })),

  removeUniformItem: (id) =>
    set((state) => ({
      uniforms: state.uniforms.filter((u) => u.id !== id),
    })),

  addHouse: (house) =>
    set((state) => ({
      houses: [...state.houses, { ...house, id: `hs-${Date.now()}` }],
    })),

  updateHouse: (id, data) =>
    set((state) => ({
      houses: state.houses.map((h) => (h.id === id ? { ...h, ...data } : h)),
    })),
})
