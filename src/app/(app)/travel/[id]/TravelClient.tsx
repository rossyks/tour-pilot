'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TravelDay, TravelScheduleItem, TravelDocument, TOUR_COLORS } from '@/lib/types'

const SYS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"

function fmt(d: string) {
  const date = new Date(d + 'T00:00:00')
  const day = date.getDate().toString().padStart(2, '0')
  const month = date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '')
  return `${day} ${month}`
}
function t5(t: string | null) { return t ? t.slice(0, 5) : '' }

function Section({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ borderTop: '1px solid #F0F0F0', marginBottom: 16 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#999', fontFamily: SYS }}>{label}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

// ─── Destination inline edit ──────────────────────────────────────────────────
function DestinationEdit({ value, isAdmin, onSave }: {
  value: string | null; isAdmin: boolean; onSave: (v: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true); await onSave(val); setSaving(false); setEditing(false)
  }

  if (editing) return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
      <input autoFocus value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save()}
        placeholder="Destino…"
        style={{ background: 'rgba(255,255,255,0.4)', border: 'none', borderBottom: '2px solid rgba(0,0,0,0.4)', outline: 'none', flex: 1, fontSize: 14, fontStyle: 'italic', fontFamily: SYS, padding: '2px 0', color: '#1a1a1a' }} />
      <button onClick={save} disabled={saving}
        style={{ fontSize: 12, fontWeight: 700, background: 'rgba(0,0,0,0.2)', color: '#1a1a1a', padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: SYS }}>
        {saving ? '…' : '✓'}
      </button>
    </div>
  )

  return isAdmin ? (
    <button onClick={() => setEditing(true)}
      style={{ background: 'none', border: 'none', cursor: 'text', padding: 0, textAlign: 'left', fontFamily: SYS }}>
      <span style={{ fontSize: 14, fontStyle: 'italic', color: 'rgba(26,26,26,0.7)' }}>
        {value || <span style={{ color: 'rgba(26,26,26,0.35)' }}>Destino</span>}
      </span>
    </button>
  ) : (
    <span style={{ fontSize: 14, fontStyle: 'italic', color: 'rgba(26,26,26,0.7)', fontFamily: SYS }}>
      {value ?? ''}
    </span>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TravelClient({
  travelDay: initialTD,
  showColor,
  tourId,
  scheduleItems: initialSchedule,
  documents: initialDocs,
  isAdmin,
}: {
  travelDay: TravelDay
  showColor: string | null
  tourId: string | null
  scheduleItems: TravelScheduleItem[]
  documents: TravelDocument[]
  isAdmin: boolean
}) {
  const supabase = createClient()
  const router = useRouter()
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const [td, setTd] = useState(initialTD)
  const [schedule, setSchedule] = useState<TravelScheduleItem[]>(
    [...initialSchedule].sort((a, b) => a.time_start.localeCompare(b.time_start))
  )
  const [docs, setDocs] = useState<TravelDocument[]>(initialDocs)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingMap, setEditingMap] = useState<Record<string, Partial<TravelScheduleItem>>>({})
  const [addingSched, setAddingSched] = useState(false)
  const [newSched, setNewSched] = useState({ time_start: '', time_end: '', title: '', subtitle: '' })

  const [addingLink, setAddingLink] = useState(false)
  const [newLink, setNewLink] = useState({ label: '', url: '' })
  const [uploading, setUploading] = useState(false)
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)

  const color = showColor ?? TOUR_COLORS[0]

  async function handleDeleteTravel() {
    await supabase.from('travel_days').delete().eq('id', td.id)
    router.push(tourId ? `/tours/${tourId}` : '/dashboard')
  }

  async function updateDestination(destination: string) {
    const v = destination.trim() || null
    await supabase.from('travel_days').update({ destination: v }).eq('id', td.id)
    setTd(t => ({ ...t, destination: v }))
  }

  // ── Schedule ──────────────────────────────────────────────────────────────────

  function getEdit(id: string, item: TravelScheduleItem): Partial<TravelScheduleItem> {
    return editingMap[id] ?? item
  }
  function setEdit(id: string, patch: Partial<TravelScheduleItem>) {
    setEditingMap(m => ({ ...m, [id]: { ...(m[id] ?? {}), ...patch } }))
  }

  async function saveSched(e: React.FormEvent) {
    e.preventDefault()
    if (!newSched.time_start || !newSched.title) return
    const { data: row } = await supabase.from('travel_schedule_items').insert({
      travel_day_id: td.id,
      time_start: newSched.time_start,
      time_end: newSched.time_end || null,
      title: newSched.title,
      subtitle: newSched.subtitle || null,
      order_index: schedule.length,
    }).select().single()
    if (row) setSchedule(s => [...s, row].sort((a, b) => a.time_start.localeCompare(b.time_start)))
    setAddingSched(false)
    setNewSched({ time_start: '', time_end: '', title: '', subtitle: '' })
  }

  async function saveEdit(id: string) {
    const edits = editingMap[id] ?? {}
    if (!Object.keys(edits).length) { setExpandedId(null); return }
    await supabase.from('travel_schedule_items').update(edits).eq('id', id)
    setSchedule(s => s.map(x => x.id === id ? { ...x, ...edits } : x).sort((a, b) => a.time_start.localeCompare(b.time_start)))
    setExpandedId(null)
  }

  async function deleteSched(id: string) {
    await supabase.from('travel_schedule_items').delete().eq('id', id)
    setSchedule(s => s.filter(x => x.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  // ── Documents ─────────────────────────────────────────────────────────────────

  async function uploadPdf(file: File) {
    setUploading(true)
    const path = `travel/${td.id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
      const { data: row } = await supabase.from('travel_documents').insert({
        travel_day_id: td.id, label: file.name.replace(/\.pdf$/i, ''), url: publicUrl, file_type: 'pdf',
      }).select().single()
      if (row) setDocs(d => [...d, row])
    }
    setUploading(false)
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault()
    if (!newLink.url) return
    const { data: row } = await supabase.from('travel_documents').insert({
      travel_day_id: td.id, label: newLink.label || newLink.url, url: newLink.url, file_type: 'link',
    }).select().single()
    if (row) setDocs(d => [...d, row])
    setAddingLink(false); setNewLink({ label: '', url: '' })
  }

  async function deleteDoc(id: string) {
    setDeletingDocId(id)
    await supabase.from('travel_documents').delete().eq('id', id)
    setDocs(d => d.filter(x => x.id !== id))
    setDeletingDocId(null)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#F5F5F5', borderRadius: 10, padding: '11px 14px',
    fontSize: 15, fontFamily: SYS, outline: 'none', minHeight: 44,
    border: '1.5px solid transparent', color: '#1a1a1a',
  }
  const addBtnStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, background: '#1a1a1a', color: '#fff',
    padding: '6px 16px', borderRadius: 20, minHeight: 32, border: 'none', cursor: 'pointer', fontFamily: SYS,
  }
  const navBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600,
    color: '#1a1a1a', minHeight: 44, padding: '0 4px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS,
  }

  return (
    <div className="tp-page" style={{ minHeight: '100vh', background: '#fff', maxWidth: 390, margin: '0 auto', paddingBottom: 80, fontFamily: SYS }}>

      {/* ── Nav bar ── */}
      <div style={{ padding: '40px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={tourId ? `/tours/${tourId}` : '/dashboard'}>
          <button className="tp-press" style={navBtnStyle}>
            <svg width="9" height="15" viewBox="0 0 9 15" fill="none"><path d="M8 1L1 7.5L8 14" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Volver
          </button>
        </Link>
      </div>

      {/* ── Hero card ── */}
      <div style={{ padding: '0 20px 28px' }}>
        <div style={{ backgroundColor: color, opacity: 0.85, borderRadius: 20, padding: '20px 20px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <p style={{ fontWeight: 800, fontSize: 28, color: '#1a1a1a', margin: '0 0 4px 0', fontFamily: SYS, lineHeight: 1.1 }}>
            Travel Day
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <DestinationEdit value={td.destination} isAdmin={isAdmin} onSave={updateDestination} />
            {td.destination && <span style={{ fontSize: 14, color: 'rgba(26,26,26,0.5)', fontFamily: SYS }}>·</span>}
            <span style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(26,26,26,0.7)', fontFamily: SYS }}>
              {fmt(td.date)}
            </span>
          </div>
          {isAdmin && (
            <button onClick={() => {
              const dest = window.prompt('Destino:', td.destination ?? '')
              if (dest !== null) updateDestination(dest)
            }}
              style={{ display: 'block', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: 6, fontFamily: SYS, fontSize: 12, color: 'rgba(26,26,26,0.45)' }}>
              Editar destino
            </button>
          )}
        </div>
      </div>

      {/* ── Billetes ── */}
      <div style={{ padding: '0 20px' }}>
        <Section
          label="Billetes"
          action={isAdmin ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => pdfInputRef.current?.click()}
                style={{ ...addBtnStyle, opacity: uploading ? 0.5 : 1 }}>
                {uploading ? '…' : '+ PDF'}
              </button>
              <button onClick={() => { setAddingLink(true) }} style={addBtnStyle}>
                + Link
              </button>
            </div>
          ) : undefined}>

          <input ref={pdfInputRef} type="file" accept="application/pdf" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadPdf(f); e.target.value = '' }} />

          {docs.length === 0 && !addingLink && (
            <p style={{ fontSize: 14, color: '#C0C0C0', fontFamily: SYS }}>Sin billetes todavía</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docs.map(doc => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#F5F5F5', borderRadius: 12 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{doc.file_type === 'pdf' ? '📄' : '🔗'}</span>
                <a href={doc.url ?? '#'} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#007AFF', textDecoration: 'none', fontFamily: SYS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.label || doc.url}
                </a>
                {isAdmin && (
                  <button onClick={() => deleteDoc(doc.id)} disabled={deletingDocId === doc.id}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0C0C0', fontSize: 16, padding: 0, flexShrink: 0, fontFamily: SYS }}>
                    ×
                  </button>
                )}
              </div>
            ))}

            {addingLink && (
              <form onSubmit={addLink} style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#F5F5F5', borderRadius: 12, padding: '12px 12px' }}>
                <input placeholder="URL *" value={newLink.url} onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))} required
                  style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, padding: '8px 10px', fontSize: 14, fontFamily: SYS, outline: 'none' }} />
                <input placeholder="Etiqueta (opcional)" value={newLink.label} onChange={e => setNewLink(l => ({ ...l, label: e.target.value }))}
                  style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, padding: '8px 10px', fontSize: 14, fontFamily: SYS, outline: 'none' }} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => { setAddingLink(false); setNewLink({ label: '', url: '' }) }}
                    style={{ fontSize: 13, color: '#999', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS }}>Cancelar</button>
                  <button type="submit" style={addBtnStyle}>Añadir</button>
                </div>
              </form>
            )}
          </div>
        </Section>
      </div>

      {/* ── Horario ── */}
      <div style={{ padding: '0 20px' }}>
        <Section
          label="Horario"
          action={isAdmin ? (
            <button onClick={() => setAddingSched(true)} style={addBtnStyle}>+ Añadir</button>
          ) : undefined}>

          {schedule.length === 0 && !addingSched && (
            <p style={{ fontSize: 14, color: '#C0C0C0', fontFamily: SYS }}>Sin tramos todavía</p>
          )}

          <div style={{ position: 'relative' }}>
            {schedule.map((item, idx) => {
              const isExpanded = expandedId === item.id
              const edit = getEdit(item.id, item)
              return (
                <div key={item.id} style={{ display: 'flex', gap: 0, marginBottom: idx < schedule.length - 1 ? 20 : 0 }}>
                  {/* Left column: times */}
                  <div style={{ width: 60, flexShrink: 0, paddingTop: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0, fontFamily: SYS }}>{t5(item.time_start)}</p>
                    {item.time_end && <p style={{ fontSize: 12, color: '#999', margin: '1px 0 0 0', fontFamily: SYS }}>{t5(item.time_end)}</p>}
                  </div>
                  {/* Line + dot */}
                  <div style={{ width: 16, flexShrink: 0, position: 'relative', marginTop: 4 }}>
                    <div style={{ position: 'absolute', top: 7, left: 7, width: 1, bottom: idx < schedule.length - 1 ? -27 : 0, background: '#E8E8E8' }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1a1a1a', position: 'absolute', top: 5, left: 5 }} />
                  </div>
                  {/* Right column */}
                  <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                    <div
                      onClick={() => isAdmin && setExpandedId(isExpanded ? null : item.id)}
                      style={{ cursor: isAdmin ? 'pointer' : 'default' }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', margin: 0, fontFamily: SYS }}>{item.title}</p>
                      {item.subtitle && <p style={{ fontSize: 13, color: '#999', margin: '2px 0 0 0', fontFamily: SYS }}>{item.subtitle}</p>}
                    </div>
                    {isExpanded && isAdmin && (
                      <div style={{ marginTop: 12, background: '#F5F5F5', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div>
                            <p style={{ fontSize: 11, color: '#999', margin: '0 0 3px 0', fontFamily: SYS }}>Inicio</p>
                            <input type="time" value={t5(edit.time_start ?? item.time_start)}
                              onChange={e => setEdit(item.id, { time_start: e.target.value })} style={inputStyle} />
                          </div>
                          <div>
                            <p style={{ fontSize: 11, color: '#999', margin: '0 0 3px 0', fontFamily: SYS }}>Fin</p>
                            <input type="time" value={t5(edit.time_end ?? null)}
                              onChange={e => setEdit(item.id, { time_end: e.target.value || null })} style={inputStyle} />
                          </div>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, color: '#999', margin: '0 0 3px 0', fontFamily: SYS }}>Título</p>
                          <input type="text" value={edit.title ?? item.title}
                            onChange={e => setEdit(item.id, { title: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                          <p style={{ fontSize: 11, color: '#999', margin: '0 0 3px 0', fontFamily: SYS }}>Subtítulo</p>
                          <input type="text" value={edit.subtitle ?? item.subtitle ?? ''}
                            onChange={e => setEdit(item.id, { subtitle: e.target.value || null })} style={inputStyle} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                          <button onClick={() => deleteSched(item.id)}
                            style={{ fontSize: 12, color: '#DC412C', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS, padding: 0 }}>
                            Eliminar
                          </button>
                          <button onClick={() => saveEdit(item.id)}
                            style={{ background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 20, height: 36, padding: '0 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SYS }}>
                            Listo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add form */}
          {addingSched && (
            <form onSubmit={saveSched} style={{ background: '#F5F5F5', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, marginTop: schedule.length > 0 ? 20 : 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><p style={{ fontSize: 11, color: '#999', margin: '0 0 3px 0', fontFamily: SYS }}>Inicio *</p><input type="time" value={newSched.time_start} onChange={e => setNewSched(s => ({ ...s, time_start: e.target.value }))} required style={inputStyle} /></div>
                <div><p style={{ fontSize: 11, color: '#999', margin: '0 0 3px 0', fontFamily: SYS }}>Fin</p><input type="time" value={newSched.time_end} onChange={e => setNewSched(s => ({ ...s, time_end: e.target.value }))} style={inputStyle} /></div>
              </div>
              <div><p style={{ fontSize: 11, color: '#999', margin: '0 0 3px 0', fontFamily: SYS }}>Título *</p><input type="text" placeholder="Vuelo, Transfer…" value={newSched.title} onChange={e => setNewSched(s => ({ ...s, title: e.target.value }))} required style={inputStyle} /></div>
              <div><p style={{ fontSize: 11, color: '#999', margin: '0 0 3px 0', fontFamily: SYS }}>Subtítulo</p><input type="text" placeholder="Detalle opcional" value={newSched.subtitle} onChange={e => setNewSched(s => ({ ...s, subtitle: e.target.value }))} style={inputStyle} /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button type="button" onClick={() => setAddingSched(false)} style={{ fontSize: 14, color: '#999', padding: '10px 16px', minHeight: 44, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS }}>Cancelar</button>
                <button type="submit" style={{ ...addBtnStyle, fontSize: 14, padding: '10px 20px', minHeight: 44, borderRadius: 20 }}>Guardar</button>
              </div>
            </form>
          )}
        </Section>

        {isAdmin && (
          <div>
            <div style={{ height: 1, background: '#F0F0F0', margin: '8px 0' }} />
            <button onClick={() => setConfirmDelete(true)}
              style={{ width: '100%', fontSize: 14, color: '#DC412C', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS, padding: '16px 0', textAlign: 'center' }}>
              Eliminar Travel Day
            </button>
          </div>
        )}

        {/* Confirm delete sheet */}
        {mounted && confirmDelete && createPortal(
          <>
            <div onClick={() => setConfirmDelete(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }} />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 44px', zIndex: 9999, maxWidth: 430, margin: '0 auto', WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px 0', fontFamily: SYS }}>Eliminar Travel Day</p>
              <p style={{ fontSize: 14, color: '#666', margin: '0 0 24px 0', fontFamily: SYS, lineHeight: 1.5 }}>¿Eliminar este Travel Day? Se perderán todos los datos asociados.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={handleDeleteTravel}
                  style={{ width: '100%', height: 48, background: '#DC412C', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: SYS }}>
                  Eliminar
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  style={{ width: '100%', height: 48, background: '#F5F5F5', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 500, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS }}>
                  Cancelar
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
    </div>
  )
}
