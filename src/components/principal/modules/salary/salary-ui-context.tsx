'use client'

/**
 * salary-ui-context — shared UI actions across the Salary workspace tabs.
 *
 * Lets any tab open the employee drawer or the Record Payment dialog
 * without prop-drilling.
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export interface RecordTarget {
  employeeId?: string
  periodKey?: string
}

interface SalaryUIState {
  drawerEmployeeId: string | null
  openEmployee: (id: string) => void
  closeEmployee: () => void
  recordOpen: boolean
  recordTarget: RecordTarget | null
  openRecordPayment: (target?: RecordTarget) => void
  closeRecordPayment: () => void
}

const SalaryUIContext = createContext<SalaryUIState | null>(null)

export function SalaryUIProvider({ children }: { children: React.ReactNode }) {
  const [drawerEmployeeId, setDrawerEmployeeId] = useState<string | null>(null)
  const [recordOpen, setRecordOpen] = useState(false)
  const [recordTarget, setRecordTarget] = useState<RecordTarget | null>(null)

  const openEmployee = useCallback((id: string) => setDrawerEmployeeId(id), [])
  const closeEmployee = useCallback(() => setDrawerEmployeeId(null), [])
  const openRecordPayment = useCallback((target?: RecordTarget) => {
    setRecordTarget(target ?? null)
    setRecordOpen(true)
  }, [])
  const closeRecordPayment = useCallback(() => {
    setRecordOpen(false)
    setRecordTarget(null)
  }, [])

  const value = useMemo<SalaryUIState>(() => ({
    drawerEmployeeId, openEmployee, closeEmployee,
    recordOpen, recordTarget, openRecordPayment, closeRecordPayment,
  }), [drawerEmployeeId, openEmployee, closeEmployee, recordOpen, recordTarget, openRecordPayment, closeRecordPayment])

  return <SalaryUIContext.Provider value={value}>{children}</SalaryUIContext.Provider>
}

export function useSalaryUI(): SalaryUIState {
  const ctx = useContext(SalaryUIContext)
  if (!ctx) throw new Error('useSalaryUI must be used inside SalaryUIProvider')
  return ctx
}
