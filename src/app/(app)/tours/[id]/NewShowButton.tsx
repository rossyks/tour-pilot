'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

export default function NewShowButton({ tourId }: { tourId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ date: '', venue_name: '', city: '', status: 'pendiente' })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.date || !form.venue_name || !form.city) return
    setLoading(true)
    const { data, error } = await supabase.from('shows').insert({ ...form, tour_id: tourId }).select().single()
    if (!error && data) {
      setOpen(false)
      setForm({ date: '', venue_name: '', city: '', status: 'pendiente' })
      router.push(`/shows/${data.id}`)
      router.refresh()
    }
    setLoading(false)
  }

  const inputCls = 'w-full border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f0f0f] transition-colors placeholder-[#bbb]'

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Añadir show</Button>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-bold mb-4">Nuevo show</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-[#999] uppercase tracking-wider block mb-1">Fecha</label>
                <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-[#999] uppercase tracking-wider block mb-1">Venue</label>
                <input type="text" value={form.venue_name} onChange={(e) => set('venue_name', e.target.value)} placeholder="Nombre del recinto" required className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-[#999] uppercase tracking-wider block mb-1">Ciudad</label>
                <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Ciudad" required className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-[#999] uppercase tracking-wider block mb-1">Estado</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" loading={loading}>Crear show</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
