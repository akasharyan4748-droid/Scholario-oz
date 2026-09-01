'use client'

/**
 * useSettingsDirty — global dirty-state hook for settings pages.
 *
 * The sticky Save/Discard bar must appear whenever ANY setting changes on
 * ANY tab of a settings page (Admissions, Teachers, etc.), and disappear
 * only after Save or Discard.
 *
 * Pattern:
 *   1. Page wraps everything in <SettingsDirtyProvider>.
 *   2. Each tab calls useDirtyState(id, dirty, save, discard).
 *   3. Page renders <ActionBar dirty onSave={saveAll} onDiscard={discardAll} />
 *
 * IMPORTANT: tabs must remain mounted (use CSS `hidden` to hide inactive
 * tabs). If a tab unmounts, its registration is removed and any unsaved
 * changes it tracks are lost (the dirty bar will disappear if no other
 * tab is dirty).
 */

import {
  createContext, useContext, useRef, useState, useCallback, useEffect,
  type ReactNode,
} from 'react'

type CommitFn = () => Promise<void> | void

interface TabRegistration {
  id: string
  dirty: boolean
  save: CommitFn
  discard: CommitFn
}

interface DirtyCtx {
  dirty: boolean
  registerTab: (reg: TabRegistration) => void
  unregisterTab: (id: string) => void
  saveAll: () => Promise<void>
  discardAll: () => Promise<void>
}

const Ctx = createContext<DirtyCtx | null>(null)

export function SettingsDirtyProvider({ children }: { children: ReactNode }) {
  const tabs = useRef<Map<string, TabRegistration>>(new Map())
  const [tick, setTick] = useState(0)
  const rerender = useCallback(() => setTick((t) => t + 1), [])

  const registerTab = useCallback((reg: TabRegistration) => {
    const existing = tabs.current.get(reg.id)
    // Always store the latest fns (cheap — ref mutation, no rerender)
    if (!existing) {
      tabs.current.set(reg.id, reg)
      rerender()
    } else if (existing.dirty !== reg.dirty) {
      tabs.current.set(reg.id, reg)
      rerender()
    } else {
      // Update fns in place without rerender
      existing.save = reg.save
      existing.discard = reg.discard
    }
  }, [rerender])

  const unregisterTab = useCallback((id: string) => {
    if (tabs.current.delete(id)) rerender()
  }, [rerender])

  const dirty = Array.from(tabs.current.values()).some((t) => t.dirty)

  const saveAll = useCallback(async () => {
    // Snapshot current registrations
    const snapshot = Array.from(tabs.current.values())
    await Promise.all(snapshot.map((t) => t.save()))
    rerender()
  }, [rerender])

  const discardAll = useCallback(async () => {
    const snapshot = Array.from(tabs.current.values())
    await Promise.all(snapshot.map((t) => t.discard()))
    rerender()
  }, [rerender])

  void tick

  return (
    <Ctx.Provider value={{ dirty, registerTab, unregisterTab, saveAll, discardAll }}>
      {children}
    </Ctx.Provider>
  )
}

export function useSettingsDirty(): DirtyCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSettingsDirty must be used inside <SettingsDirtyProvider>')
  return ctx
}

/**
 * useDirtyState — register a tab's dirty + commit fns.
 *
 * Re-registers whenever `dirty` flips (to trigger provider re-render).
 * The fns are kept in a ref so we always have the latest without
 * re-triggering the effect.
 */
export function useDirtyState(
  id: string,
  dirty: boolean,
  save: CommitFn,
  discard: CommitFn,
) {
  const { registerTab, unregisterTab } = useSettingsDirty()
  const fnsRef = useRef({ save, discard })
  fnsRef.current = { save, discard }

  useEffect(() => {
    registerTab({
      id,
      dirty,
      save: () => fnsRef.current.save(),
      discard: () => fnsRef.current.discard(),
    })
    return () => unregisterTab(id)
  }, [id, dirty, registerTab, unregisterTab])
}
