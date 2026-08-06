'use client'

import { useState } from 'react'
import {
  Globe, Plus, Edit2, Search,
  Check, X, Building2
} from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useMasterReligionStore, MasterReligion } from '@/lib/store/master-religion-store'

export function ReligionMasterModule() {
  const religions = useMasterReligionStore((state) => state.religions)
  const addReligion = useMasterReligionStore((state) => state.addReligion)
  const editReligion = useMasterReligionStore((state) => state.editReligion)
  const toggleStatus = useMasterReligionStore((state) => state.toggleStatus)

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MasterReligion | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [codeInput, setCodeInput] = useState('')

  const filteredReligions = religions.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenAdd = () => {
    setEditingItem(null)
    setNameInput('')
    setCodeInput('')
    setModalOpen(true)
  }

  const handleOpenEdit = (item: MasterReligion) => {
    setEditingItem(item)
    setNameInput(item.name)
    setCodeInput(item.code)
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!nameInput.trim()) {
      toast.error('Religion name is required')
      return
    }

    if (editingItem) {
      editReligion(editingItem.id, nameInput.trim(), codeInput.trim())
      toast.success(`Religion "${nameInput}" updated successfully`)
    } else {
      addReligion(nameInput.trim(), codeInput.trim())
      toast.success(`Religion "${nameInput}" added and published`)
    }
    setModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" /> Religion Master Configuration
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Central global master for religion list used across student admission forms and tenant school applications.
          </p>
        </div>
        <Button onClick={handleOpenAdd} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 shadow-sm">
          <Plus className="h-4 w-4" /> Add Religion
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Master Religions</p>
            <h3 className="font-display text-2xl font-bold mt-1 text-foreground">{religions.length}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Globe className="h-5 w-5" />
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium font-mono">Published Active</p>
            <h3 className="font-display text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {religions.filter((r) => r.status === 'Published').length}
            </h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Check className="h-5 w-5" />
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Disabled / Inactive</p>
            <h3 className="font-display text-2xl font-bold mt-1 text-muted-foreground">
              {religions.filter((r) => r.status !== 'Published').length}
            </h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
        </GlassCard>
      </div>

      {/* TABLE */}
      <GlassCard className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search religion by name or code..."
              className="pl-9 text-xs"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider border-b border-border">
              <tr>
                <th className="p-3">Religion Name</th>
                <th className="p-3">Code</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Updated</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReligions.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-semibold text-foreground">{r.name}</td>
                  <td className="p-3 font-mono text-muted-foreground">{r.code}</td>
                  <td className="p-3">
                    {r.status === 'Published' ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px]">Published</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Disabled</Badge>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{r.updatedAt}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">Active</span>
                        <Switch
                          checked={r.status === 'Published'}
                          onCheckedChange={(checked) => {
                            toggleStatus(r.id, checked ? 'Published' : 'Disabled')
                            toast.success(`Religion "${r.name}" is now ${checked ? 'Published' : 'Disabled'}`)
                          }}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(r)}
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">
                {editingItem ? 'Edit Master Religion' : 'Add New Master Religion'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-xs font-semibold mb-1 block">Religion Display Name</Label>
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Zoroastrian, Bahá'í, etc."
                  className="text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1 block">Religion Code (Optional)</Label>
                <Input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="e.g. ZOROASTRIAN"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button size="sm" variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-primary text-primary-foreground font-semibold">
                {editingItem ? 'Save Changes' : 'Add & Publish'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
