'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

export default function NewTourButton() {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const { data, error } = await supabase.from('tours').insert({ name: name.trim() }).select().single()
    if (!error && data) {
      setOpen(false)
      setName('')
      router.push(`/tours/${data.id}`)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Nuevo tour</Button>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-bold mb-4">Nuevo tour</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del tour"
                className="w-full border border-[#e0e0e0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0f0f0f] transition-colors"
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" loading={loading}>Crear</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
