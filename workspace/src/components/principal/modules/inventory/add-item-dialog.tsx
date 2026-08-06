'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { inventoryStats } from '@/lib/mock/operations'
import { formatINR } from '@/lib/format'
import { toast } from 'sonner'

export function AddItemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState('')
  const [cat, setCat] = useState('Furniture')
  const [stock, setStock] = useState('')
  const [value, setValue] = useState('')
  const [location, setLocation] = useState('Store Room A')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
          <DialogDescription>Register a new asset in the inventory system.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Item Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Student Desk (Steel)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {inventoryStats.categories.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Initial Stock</Label>
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Unit Value (₹)</Label>
              <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="2800" />
            </div>
            <div>
              <Label className="text-xs">Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Store Room A', 'Store Room B', 'Science Lab', 'Sports Room', 'AV Room'].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!name.trim() || !stock) {
              toast.error('Item name and stock are required')
              return
            }
            toast.success('Item added', { description: `${name} · ${stock} units · ${formatINR(parseInt(value || '0'))}` })
            setName(''); setStock(''); setValue('')
            onOpenChange(false)
          }}>Add Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
