import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const C = {
  bg0: '#0d1117', bg1: '#161d27', bg2: '#1d2636', bg3: '#243040',
  border: '#263044', border2: '#2e3a50',
  t1: '#eef2f7', t2: '#7a8fa8', t3: '#3d5068',
  red: '#E24B4A', redS: '#2a1020',
  green: '#4fc87a', greenS: '#0a2218',
  amber: '#f0a500', amberS: '#1e1400',
  blue: '#4a9eff', blueS: '#0d1e35',
}

// ── Root ────────────────────────────────────────────────────

export default function Admin({ onBack }) {
  const [shows, setShows] = useState([])
  const [members, setMembers] = useState([])
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('shows') // shows | show-edit | members
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchShows(); fetchMembers() }, [])

  async function fetchShows() {
    const { data } = await supabase.from('shows').select('*').order('sort_order')
    setShows(data || [])
  }
  async function fetchMembers() {
    const { data } = await supabase.from('tour_members').select('*')
    setMembers(data || [])
  }

  function flash(text) { setMsg(text); setTimeout(() => setMsg(''), 2500) }

  function openShow(s) { setSelected(s); setView('show-edit') }
  function newShow() { setSelected(null); setView('show-edit') }
  function goBack() { setView('shows'); setSelected(null); fetchShows() }

  return (
    <div style={{ background: C.bg0, minHeight: '100dvh', fontFamily: '-apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: C.bg1, borderBottom: `0.5px solid ${C.border}`, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {view !== 'shows' && (
            <span onClick={goBack} style={{ fontSize: '22px', color: C.red, cursor: 'pointer', lineHeight: 1 }}>‹</span>
          )}
          <span style={{ fontSize: '15px', fontWeight: '600', letterSpacing: '.08em', color: C.t1 }}>
            MALMÖ<span style={{ color: C.red }}>040</span>
            <span style={{ fontSize: '11px', color: C.t3, fontWeight: '400', marginLeft: '6px' }}>Admin</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {msg && <span style={{ fontSize: '12px', color: C.green }}>{msg}</span>}
          <span onClick={onBack} style={{ fontSize: '12px', color: C.t3, cursor: 'pointer', padding: '4px 8px', border: `0.5px solid ${C.border}`, borderRadius: '6px' }}>← App</span>
        </div>
      </div>

      {/* Nav */}
      {view === 'shows' && (
        <div style={{ display: 'flex', background: C.bg1, borderBottom: `0.5px solid ${C.border}` }}>
          {[['shows', 'Shows'], ['members', 'Crew']].map(([v, label]) => (
            <div key={v} onClick={() => setView(v)} style={{ padding: '9px 16px', fontSize: '12px', color: view === v ? C.red : C.t2, borderBottom: `2px solid ${view === v ? C.red : 'transparent'}`, cursor: 'pointer' }}>
              {label}
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '14px' }}>
        {view === 'shows' && <AdminShows shows={shows} onEdit={openShow} onNew={newShow} onDelete={fetchShows} onFlash={flash} />}
        {view === 'show-edit' && <AdminShowEdit show={selected} members={members} onFlash={flash} onBack={goBack} />}
        {view === 'members' && <AdminMembers members={members} onRefresh={fetchMembers} onFlash={flash} />}
      </div>
    </div>
  )
}

// ── Shows list ───────────────────────────────────────────────

function AdminShows({ shows, onEdit, onNew, onDelete, onFlash }) {
  const [confirmId, setConfirmId] = useState(null)

  async function handleDelete(id) {
    await supabase.from('shows').delete().eq('id', id)
    setConfirmId(null)
    onDelete()
    onFlash('Show eliminado')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '13px', color: C.t2 }}>{shows.length} shows</span>
        <Btn color={C.red} onClick={onNew}>+ Nuevo show</Btn>
      </div>
      {shows.map(s => (
        <div key={s.id} style={{ background: C.bg1, border: `0.5px solid ${C.border}`, borderRadius: '10px', marginBottom: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 12px', cursor: 'pointer' }} onClick={() => onEdit(s)}>
            <div style={{ textAlign: 'center', width: '34px', flexShrink: 0 }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: C.t1, lineHeight: 1 }}>{s.day}</div>
              <div style={{ fontSize: '10px', color: C.t2, textTransform: 'uppercase', marginTop: '1px' }}>{s.month}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: C.t1 }}>{s.title}</div>
              <div style={{ fontSize: '11px', color: C.t2, marginTop: '2px' }}>{s.city}</div>
            </div>
            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '99px', background: s.info_status === 'complete' ? C.greenS : C.amberS, color: s.info_status === 'complete' ? C.green : C.amber, flexShrink: 0 }}>
              {s.info_status === 'complete' ? 'Completo' : 'En proceso'}
            </span>
            <span style={{ fontSize: '14px', color: C.t3 }}>›</span>
          </div>
          {confirmId === s.id ? (
            <div style={{ background: '#1a0d0d', borderTop: `0.5px solid #3a1515`, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#f08080' }}>¿Eliminar este show?</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn color='#7a1a1a' onClick={() => handleDelete(s.id)}>Eliminar</Btn>
                <Btn color={C.bg3} onClick={() => setConfirmId(null)}>Cancelar</Btn>
              </div>
            </div>
          ) : (
            <div style={{ borderTop: `0.5px solid ${C.border}`, padding: '7px 12px', display: 'flex', justifyContent: 'flex-end' }}>
              <span onClick={() => setConfirmId(s.id)} style={{ fontSize: '11px', color: C.t3, cursor: 'pointer' }}>Eliminar show</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Show edit (with inner tabs) ──────────────────────────────

const SHOW_TABS = ['info', 'horarios', 'contactos', 'guest list', 'setlist', 'docs']

function AdminShowEdit({ show, members, onFlash, onBack }) {
  const [tab, setTab] = useState('info')
  const [showData, setShowData] = useState(show)

  // After saving info, update local showData so other tabs have the id
  function handleSaved(updated) {
    setShowData(updated)
    onFlash('Guardado ✓')
  }

  return (
    <div>
      <div style={{ fontSize: '14px', fontWeight: '600', color: C.t1, marginBottom: '14px' }}>
        {showData?.id ? showData.title : 'Nuevo show'}
      </div>

      {/* Inner tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', background: C.bg1, border: `0.5px solid ${C.border}`, borderRadius: '10px', marginBottom: '16px' }}>
        {SHOW_TABS.map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ flexShrink: 0, padding: '9px 13px', fontSize: '12px', color: tab === t ? C.red : C.t2, borderBottom: `2px solid ${tab === t ? C.red : 'transparent'}`, cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>

      {tab === 'info' && <TabInfo show={showData} onSaved={handleSaved} />}
      {tab === 'horarios' && <TabSchedule show={showData} members={members} onFlash={onFlash} />}
      {tab === 'contactos' && <TabContacts show={showData} onFlash={onFlash} />}
      {tab === 'guest list' && <TabGuestList show={showData} onFlash={onFlash} />}
      {tab === 'setlist' && <TabSetlist show={showData} onFlash={onFlash} />}
      {tab === 'docs' && <TabDocs show={showData} members={members} onFlash={onFlash} />}
    </div>
  )
}

// ── Tab: Info ────────────────────────────────────────────────

function TabInfo({ show, onSaved }) {
  const blank = {
    day: '', month: '', weekday: '', title: '', city: '',
    status: '', info_status: 'wip',
    show_duration: '—', pantalla_val: '—', pantalla_res: '', realizacion: '—',
    notas: '',
    hotel_name: '', hotel_address: '', hotel_checkin: '—', hotel_checkout: '—',
    hotel_tel: '', hotel_habitaciones: '',
    sort_order: 0,
  }
  const [form, setForm] = useState({ ...blank, ...(show || {}) })
  const [saving, setSaving] = useState(false)

  const f = k => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })
  const sel = (k, opts) => (
    <select {...f(k)} style={IS}>
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  )

  async function save() {
    setSaving(true)
    let result
    if (form.id) {
      const { data } = await supabase.from('shows').update(form).eq('id', form.id).select().single()
      result = data
    } else {
      const { data } = await supabase.from('shows').insert(form).select().single()
      result = data
    }
    setSaving(false)
    if (result) { setForm(result); onSaved(result) }
  }

  return (
    <div>
      <Sec title="Fecha">
        <Row label="Día"><input {...f('day')} placeholder="12" style={IS} /></Row>
        <Row label="Mes"><input {...f('month')} placeholder="Jun" style={IS} /></Row>
        <Row label="Día semana"><input {...f('weekday')} placeholder="Vie" style={IS} /></Row>
        <Row label="Título"><input {...f('title')} placeholder="Madrid / Puesta de largo" style={IS} /></Row>
        <Row label="Ciudad"><input {...f('city')} placeholder="Madrid, ES" style={IS} /></Row>
        <Row label="Orden"><input {...f('sort_order')} type="number" style={IS} /></Row>
      </Sec>

      <Sec title="Estado">
        <Row label="Status">{sel('status', [{ v: '', l: '—' }, { v: 'next', l: 'Próximo' }])}</Row>
        <Row label="Info">{sel('info_status', [{ v: 'wip', l: 'En proceso' }, { v: 'complete', l: 'Info completa' }])}</Row>
      </Sec>

      <Sec title="Ficha del show">
        <Row label="Duración"><input {...f('show_duration')} placeholder="75 min" style={IS} /></Row>
        <Row label="Pantalla">{sel('pantalla_val', [{ v: '—', l: '—' }, { v: 'Sí', l: 'Sí' }, { v: 'No', l: 'No' }])}</Row>
        <Row label="Resolución"><input {...f('pantalla_res')} placeholder="1920×1080" style={IS} /></Row>
        <Row label="Realización">{sel('realizacion', [{ v: '—', l: '—' }, { v: 'Sí', l: 'Sí' }, { v: 'No', l: 'No' }])}</Row>
      </Sec>

      <Sec title="Hotel">
        <Row label="Nombre"><input {...f('hotel_name')} style={IS} /></Row>
        <Row label="Dirección"><input {...f('hotel_address')} style={IS} /></Row>
        <Row label="Check-in"><input {...f('hotel_checkin')} style={IS} /></Row>
        <Row label="Check-out"><input {...f('hotel_checkout')} style={IS} /></Row>
        <Row label="Teléfono"><input {...f('hotel_tel')} style={IS} /></Row>
      </Sec>

      <Sec title="Habitaciones">
        <textarea {...f('hotel_habitaciones')} placeholder="Triple: Framis, Peguero, Víctor&#10;Twin: Joanet, Gonzo" rows={4} style={{ ...IS, width: '100%', resize: 'vertical', boxSizing: 'border-box' }} />
      </Sec>

      <Sec title="Notas">
        <textarea {...f('notas')} placeholder="Notas libres del show..." rows={4} style={{ ...IS, width: '100%', resize: 'vertical', boxSizing: 'border-box' }} />
      </Sec>

      <Btn color={C.red} onClick={save} disabled={saving} style={{ marginTop: '4px', width: '100%' }}>
        {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Crear show'}
      </Btn>
    </div>
  )
}

// ── Tab: Horarios ────────────────────────────────────────────

function TabSchedule({ show, members, onFlash }) {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)

  useEffect(() => { if (show?.id) fetch() }, [show?.id])

  async function fetch() {
    const { data } = await supabase.from('schedule_items').select('*').eq('show_id', show.id).order('sort_order')
    setItems(data || [])
  }

  async function save(item) {
    if (item.id) await supabase.from('schedule_items').update(item).eq('id', item.id)
    else await supabase.from('schedule_items').insert({ ...item, show_id: show.id })
    await fetch(); setEditing(null); onFlash('Guardado ✓')
  }

  async function del(id) {
    await supabase.from('schedule_items').delete().eq('id', id)
    await fetch(); onFlash('Eliminado')
  }

  if (!show?.id) return <EmptyNote text="Guarda el show primero para añadir horarios." />

  const dotC = { show: C.red, sound: C.green, travel: C.blue }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: C.t2 }}>{items.length} items</span>
        <Btn color={C.red} onClick={() => setEditing({ time_start: '', time_end: '', title: '', subtitle: '', type: '', extra_lines: [], visible_to: [], sort_order: items.length })}>
          + Añadir
        </Btn>
      </div>

      {editing && (
        <ScheduleForm item={editing} members={members} onSave={save} onCancel={() => setEditing(null)} />
      )}

      {items.map(item => (
        <div key={item.id} style={{ background: C.bg1, border: `0.5px solid ${C.border}`, borderRadius: '8px', padding: '10px 12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: dotC[item.type] || C.border2, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: C.t1 }}>{item.time_start} {item.title}</span>
            {item.subtitle && <div style={{ fontSize: '11px', color: C.t2, marginTop: '1px' }}>{item.subtitle}</div>}
            {item.extra_lines?.length > 0 && <div style={{ fontSize: '10px', color: C.t3, marginTop: '1px' }}>{item.extra_lines.length} líneas extra</div>}
          </div>
          <Ico onClick={() => setEditing(item)}>✎</Ico>
          <Ico onClick={() => del(item.id)} red>✕</Ico>
        </div>
      ))}
    </div>
  )
}

function ScheduleForm({ item, members, onSave, onCancel }) {
  const [form, setForm] = useState({ ...item, extra_lines: item.extra_lines || [], visible_to: item.visible_to || [] })
  const [extraText, setExtraText] = useState((item.extra_lines || []).join('\n'))
  const [saving, setSaving] = useState(false)
  const f = k => ({ value: form[k] || '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })

  async function handleSave() {
    setSaving(true)
    await onSave({ ...form, extra_lines: extraText.split('\n').map(l => l.trim()).filter(Boolean) })
    setSaving(false)
  }

  return (
    <div style={{ background: C.bg2, borderRadius: '10px', padding: '12px', marginBottom: '12px', border: `0.5px solid ${C.border2}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <input {...f('time_start')} placeholder="18:00" style={IS} />
        <input {...f('time_end')} placeholder="19:00 (opt)" style={IS} />
      </div>
      <input {...f('title')} placeholder="Título" style={{ ...IS, width: '100%', marginBottom: '8px', boxSizing: 'border-box' }} />
      <input {...f('subtitle')} placeholder="Subtítulo (opt)" style={{ ...IS, width: '100%', marginBottom: '8px', boxSizing: 'border-box' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <select {...f('type')} style={IS}>
          <option value="">— tipo —</option>
          <option value="show">Show</option>
          <option value="sound">Soundcheck</option>
          <option value="travel">Viaje</option>
        </select>
        <input {...f('sort_order')} type="number" placeholder="Orden" style={IS} />
      </div>
      <label style={{ fontSize: '11px', color: C.t2, display: 'block', marginBottom: '4px' }}>Líneas extra (una por línea)</label>
      <textarea value={extraText} onChange={e => setExtraText(e.target.value)} rows={3} style={{ ...IS, width: '100%', resize: 'vertical', marginBottom: '8px', boxSizing: 'border-box' }} />
      {members.length > 0 && (
        <>
          <label style={{ fontSize: '11px', color: C.t2, display: 'block', marginBottom: '6px' }}>Visible para (vacío = todos)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {members.map(m => (
              <span key={m.id} onClick={() => setForm(p => ({ ...p, visible_to: p.visible_to.includes(m.id) ? p.visible_to.filter(x => x !== m.id) : [...p.visible_to, m.id] }))}
                style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '99px', cursor: 'pointer', background: form.visible_to.includes(m.id) ? m.bg_color : C.bg3, color: form.visible_to.includes(m.id) ? m.text_color : C.t2, border: `0.5px solid ${C.border2}` }}>
                {m.initials}
              </span>
            ))}
          </div>
        </>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Btn color={C.red} onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
        <Btn color={C.bg3} onClick={onCancel}>Cancelar</Btn>
      </div>
    </div>
  )
}

// ── Tab: Contactos ───────────────────────────────────────────

function TabContacts({ show, onFlash }) {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)

  useEffect(() => { if (show?.id) fetch() }, [show?.id])
  async function fetch() {
    const { data } = await supabase.from('show_contacts').select('*').eq('show_id', show.id).order('sort_order')
    setItems(data || [])
  }
  async function save(item) {
    if (item.id) await supabase.from('show_contacts').update(item).eq('id', item.id)
    else await supabase.from('show_contacts').insert({ ...item, show_id: show.id })
    await fetch(); setEditing(null); onFlash('Guardado ✓')
  }
  async function del(id) {
    await supabase.from('show_contacts').delete().eq('id', id)
    await fetch(); onFlash('Eliminado')
  }

  if (!show?.id) return <EmptyNote text="Guarda el show primero." />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: C.t2 }}>{items.length} contactos</span>
        <Btn color={C.red} onClick={() => setEditing({ name: '', role: '', phone: '', sort_order: items.length })}>+ Añadir</Btn>
      </div>
      {editing && (
        <SimpleForm fields={[{ k: 'name', label: 'Nombre', required: true }, { k: 'role', label: 'Rol' }, { k: 'phone', label: 'Teléfono' }, { k: 'sort_order', label: 'Orden', type: 'number' }]}
          data={editing} onSave={save} onCancel={() => setEditing(null)} />
      )}
      {items.map(c => (
        <div key={c.id} style={{ background: C.bg1, border: `0.5px solid ${C.border}`, borderRadius: '8px', padding: '10px 12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: C.t1 }}>{c.name}</div>
            <div style={{ fontSize: '11px', color: C.t2 }}>{c.role} {c.phone && `· ${c.phone}`}</div>
          </div>
          <Ico onClick={() => setEditing(c)}>✎</Ico>
          <Ico onClick={() => del(c.id)} red>✕</Ico>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Guest List ──────────────────────────────────────────

const CAT = { m: { label: 'Mgmt', bg: '#2a1020', color: '#ee0088' }, p: { label: 'Prensa', bg: C.amberS, color: C.amber }, f: { label: 'Familia', bg: C.greenS, color: C.green }, i: { label: 'Industria', bg: C.blueS, color: C.blue } }

function TabGuestList({ show, onFlash }) {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)

  useEffect(() => { if (show?.id) fetch() }, [show?.id])
  async function fetch() {
    const { data } = await supabase.from('guest_list').select('*').eq('show_id', show.id).order('sort_order')
    setItems(data || [])
  }
  async function save(item) {
    if (item.id) await supabase.from('guest_list').update(item).eq('id', item.id)
    else await supabase.from('guest_list').insert({ ...item, show_id: show.id })
    await fetch(); setEditing(null); onFlash('Guardado ✓')
  }
  async function del(id) {
    await supabase.from('guest_list').delete().eq('id', id)
    await fetch(); onFlash('Eliminado')
  }

  if (!show?.id) return <EmptyNote text="Guarda el show primero." />

  const total = items.reduce((a, b) => a + (b.quantity || 1), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: C.t2 }}>{total} pases · {items.length} entradas</span>
        <Btn color={C.red} onClick={() => setEditing({ name: '', quantity: 1, category: 'f', sort_order: items.length })}>+ Añadir</Btn>
      </div>
      {editing && (
        <div style={{ background: C.bg2, borderRadius: '10px', padding: '12px', marginBottom: '12px', border: `0.5px solid ${C.border2}` }}>
          <GuestForm data={editing} onSave={save} onCancel={() => setEditing(null)} />
        </div>
      )}
      {items.map(g => {
        const cat = CAT[g.category] || CAT.f
        return (
          <div key={g.id} style={{ background: C.bg1, border: `0.5px solid ${C.border}`, borderRadius: '8px', padding: '10px 12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: C.t1 }}>{g.name}</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: C.t1, width: '20px', textAlign: 'center' }}>{g.quantity}</span>
            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '99px', background: cat.bg, color: cat.color }}>{cat.label}</span>
            <Ico onClick={() => setEditing(g)}>✎</Ico>
            <Ico onClick={() => del(g.id)} red>✕</Ico>
          </div>
        )
      })}
    </div>
  )
}

function GuestForm({ data, onSave, onCancel }) {
  const [form, setForm] = useState({ ...data })
  const f = k => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })
  return (
    <div>
      <input {...f('name')} placeholder="Nombre" style={{ ...IS, width: '100%', marginBottom: '8px', boxSizing: 'border-box' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        <input {...f('quantity')} type="number" min="1" placeholder="Cant." style={IS} />
        <select {...f('category')} style={IS}>
          {Object.entries(CAT).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Btn color={C.red} onClick={() => onSave(form)}>Guardar</Btn>
        <Btn color={C.bg3} onClick={onCancel}>Cancelar</Btn>
      </div>
    </div>
  )
}

// ── Tab: Setlist ─────────────────────────────────────────────

function TabSetlist({ show, onFlash }) {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)

  useEffect(() => { if (show?.id) fetch() }, [show?.id])
  async function fetch() {
    const { data } = await supabase.from('setlist_items').select('*').eq('show_id', show.id).order('track_number')
    setItems(data || [])
  }
  async function save(item) {
    if (item.id) await supabase.from('setlist_items').update(item).eq('id', item.id)
    else await supabase.from('setlist_items').insert({ ...item, show_id: show.id })
    await fetch(); setEditing(null); onFlash('Guardado ✓')
  }
  async function del(id) {
    await supabase.from('setlist_items').delete().eq('id', id)
    await fetch(); onFlash('Eliminado')
  }

  if (!show?.id) return <EmptyNote text="Guarda el show primero." />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: C.t2 }}>{items.length} canciones</span>
        <Btn color={C.red} onClick={() => setEditing({ track_number: items.length + 1, title: '', duration: '', note: '' })}>+ Añadir</Btn>
      </div>
      {editing && (
        <SimpleForm
          fields={[{ k: 'track_number', label: '#', type: 'number' }, { k: 'title', label: 'Título', required: true }, { k: 'duration', label: 'Duración (mm:ss)' }, { k: 'note', label: 'Nota' }]}
          data={editing} onSave={save} onCancel={() => setEditing(null)} />
      )}
      {items.map(t => (
        <div key={t.id} style={{ background: C.bg1, border: `0.5px solid ${C.border}`, borderRadius: '8px', padding: '10px 12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: C.t3, width: '20px', textAlign: 'center', flexShrink: 0 }}>{t.track_number}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: C.t1 }}>{t.title}</div>
            {t.note && <div style={{ fontSize: '10px', color: C.blue, marginTop: '1px' }}>{t.note}</div>}
          </div>
          <span style={{ fontSize: '11px', color: C.t2 }}>{t.duration}</span>
          <Ico onClick={() => setEditing(t)}>✎</Ico>
          <Ico onClick={() => del(t.id)} red>✕</Ico>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Docs & Billetes ─────────────────────────────────────

function TabDocs({ show, members, onFlash }) {
  const [docs, setDocs] = useState([])
  const [tickets, setTickets] = useState([])
  const [section, setSection] = useState('docs') // docs | tickets
  const [editingDoc, setEditingDoc] = useState(null)
  const [editingTicket, setEditingTicket] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  useEffect(() => { if (show?.id) { fetchDocs(); fetchTickets() } }, [show?.id])

  async function fetchDocs() {
    const { data } = await supabase.from('documents').select('*').eq('show_id', show.id).order('sort_order')
    setDocs(data || [])
  }
  async function fetchTickets() {
    const { data } = await supabase.from('tickets').select('*, tour_members(*)').eq('show_id', show.id)
    setTickets(data || [])
  }

  async function uploadDoc(file, isRider) {
    setUploading(true)
    const path = `shows/${show.id}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('tour-docs').upload(path, file)
    if (!error) {
      const ext = file.name.split('.').pop().toLowerCase()
      const file_type = ['jpg','jpeg','png','gif','webp'].includes(ext) ? 'img' : ext === 'pdf' ? 'pdf' : 'txt'
      await supabase.from('documents').insert({ show_id: show.id, name: file.name, file_type, storage_path: path, is_rider_doc: isRider, sort_order: docs.length })
      await fetchDocs()
      onFlash('Archivo subido ✓')
    } else {
      onFlash('Error al subir archivo')
    }
    setUploading(false)
  }

  async function uploadTicketFile(file, ticketId) {
    setUploading(true)
    const path = `tickets/${show.id}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('tour-docs').upload(path, file)
    if (!error) {
      await supabase.from('tickets').update({ file_name: file.name, storage_path: path }).eq('id', ticketId)
      await fetchTickets()
      onFlash('Billete subido ✓')
    } else {
      onFlash('Error al subir')
    }
    setUploading(false)
  }

  async function delDoc(doc) {
    if (doc.storage_path) await supabase.storage.from('tour-docs').remove([doc.storage_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    await fetchDocs(); onFlash('Eliminado')
  }

  async function saveTicket(item) {
    if (item.id) await supabase.from('tickets').update(item).eq('id', item.id)
    else await supabase.from('tickets').insert({ ...item, show_id: show.id })
    await fetchTickets(); setEditingTicket(null); onFlash('Guardado ✓')
  }

  async function delTicket(id) {
    await supabase.from('tickets').delete().eq('id', id)
    await fetchTickets(); onFlash('Eliminado')
  }

  async function updateDocMeta(doc) {
    await supabase.from('documents').update({ name: doc.name, is_rider_doc: doc.is_rider_doc }).eq('id', doc.id)
    await fetchDocs(); setEditingDoc(null); onFlash('Guardado ✓')
  }

  if (!show?.id) return <EmptyNote text="Guarda el show primero." />

  return (
    <div>
      {/* Section switcher */}
      <div style={{ display: 'flex', background: C.bg1, border: `0.5px solid ${C.border}`, borderRadius: '8px', marginBottom: '14px', overflow: 'hidden' }}>
        {[['docs', 'Documentos'], ['tickets', 'Billetes']].map(([v, l]) => (
          <div key={v} onClick={() => setSection(v)} style={{ flex: 1, textAlign: 'center', padding: '8px', fontSize: '12px', cursor: 'pointer', background: section === v ? C.red : 'transparent', color: section === v ? '#fff' : C.t2 }}>{l}</div>
        ))}
      </div>

      {section === 'docs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: C.t2 }}>{docs.length} archivos</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <label style={{ ...btnCSS(C.bg3), cursor: 'pointer' }}>
                {uploading ? 'Subiendo...' : '↑ Subir doc'}
                <input type="file" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadDoc(e.target.files[0], false)} />
              </label>
              <label style={{ ...btnCSS(C.red), cursor: 'pointer' }}>
                {uploading ? '...' : '↑ Rider'}
                <input type="file" accept=".pdf,.jpg,.png" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadDoc(e.target.files[0], true)} />
              </label>
            </div>
          </div>

          {editingDoc && (
            <div style={{ background: C.bg2, borderRadius: '10px', padding: '12px', marginBottom: '12px', border: `0.5px solid ${C.border2}` }}>
              <input value={editingDoc.name} onChange={e => setEditingDoc(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del archivo" style={{ ...IS, width: '100%', marginBottom: '8px', boxSizing: 'border-box' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: C.t2, marginBottom: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={editingDoc.is_rider_doc} onChange={e => setEditingDoc(p => ({ ...p, is_rider_doc: e.target.checked })) } />
                Mostrar en ficha del show (rider doc)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn color={C.red} onClick={() => updateDocMeta(editingDoc)}>Guardar</Btn>
                <Btn color={C.bg3} onClick={() => setEditingDoc(null)}>Cancelar</Btn>
              </div>
            </div>
          )}

          {docs.map(d => {
            const typeC = { pdf: { bg: C.redS, color: C.red }, img: { bg: C.blueS, color: C.blue }, txt: { bg: C.bg3, color: C.t2 } }
            const tc = typeC[d.file_type] || typeC.txt
            return (
              <div key={d.id} style={{ background: C.bg1, border: `0.5px solid ${C.border}`, borderRadius: '8px', padding: '10px 12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: tc.bg, color: tc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>
                  {d.file_type.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                  {d.is_rider_doc && <div style={{ fontSize: '10px', color: C.amber }}>Rider doc</div>}
                </div>
                <Ico onClick={() => setEditingDoc(d)}>✎</Ico>
                <Ico onClick={() => delDoc(d)} red>✕</Ico>
              </div>
            )
          })}
        </div>
      )}

      {section === 'tickets' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: C.t2 }}>{tickets.length} billetes</span>
            <Btn color={C.red} onClick={() => setEditingTicket({ member_id: '', transport_type: 'van', detail: '' })}>+ Añadir</Btn>
          </div>

          {editingTicket && (
            <TicketForm data={editingTicket} members={members} onSave={saveTicket} onCancel={() => setEditingTicket(null)} />
          )}

          {tickets.map(t => {
            const m = t.tour_members
            const typeLabel = { van: 'Furgoneta', train: 'Tren', fly: 'Vuelo' }
            const typeC = { van: { bg: C.bg3, color: C.t2 }, train: { bg: C.amberS, color: C.amber }, fly: { bg: C.blueS, color: C.blue } }
            const tc = typeC[t.transport_type] || typeC.van
            return (
              <div key={t.id} style={{ background: C.bg1, border: `0.5px solid ${C.border}`, borderRadius: '8px', padding: '10px 12px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: m?.bg_color || C.bg3, color: m?.text_color || C.t2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600', flexShrink: 0 }}>
                    {m?.initials || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: C.t1 }}>{m?.name || '—'}</div>
                    {t.detail && <div style={{ fontSize: '11px', color: C.t2 }}>{t.detail}</div>}
                    {t.file_name && <div style={{ fontSize: '10px', color: C.blue, marginTop: '2px' }}>📎 {t.file_name}</div>}
                  </div>
                  <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '99px', background: tc.bg, color: tc.color }}>{typeLabel[t.transport_type]}</span>
                  <Ico onClick={() => setEditingTicket(t)}>✎</Ico>
                  <Ico onClick={() => delTicket(t.id)} red>✕</Ico>
                </div>
                {t.id && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '11px', color: C.blue, cursor: 'pointer' }}>
                    <span>{uploading ? 'Subiendo...' : '↑ Subir archivo billete'}</span>
                    <input type="file" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadTicketFile(e.target.files[0], t.id)} />
                  </label>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TicketForm({ data, members, onSave, onCancel }) {
  const [form, setForm] = useState({ ...data })
  const f = k => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })
  return (
    <div style={{ background: C.bg2, borderRadius: '10px', padding: '12px', marginBottom: '12px', border: `0.5px solid ${C.border2}` }}>
      <select {...f('member_id')} style={{ ...IS, width: '100%', marginBottom: '8px', boxSizing: 'border-box' }}>
        <option value="">— Miembro —</option>
        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <select {...f('transport_type')} style={{ ...IS, width: '100%', marginBottom: '8px', boxSizing: 'border-box' }}>
        <option value="van">Furgoneta</option>
        <option value="train">Tren</option>
        <option value="fly">Vuelo</option>
      </select>
      <input {...f('detail')} placeholder="Detalle (nº tren, vuelo...)" style={{ ...IS, width: '100%', marginBottom: '12px', boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <Btn color={C.red} onClick={() => onSave(form)}>Guardar</Btn>
        <Btn color={C.bg3} onClick={onCancel}>Cancelar</Btn>
      </div>
    </div>
  )
}

// ── Tab: Members ─────────────────────────────────────────────

function AdminMembers({ members, onRefresh, onFlash }) {
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  async function save(item) {
    setSaving(true)
    if (item.id) await supabase.from('tour_members').update(item).eq('id', item.id)
    else await supabase.from('tour_members').insert(item)
    await onRefresh(); setEditing(null); setSaving(false); onFlash('Guardado ✓')
  }
  async function del(id) {
    await supabase.from('tour_members').delete().eq('id', id)
    await onRefresh(); onFlash('Eliminado')
  }

  return (
    <div>
      <div style={{ fontSize: '11px', color: C.t3, background: C.bg1, border: `0.5px solid ${C.border}`, borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', lineHeight: '1.6' }}>
        Los auth_user_id se vinculan desde Supabase → Authentication → Users. Copia el UUID del usuario y pégalo aquí.
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <Btn color={C.red} onClick={() => setEditing({ name: '', initials: '', role: '', type: 'banda', bg_color: '#2a1020', text_color: '#ee0088', auth_user_id: '' })}>+ Añadir</Btn>
      </div>
      {editing && <MemberForm data={editing} onSave={save} onCancel={() => setEditing(null)} saving={saving} />}
      {members.map(m => (
        <div key={m.id} style={{ background: C.bg1, border: `0.5px solid ${C.border}`, borderRadius: '10px', padding: '11px 12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: m.bg_color, color: m.text_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
            {m.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: C.t1 }}>{m.name}</div>
            <div style={{ fontSize: '11px', color: C.t2, marginTop: '1px' }}>{m.role} · {m.type}</div>
            {m.auth_user_id && <div style={{ fontSize: '10px', color: C.t3, marginTop: '1px', fontFamily: 'monospace' }}>{m.auth_user_id.slice(0, 16)}…</div>}
          </div>
          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '99px', background: m.type === 'admin' ? C.redS : m.type === 'banda' ? C.redS : C.blueS, color: m.type === 'admin' ? C.red : m.type === 'banda' ? '#ee0088' : C.blue }}>
            {m.type}
          </span>
          <Ico onClick={() => setEditing(m)}>✎</Ico>
          <Ico onClick={() => del(m.id)} red>✕</Ico>
        </div>
      ))}
    </div>
  )
}

function MemberForm({ data, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ ...data })
  const f = k => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })
  return (
    <div style={{ background: C.bg2, borderRadius: '10px', padding: '12px', marginBottom: '12px', border: `0.5px solid ${C.border2}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <input {...f('name')} placeholder="Nombre completo" style={IS} />
        <input {...f('initials')} placeholder="Iniciales (ej: FR)" style={IS} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <input {...f('role')} placeholder="Rol (ej: Batería)" style={IS} />
        <select {...f('type')} style={IS}>
          <option value="banda">Banda</option>
          <option value="crew">Crew</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <div>
          <label style={{ fontSize: '10px', color: C.t3, display: 'block', marginBottom: '3px' }}>Color fondo</label>
          <input {...f('bg_color')} type="color" style={{ ...IS, padding: '2px', height: '34px', width: '100%' }} />
        </div>
        <div>
          <label style={{ fontSize: '10px', color: C.t3, display: 'block', marginBottom: '3px' }}>Color texto</label>
          <input {...f('text_color')} type="color" style={{ ...IS, padding: '2px', height: '34px', width: '100%' }} />
        </div>
      </div>
      <input {...f('auth_user_id')} placeholder="auth_user_id (UUID de Supabase Auth)" style={{ ...IS, width: '100%', marginBottom: '12px', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '11px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <Btn color={C.red} onClick={() => onSave(form)} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
        <Btn color={C.bg3} onClick={onCancel}>Cancelar</Btn>
      </div>
    </div>
  )
}

// ── Generic SimpleForm ───────────────────────────────────────

function SimpleForm({ fields, data, onSave, onCancel }) {
  const [form, setForm] = useState({ ...data })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div style={{ background: C.bg2, borderRadius: '10px', padding: '12px', marginBottom: '12px', border: `0.5px solid ${C.border2}` }}>
      {fields.map(({ k, label, type, required }) => (
        <div key={k} style={{ marginBottom: '8px' }}>
          <input
            value={form[k] ?? ''}
            onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
            type={type || 'text'}
            placeholder={`${label}${required ? ' *' : ''}`}
            style={{ ...IS, width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <Btn color={C.red} onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
        <Btn color={C.bg3} onClick={onCancel}>Cancelar</Btn>
      </div>
    </div>
  )
}

// ── Shared UI ────────────────────────────────────────────────

function Sec({ title, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '10px', fontWeight: '600', color: C.t3, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{title}</div>
      <div style={{ background: C.bg1, border: `0.5px solid ${C.border}`, borderRadius: '10px', padding: '0 12px' }}>{children}</div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: `0.5px solid ${C.border}`, gap: '12px' }}>
      <span style={{ fontSize: '12px', color: C.t2, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>{children}</div>
    </div>
  )
}

function Btn({ color, onClick, disabled, children, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: color, border: 'none', borderRadius: '7px', padding: '8px 14px', fontSize: '12px', fontWeight: '500', color: '#eef2f7', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1, fontFamily: '-apple-system, sans-serif', ...style }}>
      {children}
    </button>
  )
}

function Ico({ onClick, red, children }) {
  return (
    <span onClick={onClick} style={{ fontSize: '14px', color: red ? C.t3 : C.t3, cursor: 'pointer', padding: '4px', borderRadius: '5px', flexShrink: 0, ':hover': { color: red ? C.red : C.t1 } }}>
      {children}
    </span>
  )
}

function EmptyNote({ text }) {
  return <div style={{ fontSize: '13px', color: C.t3, padding: '20px 0', textAlign: 'center' }}>{text}</div>
}

const IS = {
  background: C.bg3, border: `0.5px solid ${C.border2}`, borderRadius: '6px',
  padding: '7px 10px', fontSize: '13px', color: C.t1, outline: 'none',
  fontFamily: '-apple-system, sans-serif',
}

function btnCSS(bg) {
  return { background: bg, border: 'none', borderRadius: '7px', padding: '8px 14px', fontSize: '12px', fontWeight: '500', color: '#eef2f7', fontFamily: '-apple-system, sans-serif', display: 'inline-block' }
}
