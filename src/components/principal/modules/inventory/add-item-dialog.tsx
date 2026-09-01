'use client'

/**
 * add-item-dialog — Register a new inventory item.
 *
 * Fields: name, code, category, quantity, unit, min stock, unit value,
 * location. The store computes `totalValue` and `status` automatically.
 *
 * Calls `addItem(...)` and shows a confirmation toast.
 */

import { useState, useEffect, useMemo } from 'react'
import { Package, Hash, Layers, Boxes, Ruler, IndianRupee, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useInventoryStore } from '@/lib/store/inventory-store'
import type { ItemCategory, StockLocation } from '@/lib/store/inventory-store'
import { formatINR } from '@/lib/format'
import { toast } from 'sonner'

const CATEGORIES: ItemCategory[] = ['Furniture', 'Stationery', 'Lab Equipment', 'Sports', 'Electronics', 'Cleaning', 'IT Equipment']
const LOCATIONS: StockLocation[] = ['Store Room A', 'Store Room B', 'Science Lab', 'Computer Lab', 'Sports Room', 'Library', 'Office']
const UNITS = ['pcs', 'sets', 'packs', 'boxes', 'bottles', 'kits', 'reams', 'kg', 'litres']

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
}

export function AddItemDialog({ open, onOpenChange }: AddItemDialogProps) {
  const addItem = useInventoryStore((s) => s.addItem)

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState<ItemCategory>('Furniture')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('pcs')
  const [minStock, setMinStock] = useState('')
  const [unitValue, setUnitValue] = useState('')
  const [location, setLocation] = useState<StockLocation>('Store Room A')

  useEffect(() => {
    if (open) {
      setName('')
      setCode('')
      setCategory('Furniture')
      setQuantity('')
      setUnit('pcs')
      setMinStock('')
      setUnitValue('')
      setLocation('Store Room A')
    }
  }, [open])

  const qtyNum = Math.max(0, parseInt(quantity || '0', 10))
  const valueNum = Math.max(0, parseFloat(unitValue || '0'))
  const totalValue = useMemo(() => qtyNum * valueNum, [qtyNum, valueNum])

  const canSubmit = !!name.trim() && !!code.trim() && qtyNum >= 0 && valueNum >= 0

  const handleSubmit = () => {
    if (!name.trim() || !code.trim()) {
      toast.error('Item name and code are required')
      return
    }
    addItem({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      category,
      quantity: qtyNum,
      unit,
      minStock: Math.max(0, parseInt(minStock || '0', 10)),
      unitValue: valueNum,
      location,
    })
    toast.success('Item added', {
      description: `${name.trim()} · ${qtyNum} ${unit} · ${formatINR(totalValue, true)}`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Add Inventory Item
          </DialogTitle>
          <DialogDescription>
            Register a new asset in the inventory system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5">
          {/* Name + Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Package className="h-3 w-3" /> Item Name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Student Desk (Steel)"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Hash className="h-3 w-3" /> Item Code
              </Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. FRN-DS-ST"
                className="font-mono uppercase"
              />
            </div>
          </div>

          {/* Category + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Layers className="h-3 w-3" /> Category
              </Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ItemCategory)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> Location
              </Label>
              <Select value={location} onValueChange={(v) => setLocation(v as StockLocation)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Boxes className="h-3 w-3" /> Initial Quantity
              </Label>
              <Input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Ruler className="h-3 w-3" /> Unit
              </Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Min stock + Unit value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Min Stock Level</Label>
              <Input
                type="number"
                min={0}
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                placeholder="10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <IndianRupee className="h-3 w-3" /> Unit Value (₹)
              </Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={unitValue}
                onChange={(e) => setUnitValue(e.target.value)}
                placeholder="2800"
              />
            </div>
          </div>

          {/* Computed total */}
          <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] px-3 py-2">
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Total Value</p>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">{formatINR(totalValue, true)}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">{qtyNum} × {formatINR(valueNum)}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          >
            <Package className="h-3.5 w-3.5" /> Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
