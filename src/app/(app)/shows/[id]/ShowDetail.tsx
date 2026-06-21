'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Show, Contact, ScheduleItem, Document, NoteAttachment, TravelDay, TourMember, TicketVisibility, ScheduleVisibility } from '@/lib/types'
import { useScrollLock } from '@/lib/useScrollLock'

const SYS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"

function normalizeUrl(url: string) {
  const trimmed = url.trim()
  if (trimmed.toLowerCase().startsWith('javascript:')) return '#'
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return 'https://' + trimmed
  return trimmed
}



function fmt(d: string) {
  const date = new Date(d + 'T00:00:00')
  const day = date.getDate().toString().padStart(2, '0')
  const month = date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '')
  return `${day} ${month}`
}
function t5(t: string | null) { return t ? t.slice(0, 5) : '' }
function trunc(s: string | null, n = 20) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n) + '…' : s
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

function BottomSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode; zIndex?: number }) {
  useScrollLock(open)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!open || !mounted) return null

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 9998,
          WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)',
        }}
      />
      <div
        className="tp-sheet-enter"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, top: 'auto',
          background: '#fff', borderRadius: '20px 20px 0 0',
          padding: '20px 20px 36px', zIndex: 9999,
          WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)',
        }}
      >
        {children}
      </div>
    </>,
    document.body
  )
}

// ─── Inline editable ─────────────────────────────────────────────────────────

function Editable({ value, placeholder = '—', onSave, isAdmin, style = {}, multiline = false }: {
  value: string | null; placeholder?: string; onSave: (v: string) => Promise<void>
  isAdmin: boolean; style?: React.CSSProperties; multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  const [saving, setSaving] = useState(false)

  async function save() { setSaving(true); await onSave(val); setSaving(false); setEditing(false) }

  if (!isAdmin) return <span style={{ fontFamily: SYS, whiteSpace: 'pre-wrap', ...style }}>{value || <span style={{ color: '#C0C0C0' }}>{placeholder}</span>}</span>

  if (editing) return multiline ? (
    <div style={{ width: '100%' }}>
      <textarea autoFocus value={val} onChange={e => setVal(e.target.value)} rows={4}
        style={{ width: '100%', background: '#fff', border: '1.5px solid #E0E0E0', borderRadius: 10, padding: '10px 12px', fontSize: 15, fontFamily: SYS, resize: 'none', outline: 'none', lineHeight: 1.5, marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} style={{ fontSize: 13, fontWeight: 700, background: '#1a1a1a', color: '#fff', padding: '8px 16px', borderRadius: 20, minHeight: 36, border: 'none', cursor: 'pointer', fontFamily: SYS }}>{saving ? '…' : 'Guardar'}</button>
        <button onClick={() => { setEditing(false); setVal(value ?? '') }} style={{ fontSize: 13, color: '#888', padding: '8px 12px', minHeight: 36, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS }}>Cancelar</button>
      </div>
    </div>
  ) : (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
      <input autoFocus value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()}
        style={{ background: 'transparent', borderBottom: '2px solid #1a1a1a', outline: 'none', flex: 1, paddingBottom: 2, fontFamily: SYS, fontSize: (style.fontSize as number) ?? 15, fontWeight: style.fontWeight ?? 400 }} />
      <button onClick={save} style={{ fontSize: 12, fontWeight: 700, background: '#1a1a1a', color: '#fff', padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: SYS }}>{saving ? '…' : '✓'}</button>
      <button onClick={() => { setEditing(false); setVal(value ?? '') }} style={{ color: '#888', fontSize: 14, minWidth: 28, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS }}>✕</button>
    </div>
  )

  return (
    <button onClick={() => setEditing(true)} style={{ textAlign: 'left', width: '100%', background: 'none', border: 'none', cursor: 'text', padding: 0, fontFamily: SYS, ...style }}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{value || <span style={{ color: 'rgba(255,255,255,0.5)' }}>{placeholder}</span>}</span>
    </button>
  )
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ borderTop: '1px solid #F0F0F0', marginBottom: 12 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', fontFamily: SYS }}>{label}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

// ─── Info block ───────────────────────────────────────────────────────────────

function InfoBlock({ label, children, onLabelClick }: { label: string; children: React.ReactNode; onLabelClick?: () => void }) {
  return (
    <div style={{ background: '#F5F5F5', borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', minHeight: 72 }}>
      <p onClick={onLabelClick} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(0,0,0,0.4)', margin: '0 0 4px 0', fontFamily: SYS, cursor: onLabelClick ? 'pointer' : 'default' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

// ─── Contact cell ─────────────────────────────────────────────────────────────

function ContactCell({ value, field, contactId, isAdmin, onSave, style = {}, placeholder = '—' }: {
  value: string | null; field: string; contactId: string; isAdmin: boolean
  onSave: (id: string, field: string, value: string) => void; style?: React.CSSProperties; placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  if (!isAdmin) return <span style={{ fontFamily: SYS, ...style }}>{value || <span style={{ color: '#C0C0C0' }}>{placeholder}</span>}</span>
  if (editing) return <input autoFocus value={val} onChange={e => setVal(e.target.value)}
    onBlur={() => { onSave(contactId, field, val); setEditing(false) }}
    onKeyDown={e => { if (e.key === 'Enter') { onSave(contactId, field, val); setEditing(false) } }}
    style={{ background: 'transparent', borderBottom: '1px solid #1a1a1a', outline: 'none', width: '100%', fontFamily: SYS, ...style }} />
  return <button onClick={() => setEditing(true)} style={{ textAlign: 'left', width: '100%', background: 'none', border: 'none', cursor: 'text', padding: 0, fontFamily: SYS, ...style }}>
    {value || <span style={{ color: '#C0C0C0' }}>{placeholder}</span>}
  </button>
}

// ─── Venue address sheet (admin only) ────────────────────────────────────────

type NominatimResult = { display_name: string; lat: string; lon: string }

function VenueAddressSheet({ open, onClose, onSave }: {
  open: boolean
  onClose: () => void
  onSave: (address: string, lat: number, lng: number) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [saving, setSaving] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(q: string) {
    setQuery(q)
    if (timer.current) clearTimeout(timer.current)
    if (q.length < 3) { setResults([]); return }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
          { headers: { 'Accept-Language': 'es', 'User-Agent': 'TourPilot/1.0' } }
        )
        setResults(await res.json())
      } catch { setResults([]) }
    }, 400)
  }

  async function select(r: NominatimResult) {
    setSaving(true)
    await onSave(r.display_name, parseFloat(r.lat), parseFloat(r.lon))
    setSaving(false)
    setQuery('')
    setResults([])
    onClose()
  }

  function handleClose() { setQuery(''); setResults([]); onClose() }

  useScrollLock(open)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!open || !mounted) return null
  return createPortal(
    <>
      <div onClick={handleClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px', maxHeight: '80vh', overflowY: 'auto', zIndex: 9999, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}>
        <p style={{ fontWeight: 700, fontSize: 18, margin: '0 0 16px 0', fontFamily: SYS }}>Editar dirección</p>

        <input
          autoFocus value={query} onChange={e => handleChange(e.target.value)}
          placeholder="Buscar dirección..."
          style={{ width: '100%', background: '#F5F5F5', border: 'none', borderRadius: 12, height: 48, padding: '0 14px', fontSize: 16, fontFamily: SYS, outline: 'none', boxSizing: 'border-box', marginBottom: results.length ? 8 : 0 }}
        />

        {results.length > 0 && (
          <div style={{ background: '#F5F5F5', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
            {results.map((r, i) => (
              <button key={i} onClick={() => !saving && select(r)}
                style={{ width: '100%', textAlign: 'left', padding: '0 16px', background: 'none', border: 'none', borderBottom: i < results.length - 1 ? '0.5px solid #E8E8E8' : 'none', cursor: 'pointer', fontFamily: SYS, height: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: saving ? 0.5 : 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: '0 0 1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display_name.split(',')[0]}</p>
                <p style={{ fontSize: 12, color: '#999', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display_name.split(',').slice(1, 4).join(',').trim()}</p>
              </button>
            ))}
          </div>
        )}

        <button onClick={handleClose}
          style={{ width: '100%', background: '#F5F5F5', border: 'none', borderRadius: 14, height: 52, fontSize: 16, fontWeight: 500, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS, marginTop: 4 }}>
          Cancelar
        </button>
      </div>
    </>,
    document.body
  )
}

// ─── Draggable rider doc row ──────────────────────────────────────────────────

function DocRow({ doc, isAdmin, onDelete, onDragStart, onDragOver, onDrop, forcePdf }: {
  doc: Document; isAdmin: boolean; onDelete: (id: string) => void
  onDragStart: (id: string) => void; onDragOver: (e: React.DragEvent) => void; onDrop: (id: string) => void
  forcePdf?: boolean
}) {
  const isPdf = forcePdf || doc.url?.toLowerCase().includes('.pdf')
  return (
    <div
      onDragOver={onDragOver}
      onDrop={() => onDrop(doc.id)}
      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
    >
      {isAdmin && (
        <span
          draggable
          onDragStart={() => onDragStart(doc.id)}
          style={{ color: 'rgba(0,0,0,0.25)', fontSize: 13, cursor: 'grab', userSelect: 'none', flexShrink: 0, touchAction: 'none' }}
        >≡</span>
      )}
      <a href={doc.url ? normalizeUrl(doc.url) : '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F5F5F5', borderRadius: 8, padding: '8px 10px' }}>
          <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1, color: '#007AFF' }}>{isPdf ? '📄' : '🔗'}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: isPdf ? '#1a1a1a' : '#007AFF', fontFamily: SYS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {trunc(doc.label)}
          </span>
        </div>
      </a>
      {isAdmin && <button onClick={() => onDelete(doc.id)} style={{ color: 'rgba(0,0,0,0.25)', fontSize: 11, minWidth: 18, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>✕</button>}
    </div>
  )
}

// ─── Contacts bottom sheet ───────────────────────────────────────────────────

function ContactsSheet({ open, onClose, contacts, isAdmin, showId, onAdd, onDelete }: {
  open: boolean; onClose: () => void; contacts: Contact[]; isAdmin: boolean
  showId: string; onAdd: (c: Contact) => void; onDelete: (id: string) => void
}) {
  const supabase = createClient()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', role: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)

  async function confirmDelete(id: string) {
    await supabase.from('contacts').delete().eq('id', id)
    onDelete(id)
    setPendingDelete(null)
  }

  async function saveContact(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const { data: row } = await supabase.from('contacts')
      .insert({ show_id: showId, name: form.name, role: form.role || null, phone: form.phone || null, email: form.email || null })
      .select().single()
    if (row) onAdd(row)
    setForm({ name: '', role: '', phone: '', email: '' })
    setAdding(false)
    setSaving(false)
  }

  function handleClose() { setPendingDelete(null); setAdding(false); setForm({ name: '', role: '', phone: '', email: '' }); onClose() }

  useScrollLock(open)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!open || !mounted) return null
  return createPortal(
    <>
      <div onClick={handleClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px', maxHeight: '80vh', overflowY: 'auto', zIndex: 9999, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}>
        <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 16px 0', fontFamily: SYS }}>Contactos</p>

        {contacts.length === 0 && !adding && (
          <p style={{ fontSize: 15, color: '#C0C0C0', margin: '0 0 16px 0', fontFamily: SYS }}>Sin contactos</p>
        )}

        {contacts.length > 0 && (
          <div style={{ background: '#F5F5F5', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
            {contacts.map((c, i) => (
              <div key={c.id} style={{ padding: '14px 16px', borderBottom: i < contacts.length - 1 ? '0.5px solid #F0F0F0' : 'none', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: '0 0 1px 0', fontFamily: SYS }}>{c.name}</p>
                  {c.role && <p style={{ fontSize: 13, color: '#999', margin: '0 0 6px 0', fontFamily: SYS }}>{c.role}</p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {c.phone && <a href={`tel:${c.phone}`} style={{ fontSize: 14, color: '#007AFF', fontFamily: SYS, textDecoration: 'none' }}>{c.phone}</a>}
                    {c.email && <a href={`mailto:${c.email}`} style={{ fontSize: 14, color: '#007AFF', fontFamily: SYS, textDecoration: 'none' }}>{c.email}</a>}
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => pendingDelete === c.id ? confirmDelete(c.id) : setPendingDelete(c.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 0 0', fontSize: 16, color: pendingDelete === c.id ? '#DC412C' : '#C0C0C0', flexShrink: 0, minWidth: 32, minHeight: 32 }}>
                    🗑
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isAdmin && adding && (
          <form onSubmit={saveContact} style={{ background: '#F5F5F5', borderRadius: 14, padding: '14px 16px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input autoFocus placeholder="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '10px 12px', fontSize: 15, fontFamily: SYS, outline: 'none' }} />
            <input placeholder="Rol" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '10px 12px', fontSize: 15, fontFamily: SYS, outline: 'none' }} />
            <input placeholder="Teléfono" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '10px 12px', fontSize: 15, fontFamily: SYS, outline: 'none' }} />
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '10px 12px', fontSize: 15, fontFamily: SYS, outline: 'none' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setAdding(false)} style={{ fontSize: 14, color: '#999', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS }}>Cancelar</button>
              <button type="submit" style={{ fontSize: 14, fontWeight: 700, background: '#1a1a1a', color: '#fff', padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: SYS }}>{saving ? '…' : 'Guardar'}</button>
            </div>
          </form>
        )}

        {isAdmin && !adding && (
          <button onClick={() => setAdding(true)}
            style={{ width: '100%', background: '#F5F5F5', border: 'none', borderRadius: 14, height: 48, fontSize: 15, fontWeight: 600, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS, marginBottom: 12 }}>
            + Añadir contacto
          </button>
        )}

        <button onClick={handleClose}
          style={{ width: '100%', background: '#F5F5F5', border: 'none', borderRadius: 14, height: 52, fontSize: 16, fontWeight: 500, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS }}>
          Cancelar
        </button>
      </div>
    </>,
    document.body
  )
}

// ─── Hotel edit sheet ────────────────────────────────────────────────────────

function HotelEditSheet({ open, onClose, initialName, initialPhone, onSave }: {
  open: boolean; onClose: () => void
  initialName: string; initialPhone: string
  onSave: (data: { name: string; address: string; lat: number | null; lng: number | null; phone: string }) => Promise<void>
}) {
  const [query, setQuery] = useState(initialName)
  const [results, setResults] = useState<{ name: string; display: string; lat: string; lon: string }[]>([])
  const [selected, setSelected] = useState<{ name: string; address: string; lat: number; lng: number } | null>(null)
  const [phone, setPhone] = useState(initialPhone)
  const [saving, setSaving] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setQuery(initialName); setPhone(initialPhone); setSelected(null); setResults([]) }, [open, initialName, initialPhone])

  function handleChange(q: string) {
    setQuery(q); setSelected(null)
    if (timer.current) clearTimeout(timer.current)
    if (q.length < 3) { setResults([]); return }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q + ' hotel')}`,
          { headers: { 'Accept-Language': 'es', 'User-Agent': 'TourPilot/1.0' } }
        )
        const items = await res.json()
        setResults(items.map((r: { name: string; display_name: string; lat: string; lon: string }) => ({
          name: r.name || r.display_name.split(',')[0], display: r.display_name, lat: r.lat, lon: r.lon
        })))
      } catch { setResults([]) }
    }, 400)
  }

  function pick(r: { name: string; display: string; lat: string; lon: string }) {
    setQuery(r.name)
    setSelected({ name: r.name, address: r.display, lat: parseFloat(r.lat), lng: parseFloat(r.lon) })
    setResults([])
  }

  async function handleSave() {
    setSaving(true)
    await onSave({
      name: selected?.name ?? query,
      address: selected?.address ?? '',
      lat: selected?.lat ?? null,
      lng: selected?.lng ?? null,
      phone,
    })
    setSaving(false)
  }

  useScrollLock(open)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!open || !mounted) return null
  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px', maxHeight: '80vh', overflowY: 'auto', zIndex: 9999, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}>
        <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 14px 0', fontFamily: SYS }}>Editar hotel</p>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <p style={{ fontSize: 11, color: '#999', margin: '0 0 4px 0', fontFamily: SYS }}>Nombre del hotel</p>
          <input autoFocus value={query} onChange={e => handleChange(e.target.value)}
            placeholder="Buscar hotel…"
            style={{ width: '100%', background: '#F5F5F5', border: 'none', borderRadius: 12, padding: '12px 14px', fontSize: 15, fontFamily: SYS, outline: 'none', boxSizing: 'border-box' }} />
          {results.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '0.5px solid #E0E0E0', borderRadius: 14, overflow: 'hidden', zIndex: 10, marginTop: 4 }}>
              {results.map((r, i) => (
                <button key={i} onClick={() => pick(r)}
                  style={{ width: '100%', textAlign: 'left', padding: '11px 14px', background: 'none', border: 'none', borderBottom: i < results.length - 1 ? '0.5px solid #F0F0F0' : 'none', cursor: 'pointer', fontFamily: SYS, minHeight: 48 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: '0 0 1px 0' }}>{r.name}</p>
                  <p style={{ fontSize: 12, color: '#999', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display.split(',').slice(1, 3).join(',').trim()}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: '#999', margin: '0 0 4px 0', fontFamily: SYS }}>Teléfono del hotel</p>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="+34 600 000 000"
            style={{ width: '100%', background: '#F5F5F5', border: 'none', borderRadius: 12, padding: '12px 14px', fontSize: 15, fontFamily: SYS, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, height: 52, background: '#F5F5F5', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 500, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !query.trim()}
            style={{ flex: 1, height: 52, background: '#1a1a1a', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: SYS, opacity: saving || !query.trim() ? 0.5 : 1 }}>
            {saving ? '…' : 'Guardar'}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Schedule location picker (Nominatim) ────────────────────────────────────

function SchedLocationSheet({ open, onClose, onSave }: {
  open: boolean; onClose: () => void
  onSave: (address: string, lat: number, lng: number) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [saving, setSaving] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(q: string) {
    setQuery(q)
    if (timer.current) clearTimeout(timer.current)
    if (q.length < 3) { setResults([]); return }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
          { headers: { 'Accept-Language': 'es', 'User-Agent': 'TourPilot/1.0' } }
        )
        setResults(await res.json())
      } catch { setResults([]) }
    }, 400)
  }

  async function select(r: NominatimResult) {
    setSaving(true)
    await onSave(r.display_name, parseFloat(r.lat), parseFloat(r.lon))
    setSaving(false)
    setQuery(''); setResults([])
  }

  function handleClose() { setQuery(''); setResults([]); onClose() }

  useScrollLock(open)
  const [mounted, setMounted] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => { setMounted(true); setIsDesktop(window.innerWidth > 768) }, [])
  if (!open || !mounted) return null
  const panelStyle: React.CSSProperties = isDesktop
    ? { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 480, background: '#fff', borderRadius: 16, padding: '24px 20px 32px', maxHeight: '80vh', overflowY: 'auto', zIndex: 9999 }
    : { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', minHeight: 200, maxHeight: '60vh', overflowY: 'auto', zIndex: 9999, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }
  return createPortal(
    <>
      <div onClick={handleClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }} />
      <div style={panelStyle}>
        <p style={{ fontWeight: 700, fontSize: 18, margin: '0 0 14px 0', fontFamily: SYS }}>Añadir dirección</p>
        <input autoFocus value={query} onChange={e => handleChange(e.target.value)}
          placeholder="Buscar dirección…"
          style={{ width: '100%', background: '#F5F5F5', border: 'none', borderRadius: 12, padding: '12px 14px', fontSize: 16, fontFamily: SYS, outline: 'none', marginBottom: results.length ? 8 : 0, boxSizing: 'border-box' }} />
        {results.length > 0 && (
          <div style={{ background: '#fff', border: '0.5px solid #E0E0E0', borderRadius: 14, overflow: 'hidden' }}>
            {results.map((r, i) => (
              <button key={i} onClick={() => !saving && select(r)}
                style={{ width: '100%', textAlign: 'left', padding: '12px 14px', background: 'none', border: 'none', borderBottom: i < results.length - 1 ? '0.5px solid #F0F0F0' : 'none', cursor: 'pointer', fontFamily: SYS, minHeight: 44, opacity: saving ? 0.5 : 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', margin: '0 0 1px 0', lineHeight: 1.3 }}>{r.display_name.split(',')[0]}</p>
                <p style={{ fontSize: 12, color: '#999', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display_name.split(',').slice(1, 4).join(',').trim()}</p>
              </button>
            ))}
          </div>
        )}
        <button onClick={handleClose} style={{ width: '100%', background: 'none', border: 'none', fontSize: 15, color: '#999', cursor: 'pointer', marginTop: 12, padding: '12px 0', fontFamily: SYS, textAlign: 'center' }}>Cancelar</button>
      </div>
    </>,
    document.body
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ShowDetail({ show, isAdmin, tourId, userId, tourMembers, ticketVisibility, scheduleVisibility, color: colorProp, bandLogoUrl }: { show: Show; isAdmin: boolean; tourId: string; userId: string | null; tourMembers: TourMember[]; ticketVisibility: TicketVisibility[]; scheduleVisibility: ScheduleVisibility[]; color?: string; bandLogoUrl?: string | null }) {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const dragId = useRef<string | null>(null)

  // ── visibility ────────────────────────────────────────────────────────────────
  const ticketVisMap = ticketVisibility.reduce((acc, tv) => {
    if (!acc[tv.document_id]) acc[tv.document_id] = new Set<string>()
    acc[tv.document_id].add(tv.user_id)
    return acc
  }, {} as Record<string, Set<string>>)

  const schedVisMap = scheduleVisibility.reduce((acc, sv) => {
    if (!acc[sv.schedule_item_id]) acc[sv.schedule_item_id] = new Set<string>()
    acc[sv.schedule_item_id].add(sv.user_id)
    return acc
  }, {} as Record<string, Set<string>>)

  const [localTicketVis, setLocalTicketVis] = useState<Record<string, Set<string>>>(ticketVisMap)
  const [localSchedVis, setLocalSchedVis] = useState<Record<string, Set<string>>>(schedVisMap)
  const [visSheet, setVisSheet] = useState<{ type: 'ticket' | 'schedule'; id: string } | null>(null)

  const [data, setData] = useState(show)
  const [travelDayBefore, setTravelDayBefore] = useState<TravelDay | null>(null)
  const [travelDayAfter, setTravelDayAfter] = useState<TravelDay | null>(null)
  const [creatingTravel, setCreatingTravel] = useState<'before' | 'after' | null>(null)
  const [contacts, setContacts] = useState<Contact[]>(show.contacts ?? [])
  const [schedule, setSchedule] = useState<ScheduleItem[]>(
    (show.schedule_items ?? []).sort((a, b) => a.time_start.localeCompare(b.time_start))
  )
  const [docs, setDocs] = useState<Document[]>(
    (show.documents ?? []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  )
  const [noteAttachments, setNoteAttachments] = useState<NoteAttachment[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(true)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const noteAttachRef = useRef<HTMLInputElement>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const [confirmDeleteShow, setConfirmDeleteShow] = useState(false)

  const [sheetDir, setSheetDir] = useState(false)
  const [sheetContacts, setSheetContacts] = useState(false)
  const [sheetAddress, setSheetAddress] = useState(false)
  const [pickingCheck, setPickingCheck] = useState(false)
  const [infoSheet, setInfoSheet] = useState<'show' | 'sc' | 'aforo' | 'pantalla' | null>(null)
  const [showForm, setShowForm] = useState({ time: '', duration: '' })
  const [showFormError, setShowFormError] = useState<string | null>(null)
  const [scForm, setScForm] = useState({ time: '', duration: '' })
  const [scFormError, setScFormError] = useState<string | null>(null)
  const [aforoForm, setAforoForm] = useState({ capacity: '' })
  const [pantallaForm, setPantallaForm] = useState({ has_screen: false, resolution: '' })
  const [addingLink, setAddingLink] = useState(false)
  const [newLink, setNewLink] = useState({ label: '', url: '' })

  async function update(field: string, value: string | boolean | number | null) {
    const v = value === '' ? null : value
    await supabase.from('shows').update({ [field]: v }).eq('id', data.id)
    setData(d => ({ ...d, [field]: v }))
  }

  // ── travel days ──────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('travel_days').select('*').eq('show_id', data.id)
      .then(({ data: rows }) => {
        const list = rows ?? []
        setTravelDayBefore(list.find((r: TravelDay) => r.direction === 'before') ?? null)
        setTravelDayAfter(list.find((r: TravelDay) => r.direction === 'after') ?? null)
      })
  }, [data.id])

  async function handleDeleteShow() {
    await supabase.from('shows').delete().eq('id', data.id)
    router.push(`/tours/${tourId}`)
  }

  async function handleTravelDay(direction: 'before' | 'after') {
    const existing = direction === 'before' ? travelDayBefore : travelDayAfter
    if (existing) { router.push(`/travel/${existing.id}`); return }
    setCreatingTravel(direction)
    const [y, mo, dy] = data.date.split('-').map(Number)
    const d = new Date(y, mo - 1, dy + (direction === 'before' ? -1 : 1))
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const { data: row } = await supabase.from('travel_days').insert({
      show_id: data.id, date, direction,
    }).select().single()
    setCreatingTravel(null)
    if (row) {
      if (direction === 'before') setTravelDayBefore(row)
      else setTravelDayAfter(row)
      router.push(`/travel/${row.id}`)
    }
  }

  // ── note attachments ─────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('note_attachments').select('*').eq('show_id', data.id).order('created_at', { ascending: true })
      .then(({ data: rows }) => { setNoteAttachments(rows ?? []); setLoadingAttachments(false) })
  }, [data.id])

  async function uploadNoteAttachment(file: File) {
    setUploadingAttachment(true)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const isImage = ['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(ext)
    const fileType: 'image' | 'pdf' = isImage ? 'image' : 'pdf'
    const path = `${data.id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('notes-attachments').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('notes-attachments').getPublicUrl(path)
      const { data: row } = await supabase.from('note_attachments')
        .insert({ show_id: data.id, file_name: file.name, file_url: publicUrl, file_type: fileType })
        .select().single()
      if (row) setNoteAttachments(a => [...a, row])
    }
    setUploadingAttachment(false)
  }

  async function deleteNoteAttachment(attachment: NoteAttachment) {
    const url = new URL(attachment.file_url)
    const pathParts = url.pathname.split('/notes-attachments/')
    if (pathParts[1]) await supabase.storage.from('notes-attachments').remove([pathParts[1]])
    await supabase.from('note_attachments').delete().eq('id', attachment.id)
    setNoteAttachments(a => a.filter(x => x.id !== attachment.id))
  }

  // ── contacts ─────────────────────────────────────────────────────────────────
  const [addingContact, setAddingContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', role: '', email: '', phone: '' })

  async function saveContact(e: React.FormEvent) {
    e.preventDefault()
    if (!newContact.name) return
    const { data: row } = await supabase.from('contacts').insert({ show_id: data.id, ...newContact }).select().single()
    if (row) setContacts(c => [...c, row])
    setAddingContact(false); setNewContact({ name: '', role: '', email: '', phone: '' })
  }
  async function updateContact(id: string, field: string, value: string) {
    await supabase.from('contacts').update({ [field]: value }).eq('id', id)
    setContacts(c => c.map(x => x.id === id ? { ...x, [field]: value } : x))
  }

  // ── schedule ──────────────────────────────────────────────────────────────────
  const [expandedSchedId, setExpandedSchedId] = useState<string | null>(null)
  const [editingSchedMap, setEditingSchedMap] = useState<Record<string, Partial<ScheduleItem>>>({})
  const [addingSched, setAddingSched] = useState(false)
  const [newSched, setNewSched] = useState({ time_start: '', time_end: '', title: '', subtitle: '', contact_id: null as string | null, location_address: null as string | null, location_lat: null as number | null, location_lng: null as number | null })
  const [newSchedPanel, setNewSchedPanel] = useState<'none' | 'contact' | 'address'>('none')
  const [newSchedAddrQuery, setNewSchedAddrQuery] = useState('')
  const [newSchedAddrResults, setNewSchedAddrResults] = useState<{ display_name: string; lat: string; lon: string }[]>([])
  const newSchedAddrTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [schedLocSheet, setSchedLocSheet] = useState<string | null>(null)   // item id: open Nominatim picker
  const [schedMapSheet, setSchedMapSheet] = useState<string | null>(null)   // item id: open maps chooser
  const [schedContactSheet, setSchedContactSheet] = useState<string | null>(null)

  function getEdit(id: string, item: ScheduleItem): Partial<ScheduleItem> {
    return editingSchedMap[id] ?? item
  }
  function setEdit(id: string, patch: Partial<ScheduleItem>) {
    setEditingSchedMap(m => ({ ...m, [id]: { ...(m[id] ?? {}), ...patch } }))
  }
  async function saveSchedField(id: string, field: string, value: string | number | null) {
    const v = value === '' ? null : value
    await supabase.from('schedule_items').update({ [field]: v }).eq('id', id)
    setSchedule(s => s.map(x => x.id === id ? { ...x, [field]: v } : x).sort((a, b) => a.time_start.localeCompare(b.time_start)))
  }
  async function saveSchedEdit(id: string, item: ScheduleItem) {
    const edits = editingSchedMap[id] ?? {}
    if (!Object.keys(edits).length) return
    await supabase.from('schedule_items').update(edits).eq('id', id)
    setSchedule(s => s.map(x => x.id === id ? { ...x, ...edits } : x).sort((a, b) => a.time_start.localeCompare(b.time_start)))
  }
  async function saveSched(e: React.FormEvent) {
    e.preventDefault()
    if (!newSched.time_start || !newSched.title) return
    const { data: row } = await supabase.from('schedule_items').insert({
      show_id: data.id,
      time_start: newSched.time_start,
      time_end: newSched.time_end || null,
      title: newSched.title,
      subtitle: newSched.subtitle || null,
      contact_id: newSched.contact_id,
      location_address: newSched.location_address,
      location_lat: newSched.location_lat,
      location_lng: newSched.location_lng,
      order_index: schedule.length,
    }).select().single()
    if (row) setSchedule(s => [...s, row].sort((a, b) => a.time_start.localeCompare(b.time_start)))
    setAddingSched(false)
    setNewSched({ time_start: '', time_end: '', title: '', subtitle: '', contact_id: null, location_address: null, location_lat: null, location_lng: null })
    setNewSchedPanel('none'); setNewSchedAddrQuery(''); setNewSchedAddrResults([])
  }
  async function deleteSched(id: string) {
    await supabase.from('schedule_items').delete().eq('id', id)
    setSchedule(s => s.filter(x => x.id !== id))
    if (expandedSchedId === id) setExpandedSchedId(null)
  }

  // ── documents ─────────────────────────────────────────────────────────────────
  const [uploadType] = useState<'rider'>('rider')
  const [uploading, setUploading] = useState(false)

  async function uploadDoc(file: File) {
    setUploading(true)
    const path = `${data.id}/rider-${Date.now()}.pdf`
    const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
      const idx = riderDocs.length
      const { data: row } = await supabase.from('documents')
        .insert({ show_id: data.id, type: 'rider', label: file.name.replace(/\.pdf$/i, ''), url: publicUrl, order_index: idx })
        .select().single()
      if (row) setDocs(d => [...d, row])
    }
    setUploading(false)
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault()
    if (!newLink.url) return
    const idx = riderDocs.length
    const url = normalizeUrl(newLink.url)
    const { data: row } = await supabase.from('documents')
      .insert({ show_id: data.id, type: 'rider', label: newLink.label || url, url, order_index: idx })
      .select().single()
    if (row) setDocs(d => [...d, row])
    setAddingLink(false); setNewLink({ label: '', url: '' })
  }

  async function deleteDoc(id: string) {
    await supabase.from('documents').delete().eq('id', id)
    setDocs(d => d.filter(x => x.id !== id))
  }

  async function reorderDocs(fromId: string, toId: string) {
    if (fromId === toId) return
    const current = [...riderDocs]
    const fromIdx = current.findIndex(d => d.id === fromId)
    const toIdx = current.findIndex(d => d.id === toId)
    const reordered = [...current]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    const updated = reordered.map((d, i) => ({ ...d, order_index: i }))
    setDocs(d => {
      const nonRider = d.filter(x => x.type !== 'rider')
      return [...nonRider, ...updated].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    })
    await Promise.all(updated.map(d => supabase.from('documents').update({ order_index: d.order_index }).eq('id', d.id)))
  }

  async function uploadOther(type: 'setlist' | 'ticket', file: File) {
    setUploading(true)
    const path = `${data.id}/${type}-${Date.now()}.pdf`
    const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
      const { data: row } = await supabase.from('documents')
        .insert({ show_id: data.id, type, label: file.name.replace(/\.pdf$/i, ''), url: publicUrl, order_index: 0 })
        .select().single()
      if (row) setDocs(d => [...d, row])
    }
    setUploading(false)
  }

  const ticketFileRef = useRef<HTMLInputElement>(null)
  const setlistFileRef = useRef<HTMLInputElement>(null)

  // ── hotel ─────────────────────────────────────────────────────────────────────
  const [sheetHotel, setSheetHotel] = useState(false)
  const [sheetHotelDir, setSheetHotelDir] = useState(false)

  // ─────────────────────────────────────────────────────────────────────────────

  const visibleTicketDocs = isAdmin ? docs.filter(d => d.type === 'ticket') : docs.filter(d => d.type === 'ticket').filter(doc => {
    const restricted = localTicketVis[doc.id]
    if (!restricted || restricted.size === 0) return true
    return userId ? restricted.has(userId) : false
  })

  const visibleSchedule = isAdmin ? schedule : schedule.filter(item => {
    const restricted = localSchedVis[item.id]
    if (!restricted || restricted.size === 0) return true
    return userId ? restricted.has(userId) : false
  })

  const color = colorProp ?? data.color ?? '#A4B2DA'
  const hasCoords = data.venue_lat != null && data.venue_lng != null
  const venueAppleMaps = hasCoords
    ? `maps://maps.apple.com/?ll=${data.venue_lat},${data.venue_lng}&q=${encodeURIComponent(data.venue_name)}`
    : `maps://maps.apple.com/?q=${encodeURIComponent(data.venue_address || data.venue_name + ' ' + data.city)}`
  const venueGoogleMaps = hasCoords
    ? `https://maps.google.com/?q=${data.venue_lat},${data.venue_lng}`
    : `https://maps.google.com/?q=${encodeURIComponent(data.venue_address || data.venue_name + ' ' + data.city)}`
  const venueWaze = hasCoords
    ? `https://waze.com/ul?ll=${data.venue_lat},${data.venue_lng}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(data.venue_address || data.venue_name + ' ' + data.city)}`
  const venueQuery = encodeURIComponent(data.venue_address || data.venue_name + ' ' + data.city)
  const hasHotelCoords = data.hotel_lat != null && data.hotel_lng != null
  const hotelAppleMaps = data.hotel_name ? (hasHotelCoords
    ? `maps://maps.apple.com/?ll=${data.hotel_lat},${data.hotel_lng}&q=${encodeURIComponent(data.hotel_name)}`
    : `maps://maps.apple.com/?q=${encodeURIComponent(data.hotel_name + ' ' + (data.hotel_address ?? ''))}`) : null
  const hotelGoogleMaps = data.hotel_name ? (hasHotelCoords
    ? `https://maps.google.com/?q=${data.hotel_lat},${data.hotel_lng}`
    : `https://maps.google.com/?q=${encodeURIComponent(data.hotel_name + ' ' + (data.hotel_address ?? ''))}`) : null
  const hotelWaze = data.hotel_name ? (hasHotelCoords
    ? `https://waze.com/ul?ll=${data.hotel_lat},${data.hotel_lng}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(data.hotel_name + ' ' + (data.hotel_address ?? ''))}`) : null
  const riderDocs = docs.filter(d => d.type === 'rider')
  const ticketDocs = docs.filter(d => d.type === 'ticket')
  const setlistDocs = docs.filter(d => d.type === 'setlist')
  const checkType = data.check_type ?? 'soundcheck'

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#F5F5F5', borderRadius: 10, padding: '11px 14px',
    fontSize: 15, fontFamily: SYS, outline: 'none', minHeight: 44,
    border: '1.5px solid transparent', color: '#1a1a1a',
  }
  const navBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600,
    color: '#1a1a1a', minHeight: 44, padding: '0 4px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS,
  }
  const addBtnStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, background: '#1a1a1a', color: '#fff',
    padding: '6px 16px', borderRadius: 20, minHeight: 32, border: 'none', cursor: 'pointer', fontFamily: SYS,
  }
  const heroBtnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    height: 32, padding: '0 14px', borderRadius: 20,
    background: 'rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 600, color: '#1a1a1a', fontFamily: SYS,
  }
  const sheetBtnStyle: React.CSSProperties = {
    width: '100%', height: 52, background: 'none', border: 'none',
    borderBottom: '0.5px solid #F0F0F0', cursor: 'pointer', textAlign: 'left',
    padding: '0 4px', fontSize: 16, fontWeight: 500, color: '#1a1a1a', fontFamily: SYS,
    display: 'flex', alignItems: 'center',
  }
  const cancelBtnStyle: React.CSSProperties = {
    width: '100%', height: 52, background: '#F5F5F5', borderRadius: 14,
    border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 600,
    color: '#1a1a1a', fontFamily: SYS, marginTop: 10,
  }
  const cancelFlexStyle: React.CSSProperties = {
    flex: 1, height: 52, background: '#F5F5F5', borderRadius: 14,
    border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 600,
    color: '#1a1a1a', fontFamily: SYS,
  }

  function fmtFull(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  function hexToRgb(hex: string) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 164, g: 178, b: 218 }
  }

  async function generatePdf() {
    try {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ])
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = 210
    const M = 16
    const rgb = hexToRgb(color)

    // ── Header ──────────────────────────────────────────────────────────────────
    doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.rect(0, 0, W, 42, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('TOUR PILOT', M, 12)

    doc.setFontSize(18)
    doc.text(data.venue_name, W - M, 17, { align: 'right', maxWidth: W - M * 2 - 40 })

    doc.setFont('helvetica', 'bolditalic')
    doc.setFontSize(11)
    doc.setTextColor(255, 255, 255)
    doc.text(`${data.city}  ·  ${fmtFull(data.date)}`, W - M, 28, { align: 'right' })

    let y = 52

    // ── Bloque 1 — Info técnica ──────────────────────────────────────────────────
    doc.setFillColor(245, 245, 245)
    doc.roundedRect(M, y, W - M * 2, 28, 3, 3, 'F')

    const colW = (W - M * 2) / 3
    const infoCols = [
      { label: 'SHOW', value: t5(data.show_time) || '—', sub: data.show_duration ? `${data.show_duration} min` : '' },
      { label: checkType === 'linecheck' ? 'LC' : 'SC', value: t5(data.soundcheck_time) || '—', sub: data.soundcheck_duration ? `${data.soundcheck_duration} min` : '' },
      { label: 'PANTALLA', value: data.has_screen ? 'SÍ' : 'NO', sub: data.has_screen && data.screen_resolution ? data.screen_resolution : '' },
    ]
    infoCols.forEach((col, i) => {
      const cx = M + i * colW + 8
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(153, 153, 153)
      doc.text(col.label, cx, y + 9)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(26, 26, 26)
      doc.text(col.value, cx, y + 19)
      if (col.sub) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(153, 153, 153); doc.text(col.sub, cx, y + 25) }
      if (i < 2) { doc.setDrawColor(232, 232, 232); doc.setLineWidth(0.3); doc.line(M + (i + 1) * colW, y + 4, M + (i + 1) * colW, y + 25) }
    })
    y += 38

    // ── Bloque 2 — Day Sheet ──────────────────────────────────────────────────
    if (schedule.length > 0) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(153, 153, 153)
      doc.text('DAY SHEET', M, y); y += 4
      autoTable(doc, {
        startY: y, margin: { left: M, right: M },
        head: [['HORA INICIO', 'HORA FIN', 'ACTIVIDAD', 'NOTAS']],
        body: visibleSchedule.map(s => [t5(s.time_start), t5(s.time_end) || '', s.title, s.subtitle || '']),
        styles: { fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 4, right: 4 }, font: 'courier', textColor: [26, 26, 26] as [number, number, number] },
        headStyles: { fillColor: [26, 26, 26] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontSize: 7, fontStyle: 'bold', font: 'helvetica' },
        columnStyles: { 0: { cellWidth: 26 }, 1: { cellWidth: 22 } },
        alternateRowStyles: { fillColor: [249, 249, 249] as [number, number, number] },
        tableLineColor: [232, 232, 232] as [number, number, number], tableLineWidth: 0.25,
      })
      y = (doc as any).lastAutoTable.finalY + 10
    }

    // ── Bloque 3 — Hotel ──────────────────────────────────────────────────────
    if (data.hotel_name) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(153, 153, 153)
      doc.text('HOTEL', M, y); y += 5
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(26, 26, 26)
      doc.text(data.hotel_name, M, y); y += 5
      if (data.hotel_address) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(102, 102, 102); doc.text(data.hotel_address, M, y, { maxWidth: W - M * 2 }); y += 5 }
      if (data.hotel_phone) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(0, 122, 255); doc.textWithLink(data.hotel_phone, M, y, { url: `tel:${data.hotel_phone}` }); y += 5 }
      y += 4
    }

    // ── Bloque 4 — Contactos ──────────────────────────────────────────────────
    if (contacts.length > 0) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(153, 153, 153)
      doc.text('CONTACTOS', M, y); y += 4
      autoTable(doc, {
        startY: y, margin: { left: M, right: M },
        head: [['NOMBRE', 'ROL', 'TELÉFONO', 'EMAIL']],
        body: contacts.map(c => [c.name, c.role || '', c.phone || '', c.email || '']),
        styles: { fontSize: 9, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, textColor: [26, 26, 26] as [number, number, number] },
        headStyles: { fillColor: [26, 26, 26] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontSize: 7, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 249, 249] as [number, number, number] },
        tableLineColor: [232, 232, 232] as [number, number, number], tableLineWidth: 0.25,
        didDrawCell: (d) => {
          if (d.section === 'body') {
            const row = contacts[d.row.index]
            if (d.column.index === 2 && row?.phone) doc.link(d.cell.x, d.cell.y, d.cell.width, d.cell.height, { url: `tel:${row.phone}` })
            if (d.column.index === 3 && row?.email) doc.link(d.cell.x, d.cell.y, d.cell.width, d.cell.height, { url: `mailto:${row.email}` })
          }
        },
      })
      y = (doc as any).lastAutoTable.finalY + 10
    }

    // ── Bloque 5 — Documentos ──────────────────────────────────────────────────
    const allDocs = [...riderDocs, ...visibleTicketDocs]
    if (allDocs.length > 0) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(153, 153, 153)
      doc.text('DOCUMENTOS', M, y); y += 6
      allDocs.forEach(d => {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(0, 122, 255)
        doc.textWithLink(d.label || d.url || '', M, y, { url: d.url ?? '' }); y += 6
      })
      y += 4
    }

    // ── Footer ───────────────────────────────────────────────────────────────────
    const pageH = 297
    doc.setDrawColor(232, 232, 232); doc.setLineWidth(0.3)
    doc.line(M, pageH - 14, W - M, pageH - 14)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(153, 153, 153)
    doc.text('Generado con Tour Pilot', M, pageH - 8)
    doc.text(new Date().toLocaleString('es-ES'), W - M, pageH - 8, { align: 'right' })

    doc.save(`${data.venue_name.replace(/[^a-z0-9]/gi, '_')}_${data.date}.pdf`)
    } catch {
      alert('Error al generar el PDF. Inténtalo de nuevo.')
    }
  }

  return (
    <div className="tp-page" style={{ minHeight: '100vh', background: '#fff', maxWidth: 390, margin: '0 auto', paddingBottom: 80, fontFamily: SYS }}>

      {/* ── Nav bar ── */}
      <div style={{ padding: '40px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/tours/${tourId}`}>
          <button className="tp-press" style={navBtnStyle}>
            <svg width="9" height="15" viewBox="0 0 9 15" fill="none"><path d="M8 1L1 7.5L8 14" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Volver
          </button>
        </Link>
        <button className="tp-press" onClick={generatePdf} style={navBtnStyle}>
          Guardar
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none"><path d="M7 1v10M7 11l-4-4M7 11l4-4M1 14h12" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* ── Hero card ── */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ backgroundColor: color, borderRadius: 20, padding: '16px 16px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Top: venue + city·date + address */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Editable value={data.venue_name} onSave={v => update('venue_name', v)} isAdmin={isAdmin}
                  style={{ fontWeight: 800, fontSize: 24, color: '#1a1a1a', lineHeight: 1.15, display: 'block' }} />
              </div>
              {bandLogoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bandLogoUrl} alt="" style={{ maxHeight: 24, width: 'auto', maxWidth: 80, objectFit: 'contain', marginLeft: 12, marginTop: 2, flexShrink: 0 }} />
              )}
            </div>
            <p style={{ fontSize: 14, color: 'rgba(26,26,26,0.7)', margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ fontStyle: 'italic' }}>{data.city}</span>
              {' · '}
              <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 13 }}>{fmt(data.date)}</span>
            </p>
            {isAdmin && (
              <button onClick={() => setSheetAddress(true)}
                style={{ display: 'block', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: 5, fontFamily: SYS, fontSize: 12, color: 'rgba(26,26,26,0.5)', textAlign: 'left' }}>
                Editar dirección
              </button>
            )}
          </div>
          {/* Bottom: action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={heroBtnStyle} onClick={() => setSheetDir(true)}>
              <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
                <path d="M5.5 1C3.29 1 1.5 2.79 1.5 5c0 2.8 4 7 4 7s4-4.2 4-7c0-2.21-1.79-4-4-4z" stroke="#1a1a1a" strokeWidth="1.3" fill="none"/>
                <circle cx="5.5" cy="5" r="1.3" stroke="#1a1a1a" strokeWidth="1.3"/>
              </svg>
              Direcciones
            </button>
            <button style={heroBtnStyle} onClick={() => setSheetContacts(true)}>
              <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
                <circle cx="6" cy="4.5" r="2.5" stroke="#1a1a1a" strokeWidth="1.3"/>
                <path d="M1 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Contactos
            </button>
          </div>
        </div>

        {/* Travel day buttons — admin only */}
        {isAdmin && (
          <div style={{ display: 'flex', gap: 20, marginTop: 10, paddingLeft: 2 }}>
            <button
              onClick={() => handleTravelDay('before')}
              disabled={creatingTravel === 'before'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, color: '#999', fontFamily: SYS, opacity: creatingTravel === 'before' ? 0.5 : 1 }}>
              {travelDayBefore ? 'Ver Travel Day antes' : '+ Travel Day antes'}
            </button>
            <button
              onClick={() => handleTravelDay('after')}
              disabled={creatingTravel === 'after'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, color: '#999', fontFamily: SYS, opacity: creatingTravel === 'after' ? 0.5 : 1 }}>
              {travelDayAfter ? 'Ver Travel Day después' : '+ Travel Day después'}
            </button>
          </div>
        )}
      </div>

      {/* ── Quick info bar (editable) ── */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ background: '#F5F5F5', borderRadius: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'stretch' }}>

          {/* SHOW */}
          <div onClick={() => { if (isAdmin) { setShowForm({ time: t5(data.show_time), duration: data.show_duration ? String(data.show_duration) : '' }); setInfoSheet('show') } }}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '10px 14px', cursor: isAdmin ? 'pointer' : 'default' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', fontFamily: SYS, height: 16, display: 'block' }}>Show</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: data.show_time ? '#1a1a1a' : '#CCC', fontFamily: SYS, lineHeight: 1 }}>{t5(data.show_time) || '—'}</span>
            <span style={{ fontSize: 11, color: '#999', fontFamily: SYS, marginTop: 3, minHeight: 14 }}>{data.show_duration ? `${data.show_duration} min` : ''}</span>
          </div>

          {/* SC / LC */}
          <div onClick={() => { if (isAdmin) { setScForm({ time: t5(data.soundcheck_time), duration: data.soundcheck_duration ? String(data.soundcheck_duration) : '' }); setInfoSheet('sc') } }}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '10px 14px', borderLeft: '1px solid #E8E8E8', borderRight: '1px solid #E8E8E8', cursor: isAdmin ? 'pointer' : 'default' }}>
            <button
              onClick={e => { e.stopPropagation(); if (isAdmin) update('check_type', checkType === 'linecheck' ? 'soundcheck' : 'linecheck') }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: isAdmin ? 'pointer' : 'default', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', fontFamily: SYS, height: 16, lineHeight: '16px' }}>
              {checkType === 'linecheck' ? 'Linecheck' : 'Soundcheck'}
            </button>
            <span style={{ fontSize: 22, fontWeight: 700, color: data.soundcheck_time ? '#1a1a1a' : '#CCC', fontFamily: SYS, lineHeight: 1 }}>
              {t5(data.soundcheck_time) || '—'}
            </span>
            <span style={{ fontSize: 11, color: '#999', fontFamily: SYS, marginTop: 3, minHeight: 14 }}>{data.soundcheck_duration ? `${data.soundcheck_duration} min` : ''}</span>
          </div>

          {/* PANTALLA */}
          <div onClick={() => { if (isAdmin) { setPantallaForm({ has_screen: data.has_screen, resolution: data.screen_resolution ?? '' }); setInfoSheet('pantalla') } }}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '10px 14px', cursor: isAdmin ? 'pointer' : 'default' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', fontFamily: SYS, height: 16, display: 'block' }}>Pantalla</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', fontFamily: SYS, lineHeight: 1 }}>{data.has_screen ? 'SÍ' : 'NO'}</span>
            <span style={{ fontSize: 11, color: '#999', fontFamily: SYS, marginTop: 3, minHeight: 14 }}>{data.has_screen && data.screen_resolution ? data.screen_resolution : ''}</span>
          </div>

        </div>
      </div>

      {/* ── Rider / Docs ── */}
      <div style={{ padding: '0 16px' }}>
        <Section
          label="Rider / Docs"
          action={isAdmin ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={() => fileRef.current?.click()}
                style={{ fontSize: 13, fontWeight: 600, background: '#1a1a1a', color: '#fff', padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: SYS, opacity: uploading ? 0.5 : 1 }}>
                {uploading ? '…' : '+ PDF'}
              </button>
              <button onClick={() => setAddingLink(true)}
                style={{ fontSize: 13, fontWeight: 600, background: '#1a1a1a', color: '#fff', padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: SYS }}>
                + Link
              </button>
            </div>
          ) : undefined}>
          {riderDocs.length === 0 && !addingLink && (
            <p style={{ fontSize: 14, color: '#C0C0C0', margin: 0, fontFamily: SYS }}>Sin documentos</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {riderDocs.map(doc => (
              <DocRow key={doc.id} doc={doc} isAdmin={isAdmin} onDelete={deleteDoc}
                onDragStart={id => { dragId.current = id }}
                onDragOver={e => e.preventDefault()}
                onDrop={id => { if (dragId.current) reorderDocs(dragId.current, id); dragId.current = null }}
              />
            ))}
            {isAdmin && addingLink && (
              <form onSubmit={addLink} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <input placeholder="URL *" value={newLink.url} onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))} required
                  style={{ background: '#F5F5F5', border: 'none', borderRadius: 10, padding: '10px 12px', fontSize: 14, fontFamily: SYS, outline: 'none' }} />
                <input placeholder="Nombre (opcional)" value={newLink.label} onChange={e => setNewLink(l => ({ ...l, label: e.target.value }))}
                  style={{ background: '#F5F5F5', border: 'none', borderRadius: 10, padding: '10px 12px', fontSize: 14, fontFamily: SYS, outline: 'none' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => { setAddingLink(false); setNewLink({ label: '', url: '' }) }}
                    style={{ fontSize: 13, color: '#999', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS }}>Cancelar</button>
                  <button type="submit" style={{ fontSize: 13, fontWeight: 700, background: '#1a1a1a', color: '#fff', padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: SYS }}>Añadir</button>
                </div>
              </form>
            )}
          </div>
        </Section>
      </div>

      {/* ── Billetes ── */}
      <div style={{ padding: '0 16px' }}>
        <Section label="Billetes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {visibleTicketDocs.length === 0 && !isAdmin && <p style={{ fontSize: 14, color: '#C0C0C0', margin: 0 }}>—</p>}
            {visibleTicketDocs.map(doc => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <a href={doc.url ? normalizeUrl(doc.url) : '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F5F5F5', borderRadius: 8, padding: '8px 10px' }}>
                    <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1, color: '#007AFF' }}>📄</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#007AFF', fontFamily: SYS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{doc.label || 'Billete'}</span>
                  </div>
                </a>
                {isAdmin && (
                  <button
                    onClick={() => setVisSheet({ type: 'ticket', id: doc.id })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    <span style={{ position: 'relative', fontSize: 16, lineHeight: 1 }}>
                      👁
                      {localTicketVis[doc.id] && localTicketVis[doc.id].size > 0 && (
                        <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: '#DC412C', borderRadius: '50%', border: '1.5px solid #fff' }} />
                      )}
                    </span>
                  </button>
                )}
                {isAdmin && <button onClick={() => deleteDoc(doc.id)} style={{ color: '#C0C0C0', fontSize: 13, minWidth: 32, minHeight: 32, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>}
              </div>
            ))}
            {isAdmin && <button onClick={() => ticketFileRef.current?.click()}
              style={{ fontSize: 14, fontWeight: 500, color: '#999', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', minHeight: 44, fontFamily: SYS }}>
              + PDF Billete
            </button>}
          </div>
        </Section>
      </div>

      {/* ── Notas ── */}
      <div style={{ padding: '0 16px' }}>
        <Section label="Notas">
          <Editable value={data.notes} placeholder="Añadir notas…" onSave={v => update('notes', v)} isAdmin={isAdmin}
            multiline style={{ fontSize: 14, color: '#1a1a1a', lineHeight: 1.5, width: '100%' }} />

          {/* Adjuntos */}
          {!loadingAttachments && noteAttachments.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {noteAttachments.map(att => (
                <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F5F5F5', borderRadius: 10, padding: '6px 10px' }}>
                  {att.file_type === 'image' ? (
                    <button onClick={() => setLightboxUrl(att.file_url)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={att.file_url} alt={att.file_name}
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                    </button>
                  ) : (
                    <a href={att.file_url} target="_blank" rel="noopener noreferrer"
                      style={{ flexShrink: 0, width: 40, height: 40, background: '#E0E0E0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                      <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
                        <path d="M2 1h9l5 5v15a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="#666" strokeWidth="1.5" fill="none"/>
                        <path d="M11 1v5h5" stroke="#666" strokeWidth="1.5"/>
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={() => att.file_type === 'image' ? setLightboxUrl(att.file_url) : window.open(att.file_url, '_blank')}
                    style={{ flex: 1, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', fontFamily: SYS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {att.file_name.length > 28 ? att.file_name.slice(0, 25) + '…' : att.file_name}
                    </span>
                  </button>
                  {isAdmin && (
                    <button onClick={() => deleteNoteAttachment(att)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0C0C0', fontSize: 14, padding: '4px', flexShrink: 0, minWidth: 28, minHeight: 28 }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {isAdmin && (
            <>
              <button onClick={() => noteAttachRef.current?.click()}
                style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: '#1a1a1a', background: '#F5F5F5', border: 'none', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', fontFamily: SYS, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {uploadingAttachment ? '…' : '+ Adjuntar'}
              </button>
              <input ref={noteAttachRef} type="file" accept="image/jpeg,image/png,image/heic,image/webp,application/pdf" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadNoteAttachment(f); e.target.value = '' }} />
            </>
          )}
        </Section>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div onClick={() => setLightboxUrl(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          <button onClick={() => setLightboxUrl(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, fontSize: 20, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}

      {/* ── Horario ── */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ borderTop: '1px solid #F0F0F0', marginBottom: 12 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', fontFamily: SYS }}>Horario</span>
          {isAdmin && <button onClick={() => setAddingSched(true)} style={addBtnStyle}>+ Añadir</button>}
        </div>

        {/* Timeline */}
        <div style={{ position: 'relative', marginBottom: 28, paddingLeft: 0 }}>
          {/* Vertical line */}
          {schedule.length > 0 && (
            <div style={{ position: 'absolute', left: 67, top: 6, bottom: 6, width: 1, background: '#E8E8E8', zIndex: 0 }} />
          )}

          {schedule.length === 0 && !addingSched && (
            <p style={{ fontSize: 15, color: '#C0C0C0', margin: 0 }}>Sin horario todavía</p>
          )}

          {visibleSchedule.map((item) => {
            const isExpanded = expandedSchedId === item.id
            const ed = getEdit(item.id, item)
            const linkedContact = contacts.find(c => c.id === item.contact_id)
            const isSchedRestricted = !!(localSchedVis[item.id] && localSchedVis[item.id].size > 0)

            return (
              <div key={item.id} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: 16 }}>
                {/* Time column */}
                <div style={{ width: 60, flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0, lineHeight: 1.2, fontFamily: SYS }}>{t5(item.time_start)}</p>
                  {item.time_end && <p style={{ fontSize: 12, color: '#999', margin: '2px 0 0 0', lineHeight: 1.2, fontFamily: SYS }}>{t5(item.time_end)}</p>}
                </div>

                {/* Dot */}
                <div style={{ width: 16, flexShrink: 0, display: 'flex', justifyContent: 'center', marginTop: 4, zIndex: 1 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSchedRestricted ? '#CCCCCC' : '#1a1a1a' }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, paddingLeft: 10 }}>
                  {!isExpanded ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                    <button onClick={() => isAdmin ? setExpandedSchedId(item.id) : undefined}
                      style={{ display: 'block', flex: 1, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: isAdmin ? 'pointer' : 'default' }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', margin: '0 0 2px 0', lineHeight: 1.3, fontFamily: SYS }}>{item.title}</p>
                      {/* Subtitle: text, contact, or location */}
                      {linkedContact && (
                        <p style={{ fontSize: 13, color: '#999', margin: '0 0 1px 0', fontFamily: SYS }}>
                          {linkedContact.name}{linkedContact.role ? ` · ${linkedContact.role}` : ''}
                          {linkedContact.phone && <> · <a href={`tel:${linkedContact.phone}`} onClick={e => e.stopPropagation()} style={{ color: '#007AFF', textDecoration: 'none' }}>{linkedContact.phone}</a></>}
                        </p>
                      )}
                      {item.location_address && (
                        <button onClick={e => { e.stopPropagation(); setSchedMapSheet(item.id) }}
                          style={{ fontSize: 13, color: '#007AFF', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SYS, textAlign: 'left' }}>
                          {item.location_address.split(',')[0]}
                        </button>
                      )}
                      {!linkedContact && !item.location_address && item.subtitle && (
                        <p style={{ fontSize: 13, color: '#999', margin: 0, fontFamily: SYS }}>{item.subtitle}</p>
                      )}
                    </button>
                    {isAdmin && (
                      <button onClick={e => { e.stopPropagation(); setVisSheet({ type: 'schedule', id: item.id }) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', flexShrink: 0 }}>
                        <span style={{ position: 'relative', fontSize: 14, lineHeight: 1 }}>
                          👁
                          {isSchedRestricted && (
                            <span style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, background: '#DC412C', borderRadius: '50%', border: '1.5px solid #fff' }} />
                          )}
                        </span>
                      </button>
                    )}
                    </div>
                  ) : (
                    /* Inline editor */
                    <div style={{ background: '#F5F5F5', borderRadius: 14, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                        <button onClick={() => deleteSched(item.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0C0C0', fontSize: 16, padding: 0, minWidth: 28, minHeight: 28 }}>✕</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <div>
                          <p style={{ fontSize: 11, color: '#999', margin: '0 0 3px 0', fontFamily: SYS }}>Inicio</p>
                          <input type="time" defaultValue={t5(item.time_start)}
                            onChange={e => setEdit(item.id, { time_start: e.target.value })}
                            style={{ ...inputStyle, fontSize: 14 }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 11, color: '#999', margin: '0 0 3px 0', fontFamily: SYS }}>Fin</p>
                          <input type="time" defaultValue={t5(item.time_end ?? '')}
                            onChange={e => setEdit(item.id, { time_end: e.target.value || null })}
                            style={{ ...inputStyle, fontSize: 14 }} />
                        </div>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <p style={{ fontSize: 11, color: '#999', margin: '0 0 3px 0', fontFamily: SYS }}>Título</p>
                        <input type="text" defaultValue={item.title}
                          onChange={e => setEdit(item.id, { title: e.target.value })}
                          style={{ ...inputStyle, fontSize: 14 }} />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <p style={{ fontSize: 11, color: '#999', margin: '0 0 3px 0', fontFamily: SYS }}>Subtítulo (texto libre)</p>
                        <input type="text" defaultValue={item.subtitle ?? ''}
                          onChange={e => setEdit(item.id, { subtitle: e.target.value || null })}
                          style={{ ...inputStyle, fontSize: 14 }} />
                      </div>
                      {/* Linked contact */}
                      {linkedContact && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 10px', background: '#fff', borderRadius: 10 }}>
                          <span style={{ fontSize: 13, flex: 1, fontFamily: SYS }}>{linkedContact.name}{linkedContact.role ? ` · ${linkedContact.role}` : ''}</span>
                          <button onClick={async () => { await saveSchedField(item.id, 'contact_id', null); setEdit(item.id, { contact_id: null }) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0C0C0', fontSize: 13 }}>✕</button>
                        </div>
                      )}
                      {/* Linked location */}
                      {item.location_address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 10px', background: '#fff', borderRadius: 10 }}>
                          <span style={{ fontSize: 13, flex: 1, color: '#007AFF', fontFamily: SYS }}>{item.location_address.split(',')[0]}</span>
                          <button onClick={async () => { await saveSchedField(item.id, 'location_address', null); await saveSchedField(item.id, 'location_lat', null); await saveSchedField(item.id, 'location_lng', null) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0C0C0', fontSize: 13 }}>✕</button>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        {!linkedContact && (
                          <button onClick={() => setSchedContactSheet(item.id)}
                            style={{ fontSize: 12, fontWeight: 600, background: '#fff', border: '1px solid #E0E0E0', borderRadius: 20, padding: '5px 12px', cursor: 'pointer', fontFamily: SYS }}>
                            + Contacto
                          </button>
                        )}
                        {!item.location_address && (
                          <button onClick={() => setSchedLocSheet(item.id)}
                            style={{ fontSize: 12, fontWeight: 600, background: '#fff', border: '1px solid #E0E0E0', borderRadius: 20, padding: '5px 12px', cursor: 'pointer', fontFamily: SYS }}>
                            + Dirección
                          </button>
                        )}
                      </div>
                      <button onClick={async () => { await saveSchedEdit(item.id, item); setExpandedSchedId(null) }}
                        style={{ width: '100%', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 20, height: 40, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SYS }}>
                        Listo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

        </div>

        {/* Add form — outside timeline so the vertical line doesn't cross it */}
        {addingSched && (
          <form onSubmit={saveSched} style={{ background: '#F5F5F5', borderRadius: 16, padding: 16, margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 12, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
            {/* Row 1 — Inicio / Fin */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(120px, 1fr)', gap: 12, width: '100%', boxSizing: 'border-box' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', margin: '0 0 6px 0', fontFamily: SYS }}>Inicio</p>
                <input type="time" value={newSched.time_start} onChange={e => setNewSched(s => ({ ...s, time_start: e.target.value }))} required
                  style={{ height: 44, width: '100%', background: '#fff', border: '0.5px solid #E0E0E0', borderRadius: 10, padding: '0 10px', fontSize: 16, fontFamily: SYS, outline: 'none', boxSizing: 'border-box', WebkitAppearance: 'none' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', margin: '0 0 6px 0', fontFamily: SYS }}>Fin</p>
                <input type="time" value={newSched.time_end} onChange={e => setNewSched(s => ({ ...s, time_end: e.target.value }))}
                  style={{ height: 44, width: '100%', background: '#fff', border: '0.5px solid #E0E0E0', borderRadius: 10, padding: '0 10px', fontSize: 16, fontFamily: SYS, outline: 'none', boxSizing: 'border-box', WebkitAppearance: 'none' }} />
              </div>
            </div>
            {/* Row 2 — Título */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', margin: '0 0 6px 0', fontFamily: SYS }}>Título</p>
              <input type="text" placeholder="Ej: Llegada y montaje" value={newSched.title} onChange={e => setNewSched(s => ({ ...s, title: e.target.value }))} required
                style={{ height: 44, width: '100%', background: '#fff', border: '0.5px solid #E0E0E0', borderRadius: 10, padding: '0 12px', fontSize: 16, fontFamily: SYS, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {/* Row 3 — Subtítulo */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', margin: '0 0 6px 0', fontFamily: SYS }}>Subtítulo</p>
              <input type="text" placeholder="Nota o detalle opcional" value={newSched.subtitle} onChange={e => setNewSched(s => ({ ...s, subtitle: e.target.value }))}
                style={{ height: 44, width: '100%', background: '#fff', border: '0.5px solid #E0E0E0', borderRadius: 10, padding: '0 12px', fontSize: 16, fontFamily: SYS, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {/* Selected contact / address preview */}
            {newSched.contact_id && (() => { const c = contacts.find(x => x.id === newSched.contact_id); return c ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#1a1a1a', fontFamily: SYS }}>👤 {c.name}{c.role ? ` · ${c.role}` : ''}</span>
                <button type="button" onClick={() => setNewSched(s => ({ ...s, contact_id: null }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0C0C0', fontSize: 13, padding: 0 }}>✕</button>
              </div>
            ) : null })()}
            {newSched.location_address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#007AFF', fontFamily: SYS }}>📍 {newSched.location_address.split(',')[0]}</span>
                <button type="button" onClick={() => setNewSched(s => ({ ...s, location_address: null, location_lat: null, location_lng: null }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0C0C0', fontSize: 13, padding: 0 }}>✕</button>
              </div>
            )}
            {/* Row 4 — Botones + Contacto / Dirección */}
            {!newSched.contact_id && !newSched.location_address && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setNewSchedPanel(p => p === 'contact' ? 'none' : 'contact')}
                  style={{ flex: 1, height: 36, background: newSchedPanel === 'contact' ? '#E8E8E8' : '#fff', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS }}>
                  + Contacto
                </button>
                <button type="button" onClick={() => setNewSchedPanel(p => p === 'address' ? 'none' : 'address')}
                  style={{ flex: 1, height: 36, background: newSchedPanel === 'address' ? '#E8E8E8' : '#fff', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS }}>
                  + Dirección
                </button>
              </div>
            )}
            {/* Inline contact picker */}
            {newSchedPanel === 'contact' && (
              <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '0.5px solid #E8E8E8' }}>
                {contacts.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#C0C0C0', margin: 0, padding: '12px 14px', fontFamily: SYS }}>Sin contactos en este concierto</p>
                ) : contacts.map((c, i) => (
                  <button key={c.id} type="button"
                    onClick={() => { setNewSched(s => ({ ...s, contact_id: c.id })); setNewSchedPanel('none') }}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', borderBottom: i < contacts.length - 1 ? '0.5px solid #F0F0F0' : 'none', cursor: 'pointer', fontFamily: SYS, minHeight: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{c.name}</span>
                    {c.role && <span style={{ fontSize: 12, color: '#999' }}>{c.role}</span>}
                  </button>
                ))}
              </div>
            )}
            {/* Inline address search */}
            {newSchedPanel === 'address' && (
              <div>
                <input autoFocus type="text" placeholder="Buscar dirección..."
                  value={newSchedAddrQuery}
                  onChange={e => {
                    const q = e.target.value; setNewSchedAddrQuery(q)
                    if (newSchedAddrTimer.current) clearTimeout(newSchedAddrTimer.current)
                    if (q.length < 3) { setNewSchedAddrResults([]); return }
                    newSchedAddrTimer.current = setTimeout(async () => {
                      try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`, { headers: { 'Accept-Language': 'es', 'User-Agent': 'TourPilot/1.0' } })
                        setNewSchedAddrResults(await res.json())
                      } catch { setNewSchedAddrResults([]) }
                    }, 400)
                  }}
                  style={{ width: '100%', height: 44, background: '#fff', border: '0.5px solid #E0E0E0', borderRadius: 10, padding: '0 12px', fontSize: 16, fontFamily: SYS, outline: 'none', boxSizing: 'border-box', marginBottom: newSchedAddrResults.length ? 6 : 0 }} />
                {newSchedAddrResults.length > 0 && (
                  <div style={{ background: '#fff', border: '0.5px solid #E0E0E0', borderRadius: 10, overflow: 'hidden' }}>
                    {newSchedAddrResults.map((r, i) => (
                      <button key={i} type="button"
                        onClick={() => { setNewSched(s => ({ ...s, location_address: r.display_name, location_lat: parseFloat(r.lat), location_lng: parseFloat(r.lon) })); setNewSchedPanel('none'); setNewSchedAddrQuery(''); setNewSchedAddrResults([]) }}
                        style={{ width: '100%', textAlign: 'left', padding: '0 12px', background: 'none', border: 'none', borderBottom: i < newSchedAddrResults.length - 1 ? '0.5px solid #F0F0F0' : 'none', cursor: 'pointer', fontFamily: SYS, height: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display_name.split(',')[0]}</p>
                        <p style={{ fontSize: 11, color: '#999', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display_name.split(',').slice(1, 4).join(',').trim()}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Row 5 — Cancelar / Guardar */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button type="button" onClick={() => { setAddingSched(false); setNewSched({ time_start: '', time_end: '', title: '', subtitle: '', contact_id: null, location_address: null, location_lat: null, location_lng: null }); setNewSchedPanel('none'); setNewSchedAddrQuery(''); setNewSchedAddrResults([]) }}
                style={{ flex: 1, height: 44, background: 'none', border: 'none', fontSize: 15, color: '#999', cursor: 'pointer', fontFamily: SYS }}>
                Cancelar
              </button>
              <button type="submit"
                style={{ flex: 2, height: 44, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 20, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: SYS }}>
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Hotel ── */}
      {(data.hotel_name || isAdmin) && (
        <div style={{ padding: '0 16px' }}>
          <Section label="Hotel">
            {data.hotel_name ? (
              <>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 2px 0', fontFamily: SYS }}>{data.hotel_name}</p>
                {data.hotel_address && (
                  <p style={{ fontSize: 12, color: '#999', margin: '0 0 8px 0', fontFamily: SYS, lineHeight: 1.4 }}>{data.hotel_address}</p>
                )}
                {isAdmin && (
                  <button onClick={() => setSheetHotel(true)}
                    style={{ display: 'block', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: 12, fontFamily: SYS, fontSize: 12, color: 'rgba(26,26,26,0.45)' }}>
                    Editar hotel
                  </button>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setSheetHotelDir(true)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, background: '#F5F5F5', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS }}>
                    <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
                      <path d="M5.5 1C3.29 1 1.5 2.79 1.5 5c0 2.8 4 7 4 7s4-4.2 4-7c0-2.21-1.79-4-4-4z" stroke="#1a1a1a" strokeWidth="1.3" fill="none"/>
                      <circle cx="5.5" cy="5" r="1.3" stroke="#1a1a1a" strokeWidth="1.3"/>
                    </svg>
                    Direcciones
                  </button>
                  {data.hotel_phone ? (
                    <a href={`tel:${data.hotel_phone}`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, background: '#F5F5F5', borderRadius: 20, fontSize: 13, fontWeight: 600, color: '#1a1a1a', textDecoration: 'none', fontFamily: SYS }}>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 1h3l1 3-1.5 1.5a8 8 0 003 3L9 7l3 1v3a1 1 0 01-1 1C5 12 1 8 1 2a1 1 0 011-1z" stroke="#1a1a1a" strokeWidth="1.3" fill="none"/>
                      </svg>
                      Llamar
                    </a>
                  ) : (
                    <button disabled title="Sin teléfono"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, background: '#F5F5F5', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 600, color: '#C0C0C0', cursor: 'not-allowed', fontFamily: SYS }}>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 1h3l1 3-1.5 1.5a8 8 0 003 3L9 7l3 1v3a1 1 0 01-1 1C5 12 1 8 1 2a1 1 0 011-1z" stroke="#C0C0C0" strokeWidth="1.3" fill="none"/>
                      </svg>
                      Llamar
                    </button>
                  )}
                </div>
              </>
            ) : isAdmin ? (
              <button onClick={() => setSheetHotel(true)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SYS, fontSize: 15, color: '#C0C0C0' }}>
                + Añadir hotel
              </button>
            ) : null}
          </Section>
        </div>
      )}

      {/* ── Setlist ── */}
      <div style={{ padding: '0 16px' }}>
        <Section label="Setlist">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {setlistDocs.length === 0 && !isAdmin && <p style={{ fontSize: 14, color: '#C0C0C0', margin: 0 }}>—</p>}
            {setlistDocs.map(doc => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <a href={doc.url ? normalizeUrl(doc.url) : '#'} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 500, color: '#007AFF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: SYS, textDecoration: 'none' }}>{doc.label || 'Setlist'}</a>
                {isAdmin && <button onClick={() => deleteDoc(doc.id)} style={{ color: '#C0C0C0', fontSize: 13, minWidth: 32, minHeight: 32, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>}
              </div>
            ))}
            {isAdmin && <button onClick={() => setlistFileRef.current?.click()} style={{ fontSize: 14, fontWeight: 500, color: '#999', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', minHeight: 44, fontFamily: SYS }}>{uploading ? '…' : 'Añadir PDF Setlist'}</button>}
          </div>
        </Section>
      </div>

      {/* File inputs */}
      <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(f); e.target.value = '' }} />
      <input ref={ticketFileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadOther('ticket', f); e.target.value = '' }} />
      <input ref={setlistFileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadOther('setlist', f); e.target.value = '' }} />

      {/* ── Bottom sheet: Direcciones ── */}
      <BottomSheet open={sheetDir} onClose={() => setSheetDir(false)}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#999', margin: '0 0 16px 0', fontFamily: SYS }}>Abrir con...</p>
        <div style={{ background: '#F5F5F5', borderRadius: 14, overflow: 'hidden' }}>
          <a href={venueAppleMaps} style={{ ...sheetBtnStyle, textDecoration: 'none' }}>Apple Maps</a>
          <a href={venueGoogleMaps} target="_blank" rel="noopener noreferrer" style={{ ...sheetBtnStyle, textDecoration: 'none' }}>Google Maps</a>
          <a href={venueWaze} target="_blank" rel="noopener noreferrer" style={{ ...sheetBtnStyle, borderBottom: 'none', textDecoration: 'none' }}>Waze</a>
        </div>
        <button onClick={() => setSheetDir(false)} style={cancelBtnStyle}>Cancelar</button>
      </BottomSheet>

      {/* ── Bottom sheet: Contactos ── */}
      <ContactsSheet
        open={sheetContacts}
        onClose={() => setSheetContacts(false)}
        contacts={contacts}
        isAdmin={isAdmin}
        showId={data.id}
        onAdd={c => setContacts(prev => [...prev, c])}
        onDelete={id => setContacts(prev => prev.filter(c => c.id !== id))}
      />

      {/* ── Info bar sheets ── */}
      <BottomSheet open={infoSheet === 'show'} onClose={() => { setInfoSheet(null); setShowFormError(null) }}>
        <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 18px 0', fontFamily: SYS }}>Show</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, color: '#999', margin: '0 0 4px 0', fontFamily: SYS, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hora</p>
            <input type="time" value={showForm.time} onChange={e => setShowForm(f => ({ ...f, time: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#999', margin: '0 0 4px 0', fontFamily: SYS, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Duración (minutos)</p>
            <input
              type="number" inputMode="numeric" pattern="[0-9]*"
              min="0" max="300" placeholder="60"
              value={showForm.duration}
              onChange={e => { setShowForm(f => ({ ...f, duration: e.target.value })); setShowFormError(null) }}
              style={inputStyle}
            />
            {showFormError && <p style={{ fontSize: 12, color: '#DC412C', margin: '4px 0 0 0', fontFamily: SYS }}>{showFormError}</p>}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => { setInfoSheet(null); setShowFormError(null) }} style={cancelFlexStyle}>Cancelar</button>
            <button onClick={async () => {
              const dur = showForm.duration.trim()
              if (dur !== '' && (!/^\d+$/.test(dur) || parseInt(dur) < 0)) { setShowFormError('Introduce un número válido'); return }
              await update('show_time', showForm.time || null)
              await update('show_duration', dur ? parseInt(dur) : null)
              setInfoSheet(null); setShowFormError(null)
            }} style={{ flex: 1, height: 52, background: '#1a1a1a', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: SYS }}>
              Guardar
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={infoSheet === 'sc'} onClose={() => { setInfoSheet(null); setScFormError(null) }}>
        <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 18px 0', fontFamily: SYS }}>{checkType === 'linecheck' ? 'Linecheck' : 'Soundcheck'}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, color: '#999', margin: '0 0 4px 0', fontFamily: SYS, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hora</p>
            <input type="time" value={scForm.time} onChange={e => setScForm(f => ({ ...f, time: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#999', margin: '0 0 4px 0', fontFamily: SYS, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Duración (minutos)</p>
            <input
              type="number" inputMode="numeric" pattern="[0-9]*"
              min="0" max="180" placeholder="30"
              value={scForm.duration}
              onChange={e => { setScForm(f => ({ ...f, duration: e.target.value })); setScFormError(null) }}
              style={inputStyle}
            />
            {scFormError && <p style={{ fontSize: 12, color: '#DC412C', margin: '4px 0 0 0', fontFamily: SYS }}>{scFormError}</p>}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => { setInfoSheet(null); setScFormError(null) }} style={cancelFlexStyle}>Cancelar</button>
            <button onClick={async () => {
              const dur = scForm.duration.trim()
              if (dur !== '' && (!/^\d+$/.test(dur) || parseInt(dur) < 0)) { setScFormError('Introduce un número válido'); return }
              await update('soundcheck_time', scForm.time || null)
              await update('soundcheck_duration', dur ? parseInt(dur) : null)
              setInfoSheet(null); setScFormError(null)
            }} style={{ flex: 1, height: 52, background: '#1a1a1a', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: SYS }}>
              Guardar
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={infoSheet === 'aforo'} onClose={() => setInfoSheet(null)}>
        <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 18px 0', fontFamily: SYS }}>Aforo</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, color: '#999', margin: '0 0 4px 0', fontFamily: SYS, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Capacidad</p>
            <input type="number" min="0" value={aforoForm.capacity} onChange={e => setAforoForm({ capacity: e.target.value })} placeholder="—" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => setInfoSheet(null)} style={cancelFlexStyle}>Cancelar</button>
            <button onClick={async () => { await update('capacity', parseInt(aforoForm.capacity) || null); setInfoSheet(null) }}
              style={{ flex: 1, height: 52, background: '#1a1a1a', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: SYS }}>
              Guardar
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={infoSheet === 'pantalla'} onClose={() => setInfoSheet(null)}>
        <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 18px 0', fontFamily: SYS }}>Pantalla</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setPantallaForm(f => ({ ...f, has_screen: !f.has_screen }))}
              style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: pantallaForm.has_screen ? '#1a1a1a' : '#D0D0D0', position: 'relative', flexShrink: 0, transition: 'background 0.25s' }}>
              <span style={{ position: 'absolute', top: 3, width: 18, height: 18, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', left: pantallaForm.has_screen ? 23 : 3, transition: 'left 0.25s' }} />
            </button>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', fontFamily: SYS }}>{pantallaForm.has_screen ? 'SÍ' : 'NO'}</span>
          </div>
          {pantallaForm.has_screen && (
            <div>
              <p style={{ fontSize: 11, color: '#999', margin: '0 0 4px 0', fontFamily: SYS, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Resolución</p>
              <input type="text" value={pantallaForm.resolution} onChange={e => setPantallaForm(f => ({ ...f, resolution: e.target.value }))} placeholder="1920×1080" style={inputStyle} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => setInfoSheet(null)} style={cancelFlexStyle}>Cancelar</button>
            <button onClick={async () => { await update('has_screen', pantallaForm.has_screen); await update('screen_resolution', pantallaForm.has_screen ? (pantallaForm.resolution || null) : null); setInfoSheet(null) }}
              style={{ flex: 1, height: 52, background: '#1a1a1a', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: SYS }}>
              Guardar
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* ── Check type picker ── */}
      <BottomSheet open={pickingCheck} onClose={() => setPickingCheck(false)}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#999', margin: '0 0 16px 0', fontFamily: SYS }}>Tipo de prueba</p>
        <div style={{ background: '#F5F5F5', borderRadius: 14, overflow: 'hidden' }}>
          {(['soundcheck', 'linecheck'] as const).map((opt, i) => (
            <button key={opt} onClick={async () => { await update('check_type', opt); setPickingCheck(false) }}
              style={{ ...sheetBtnStyle, borderBottom: i === 0 ? '0.5px solid #E8E8E8' : 'none', fontWeight: checkType === opt ? 700 : 500, justifyContent: 'space-between' }}>
              <span>{opt === 'soundcheck' ? 'Soundcheck' : 'Linecheck'}</span>
              {checkType === opt && <span style={{ fontSize: 16 }}>✓</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setPickingCheck(false)} style={cancelBtnStyle}>Cancelar</button>
      </BottomSheet>

      {/* ── Venue address sheet (admin only) ── */}
      {isAdmin && (
        <VenueAddressSheet open={sheetAddress} onClose={() => setSheetAddress(false)}
          onSave={async (address, lat, lng) => {
            await update('venue_address', address)
            await update('venue_lat', lat)
            await update('venue_lng', lng)
          }}
        />
      )}

      {/* ── Hotel edit sheet (admin only) ── */}
      {isAdmin && <HotelEditSheet open={sheetHotel} onClose={() => setSheetHotel(false)}
        initialName={data.hotel_name ?? ''} initialPhone={data.hotel_phone ?? ''}
        onSave={async ({ name, address, lat, lng, phone }) => {
          setSheetHotel(false)
          if (name) await update('hotel_name', name)
          if (address) await update('hotel_address', address)
          if (lat != null) await update('hotel_lat', lat)
          if (lng != null) await update('hotel_lng', lng)
          await update('hotel_phone', phone || null)
        }}
      />}

      {/* ── Hotel directions sheet ── */}
      <BottomSheet open={sheetHotelDir} onClose={() => setSheetHotelDir(false)}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#999', margin: '0 0 16px 0', fontFamily: SYS }}>Abrir con...</p>
        <div style={{ background: '#F5F5F5', borderRadius: 14, overflow: 'hidden' }}>
          {hotelAppleMaps && <a href={hotelAppleMaps} style={{ ...sheetBtnStyle, textDecoration: 'none' }}>Apple Maps</a>}
          {hotelGoogleMaps && <a href={hotelGoogleMaps} target="_blank" rel="noopener noreferrer" style={{ ...sheetBtnStyle, textDecoration: 'none' }}>Google Maps</a>}
          {hotelWaze && <a href={hotelWaze} target="_blank" rel="noopener noreferrer" style={{ ...sheetBtnStyle, borderBottom: 'none', textDecoration: 'none' }}>Waze</a>}
        </div>
        <button onClick={() => setSheetHotelDir(false)} style={cancelBtnStyle}>Cancelar</button>
      </BottomSheet>

      {/* ── Schedule location sheet ── */}
      {schedLocSheet && (
        <SchedLocationSheet
          open={!!schedLocSheet}
          onClose={() => setSchedLocSheet(null)}
          onSave={async (address, lat, lng) => {
            await saveSchedField(schedLocSheet, 'location_address', address)
            await saveSchedField(schedLocSheet, 'location_lat', lat)
            await saveSchedField(schedLocSheet, 'location_lng', lng)
            setSchedLocSheet(null)
          }}
        />
      )}

      {/* ── Schedule location map sheet (read view tap) ── */}
      {schedMapSheet && (() => {
        const item = schedule.find(x => x.id === schedMapSheet)
        if (!item?.location_address) return null
        const geoQ = item.location_lat ? `${item.location_lat},${item.location_lng}` : encodeURIComponent(item.location_address)
        return (
          <BottomSheet open={true} onClose={() => setSchedMapSheet(null)}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#999', margin: '0 0 16px 0', fontFamily: SYS }}>Abrir con...</p>
            <div style={{ background: '#F5F5F5', borderRadius: 14, overflow: 'hidden' }}>
              <a href={`maps://maps.apple.com/?q=${geoQ}`} style={{ ...sheetBtnStyle, textDecoration: 'none' }}>Apple Maps</a>
              <a href={`https://maps.google.com/?q=${geoQ}`} target="_blank" rel="noopener noreferrer" style={{ ...sheetBtnStyle, textDecoration: 'none' }}>Google Maps</a>
              <a href={item.location_lat ? `https://waze.com/ul?ll=${item.location_lat},${item.location_lng}&navigate=yes` : `https://waze.com/ul?q=${encodeURIComponent(item.location_address)}`} target="_blank" rel="noopener noreferrer" style={{ ...sheetBtnStyle, borderBottom: 'none', textDecoration: 'none' }}>Waze</a>
            </div>
            <button onClick={() => setSchedMapSheet(null)} style={cancelBtnStyle}>Cancelar</button>
          </BottomSheet>
        )
      })()}

      {/* ── Schedule contact picker ── */}
      {schedContactSheet && (
        <BottomSheet open={true} onClose={() => setSchedContactSheet(null)}>
          <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px 0', fontFamily: SYS }}>Vincular contacto</p>
          {contacts.length === 0
            ? <p style={{ fontSize: 15, color: '#C0C0C0', margin: '0 0 16px 0', fontFamily: SYS }}>Sin contactos en este show</p>
            : (
              <div style={{ background: '#F5F5F5', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
                {contacts.map((c, i) => (
                  <button key={c.id} onClick={async () => {
                    await saveSchedField(schedContactSheet, 'contact_id', c.id)
                    setSchedule(s => s.map(x => x.id === schedContactSheet ? { ...x, contact_id: c.id } : x))
                    setSchedContactSheet(null)
                  }}
                    style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', borderBottom: i < contacts.length - 1 ? '0.5px solid #F0F0F0' : 'none', cursor: 'pointer', minHeight: 48, fontFamily: SYS }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', margin: '0 0 1px 0' }}>{c.name}</p>
                    {c.role && <p style={{ fontSize: 13, color: '#999', margin: 0 }}>{c.role}</p>}
                  </button>
                ))}
              </div>
            )}
          <button onClick={() => setSchedContactSheet(null)} style={cancelBtnStyle}>Cancelar</button>
        </BottomSheet>
      )}

      {/* ── Visibility sheet ── */}
      {isAdmin && visSheet && (
        <BottomSheet open={true} onClose={() => setVisSheet(null)}>
          <VisibilitySheetContent
            itemId={visSheet.id}
            itemType={visSheet.type}
            members={tourMembers}
            localVis={visSheet.type === 'ticket' ? localTicketVis : localSchedVis}
            supabase={supabase}
            onClose={() => setVisSheet(null)}
            onSave={(id, newSet) => {
              if (visSheet.type === 'ticket') {
                setLocalTicketVis(prev => {
                  const next = { ...prev }
                  if (newSet.size === 0) delete next[id]
                  else next[id] = newSet
                  return next
                })
              } else {
                setLocalSchedVis(prev => {
                  const next = { ...prev }
                  if (newSet.size === 0) delete next[id]
                  else next[id] = newSet
                  return next
                })
              }
              setVisSheet(null)
            }}
          />
        </BottomSheet>
      )}

      {/* Suppress unused warning */}
      <span style={{ display: 'none' }}>{uploadType}</span>

      {/* ── Eliminar concierto ── */}
      {isAdmin && (
        <div style={{ padding: '0 20px 32px' }}>
          <div style={{ height: 1, background: '#F0F0F0', marginBottom: 16 }} />
          {confirmDeleteShow ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <p style={{ fontSize: 14, color: '#1a1a1a', margin: 0, fontFamily: SYS, textAlign: 'center', lineHeight: 1.5 }}>
                ¿Eliminar este concierto?<br/>Se perderán todos los datos asociados.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setConfirmDeleteShow(false)}
                  style={{ fontSize: 14, color: '#999', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS, padding: '8px 16px' }}>
                  Cancelar
                </button>
                <button onClick={handleDeleteShow}
                  style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: '#DC412C', border: 'none', borderRadius: 20, cursor: 'pointer', fontFamily: SYS, padding: '8px 20px' }}>
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmDeleteShow(true)}
              style={{ width: '100%', fontSize: 14, color: '#DC412C', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS, padding: '8px 0', textAlign: 'center' }}>
              Eliminar concierto
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Visibility sheet content ────────────────────────────────────────────────

function CheckBox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? '#1a1a1a' : '#D0D0D0'}`, background: checked ? '#1a1a1a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {checked && <span style={{ color: '#fff', fontSize: 13, lineHeight: 1 }}>✓</span>}
      </div>
    </button>
  )
}

function VisibilitySheetContent({
  itemId, itemType, members, localVis, supabase, onClose, onSave
}: {
  itemId: string
  itemType: 'ticket' | 'schedule'
  members: TourMember[]
  localVis: Record<string, Set<string>>
  supabase: ReturnType<typeof createClient>
  onClose: () => void
  onSave: (id: string, newSet: Set<string>) => void
}) {
  const allMemberIds = members.map(m => m.user_id)
  const band = members.filter(m => m.role === 'band')
  const artists = members.filter(m => m.role === 'artist')
  const crew = members.filter(m => m.role === 'crew')
  const restricted = localVis[itemId]

  const [checked, setChecked] = useState<Set<string>>(() => {
    if (!restricted || restricted.size === 0) return new Set(allMemberIds)
    return new Set(restricted)
  })
  const [individualOpen, setIndividualOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const isEveryoneChecked = allMemberIds.length === 0 || allMemberIds.every(id => checked.has(id))

  const allBandChecked = band.length > 0 && band.every(m => checked.has(m.user_id))
  const allArtistsChecked = artists.length > 0 && artists.every(m => checked.has(m.user_id))
  const allCrewChecked = crew.length > 0 && crew.every(m => checked.has(m.user_id))

  function toggleGroup(groupMembers: TourMember[], allChecked: boolean) {
    setChecked(prev => {
      const next = new Set(prev)
      if (allChecked) groupMembers.forEach(m => next.delete(m.user_id))
      else groupMembers.forEach(m => next.add(m.user_id))
      return next
    })
  }

  function toggleIndividual(uid: string) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }

  async function save() {
    setSaving(true)
    const table = itemType === 'ticket' ? 'ticket_visibility' : 'schedule_visibility'
    const col = itemType === 'ticket' ? 'document_id' : 'schedule_item_id'
    await supabase.from(table).delete().eq(col, itemId)
    if (!isEveryoneChecked && checked.size > 0) {
      const inserts = [...checked].map(uid => ({ [col]: itemId, user_id: uid }))
      await supabase.from(table).insert(inserts)
    }
    setSaving(false)
    onSave(itemId, isEveryoneChecked ? new Set() : new Set(checked))
  }

  const roleColors: Record<string, string> = { admin: '#1a1a1a', band: '#DC412C', artist: '#B090F5', crew: '#A99F49' }
  const roleLabel: Record<string, string> = { admin: 'Admin', band: 'Banda', artist: 'Artista', crew: 'Crew' }

  return (
    <div>
      <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 4px 0', fontFamily: SYS }}>Visibilidad</p>
      <p style={{ fontSize: 13, color: '#999', margin: '0 0 20px 0', fontFamily: SYS }}>
        Elige quién puede ver este elemento.
      </p>

      {/* GRUPOS */}
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', margin: '0 0 12px 0', fontFamily: SYS }}>Grupos</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#F5F5F5', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
        {band.length > 0 && (
          <button
            onClick={() => toggleGroup(band, allBandChecked)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', borderBottom: (artists.length > 0 || crew.length > 0) ? '0.5px solid #E8E8E8' : 'none', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC412C', flexShrink: 0 }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', fontFamily: SYS }}>Toda la banda</span>
              <span style={{ fontSize: 12, color: '#999', fontFamily: SYS }}>({band.length})</span>
            </div>
            <CheckBox checked={allBandChecked} onChange={() => toggleGroup(band, allBandChecked)} />
          </button>
        )}
        {artists.length > 0 && (
          <button
            onClick={() => toggleGroup(artists, allArtistsChecked)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', borderBottom: crew.length > 0 ? '0.5px solid #E8E8E8' : 'none', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#B090F5', flexShrink: 0 }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', fontFamily: SYS }}>Todos los artistas</span>
              <span style={{ fontSize: 12, color: '#999', fontFamily: SYS }}>({artists.length})</span>
            </div>
            <CheckBox checked={allArtistsChecked} onChange={() => toggleGroup(artists, allArtistsChecked)} />
          </button>
        )}
        {crew.length > 0 && (
          <button
            onClick={() => toggleGroup(crew, allCrewChecked)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#A99F49', flexShrink: 0 }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', fontFamily: SYS }}>Todo el crew</span>
              <span style={{ fontSize: 12, color: '#999', fontFamily: SYS }}>({crew.length})</span>
            </div>
            <CheckBox checked={allCrewChecked} onChange={() => toggleGroup(crew, allCrewChecked)} />
          </button>
        )}
        {band.length === 0 && artists.length === 0 && crew.length === 0 && (
          <p style={{ fontSize: 14, color: '#C0C0C0', margin: 0, padding: '14px 16px', fontFamily: SYS }}>Sin miembros asignados</p>
        )}
      </div>

      {/* INDIVIDUAL — colapsable */}
      <button
        onClick={() => setIndividualOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px 0', textAlign: 'left' }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', margin: 0, fontFamily: SYS }}>Individual</p>
        <span style={{ fontSize: 13, color: '#999', transform: individualOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'block' }}>▾</span>
      </button>

      {individualOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {members.map(member => {
            const name = member.profiles?.full_name ?? member.profiles?.username ?? 'Usuario'
            const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
            const roleColor = roleColors[member.role] ?? '#999'
            const isChecked = checked.has(member.user_id)
            return (
              <button
                key={member.id}
                onClick={() => toggleIndividual(member.user_id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: roleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: SYS }}>{initials}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: '0 0 1px 0', fontFamily: SYS }}>{name}</p>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: roleColor, borderRadius: 20, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: SYS }}>
                    {roleLabel[member.role] ?? member.role}
                  </span>
                </div>
                <CheckBox checked={isChecked} onChange={() => toggleIndividual(member.user_id)} />
              </button>
            )
          })}
          {members.length === 0 && (
            <p style={{ fontSize: 14, color: '#C0C0C0', margin: 0, fontFamily: SYS }}>Sin miembros</p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: individualOpen ? 0 : 8 }}>
        <button onClick={onClose} style={{ flex: 1, height: 52, background: '#F5F5F5', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 500, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS }}>
          Cancelar
        </button>
        <button onClick={save} disabled={saving} style={{ flex: 1, height: 52, background: '#1a1a1a', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: SYS, opacity: saving ? 0.6 : 1 }}>
          {saving ? '…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
