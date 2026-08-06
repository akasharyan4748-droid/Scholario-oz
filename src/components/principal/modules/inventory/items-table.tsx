'use client'

import { motion } from 'framer-motion'
import { Search, MapPin, Plus } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { inventoryItems } from '@/lib/mock/operations'
import { formatINR } from '@/lib/format'
import { toast } from 'sonner'

type InventoryItem = (typeof inventoryItems)[number]

export function ItemsTable({
  search, setSearch, category, setCategory, categories, filtered,
}: {
  search: string
  setSearch: (s: string) => void
  category: string
  setCategory: (c: string) => void
  categories: string[]
  filtered: InventoryItem[]
}) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-sm">Inventory Items</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} items found</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..." className="pl-8 w-full sm:w-52" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">Item</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold text-center">Stock</TableHead>
              <TableHead className="font-semibold text-right">Value</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Location</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((it, i) => (
              <motion.tr
                key={it.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="hover:bg-accent/30 transition-colors"
              >
                <TableCell>
                  <p className="font-medium text-sm">{it.name}</p>
                  <p className="text-[11px] text-muted-foreground">{it.unit} · {it.id}</p>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{it.category}</Badge></TableCell>
                <TableCell className="text-center">
                  <span className={`font-semibold text-sm ${it.status === 'Low Stock' ? 'text-amber-600' : ''}`}>{it.stock}</span>
                </TableCell>
                <TableCell className="text-right text-sm">{formatINR(it.value)}</TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {it.location}</span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={it.status} variant={it.status === 'In Stock' ? 'success' : 'warning'} dot />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-7"
                    onClick={() => toast.success('Stock added', { description: `${it.name} · +10 units added to inventory` })}
                  >
                    <Plus className="h-3 w-3" /> Add Stock
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  )
}
