// Inventory module: mock stock movement log + derived category value series.

import { inventoryStats } from '@/lib/mock/operations'

// Mock stock movement log
export const stockMovements = [
  { id: 'M1', item: 'Notebooks (200 pg)', action: 'Stock In', qty: 200, by: 'Geeta Sharma', time: 'Today · 09:42 AM' },
  { id: 'M2', item: 'Football (Size 5)', action: 'Issued', qty: 4, by: 'Sanjay Reddy', time: 'Today · 08:15 AM' },
  { id: 'M3', item: 'Crayons Pack (24)', action: 'Issued', qty: 8, by: 'Faisal Ahmed', time: 'Yesterday · 03:20 PM' },
  { id: 'M4', item: 'Whiteboard — 4x6 ft', action: 'Stock In', qty: 6, by: 'Storekeeper', time: 'Yesterday · 11:08 AM' },
  { id: 'M5', item: 'Beaker Set (Glass)', action: 'Damaged', qty: 2, by: 'Kavita Joshi', time: '2 days ago · 02:14 PM' },
  { id: 'M6', item: 'Microscope (Compound)', action: 'Issued', qty: 4, by: 'Pooja Bhatt', time: '3 days ago · 10:30 AM' },
]

export const VALUE_BY_CAT = inventoryStats.categories.map((c) => ({ name: c.name, value: c.value }))
