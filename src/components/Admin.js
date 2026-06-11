import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const C = { bg0: '#0d1117', bg1: '#161d27', bg2: '#1d2636', border: '#263044', t1: '#eef2f7', t2: '#7a8fa8', t3: '#3d5068', red: '#E24B4A' }

export default function Admin({ onBack }) {
  const [shows, setShows] = useState([])
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('shows') // shows | show-edit | schedule | members
  const [members, setMembers] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetchShows()
    fetchMembers()
  }, [])

  async function fetchShows() {
    const { data } = await supabase.from('shows').select('*').order('sort_order')
    setShows(data || [])
  }

  async function fetchMembers() {
    const { data } = await supabase.from('tour_members').select('*')
    setMembers(data || [])
  }

  async function saveShow(show) {
    setSaving(true)
    if (show.id) {
      await supabase.from('shows').update(show).eq('id', show.id)
    } else {
      await supabase.from('shows').insert(show)
    }
    await fetchShows()
    setSaving(false)
    setMsg('Guardado ✓')
    setTimeout(() => setMsg(''), 2000)
  }

  async function saveScheduleItem(item) {
    setSaving(true)
    if (item.id) {
      await supabase.from('schedule_items').update(item).eq('id', item.id)
    } else {
      await supabase.from('schedule_items').insert({ ...item, show_id: selected.id })
    }
    setSaving(false)
    setMsg('Guardado ✓')
    setTimeout(() => setMsg(''), 2000)
  }

  async function deleteScheduleItem(id) {
    await supabase.from('schedule_items').delete().eq('id', id)
  }

  return (
    <div style={{ background: C.bg0, minHeight: '100dvh', fontFamily: '-apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: C.bg1, borderBottom: `0.5px solid ${C.border}`, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {view !== 'shows' && (
            <span onClick={() => setView('shows')} style={{ fontSize: '17px', color: C.red, cursor: 'pointer' }}>‹</span>
          )}
          <span style={{ fontSize: '15px', fontWeight: '500', letterSpacing: '.1em', color: C.t1 }}>
            MALMÖ<span style={{ color: C.red }}>040</span> <span style={{ fontSize: '11px', color: C.t3, fontWeight: '400' }}>Admin</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {msg && <span style={{ fontSize: '12px', color: '#4fc87a' }}>{msg}</span>}
          <span onClick={onBack} style={{ fontSize: '12px', color: C.t3, cursor: 'pointer' }}>← App</span>
        </div>
      </div>

      {/* Nav tabs */}
      <div style={{ display: 'flex', background: C.bg1, borderBottom: `0.5px solid ${C.border}` }}>
        {['shows', 'members'].map(v => (
          <div key={v} onClick={() => setView(v)} style={{ padding: '9px 14px', fontSize: '12px', color: view === v ? C.red : C.t2, borderBottom: `2px solid ${view === v ? C.red : 'transparent'}`, cursor: 'pointer', textTransform: 'capitalize' }}>
            {v === 'shows' ? 'Shows' : 'Crew'}
          </div>
        ))}
      </div>

      <div style={{ padding: '14px' }}>
        {view === 'shows' && <AdminShows shows={shows} onEdit={s => { setSelected(s); setView('show-edit') }} onNew={() => { setSelected({}); setView('show-edit') }} />}
        {view === 'show-edit' && <AdminShowEdit show={selected} members={members} onSave={saveShow} saving={saving} onSchedule={() => setView('schedule')} />}
        {view === 'schedule' && <AdminSchedule showId={selected?.id} members={members} onSave={saveScheduleItem} onDelete={deleteScheduleItem} saving={saving} />}
        {view === 'members' && <AdminMembers members={members} onRefresh={fetchMembers} />}
      </div>
    </div>
  )
}

function AdminShows({ shows, onEdit, onNew }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: '#7a8fa8' }}>{shows.length} shows</span>
        <button onClick={onNew} style={btnStyle('#E24B4A')}>+ Nuevo show</button>
      </div>
      {shows.map(s => (
        <div key={s.id} onClick={() => onEdit(s)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: '#161d27', border: `0.5px solid #263044`, borderRadius: '8px', marginBottom: '8px', cursor: 'pointer' }}>
          <div style={{ textAlign: 'center', width: '32px' }}>
            <div style={{ fontSize: '17px', fontWeight: '500', color: '#eef2f7' }}>{s.day}</div>
            <div style={{ fontSize: '10px', color: '#7a8fa8' }}>{s.month}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#eef2f7' }}>{s.title}</div>
            <div style={{ fontSize: '11px', color: '#7a8fa8' }}>{s.city}</div>
          </div>
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '99px', background: s.info_status === 'complete' ? '#0a1e14' : '#1e1400', color: s.info_status === 'complete' ? '#4fc87a' : '#f0a500' }}>
            {s.info_status === 'complete' ? 'Completo' : 'En proceso'}
          </span>
        </div>
      ))}
    </div>
  )
}

function AdminShowEdit({ show, members, onSave, saving, onSchedule }) {
  const [form, setForm] = useState({
    day: '', month: '', weekday: '', title: '', city: '',
    status: '', info_status: 'wip',
    show_duration: '—', pantalla_val: '—', pantalla_res: '', realizacion: '—',
    notas: '',
    hotel_name: '', hotel_address: '', hotel_checkin: '—', hotel_checkout: '—', hotel_tel: '', hotel_habitaciones: '',
    sort_order: 0,
    ...show
  })

  const f = (k) => ({ value: form[k] || '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })
  const sel = (k, opts) => (
    <select {...f(k)} style={inputStyle}>
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  )

  return (
    <div>
      <div style={{ fontSize: '14px', fontWeight: '500', color: '#eef2f7', marginBottom: '14px' }}>
        {show.id ? 'Editar show' : 'Nuevo show'}
      </div>

      <Section title="Fecha">
        <Row label="Día">{<input {...f('day')} placeholder="12" style={inputStyle} />}</Row>
        <Row label="Mes">{<input {...f('month')} placeholder="Jun" style={inputStyle} />}</Row>
        <Row label="Día semana">{<input {...f('weekday')} placeholder="Vie" style={inputStyle} />}</Row>
        <Row label="Título">{<input {...f('title')} placeholder="Madrid / Puesta de largo" style={inputStyle} />}</Row>
        <Row label="Ciudad">{<input {...f('city')} placeholder="Madrid, ES" style={inputStyle} />}</Row>
        <Row label="Orden">{<input {...f('sort_order')} type="number" style={inputStyle} />}</Row>
      </Section>

      <Section title="Estado">
        <Row label="Status">{sel('status', [{ v: '', l: '—' }, { v: 'next', l: 'Próximo' }])}</Row>
        <Row label="Info">{sel('info_status', [{ v: 'wip', l: 'En proceso' }, { v: 'complete', l: 'Info completa' }])}</Row>
      </Section>

      <Section title="Ficha del show">
        <Row label="Duración">{<input {...f('show_duration')} placeholder="75 min" style={inputStyle} />}</Row>
        <Row label="Pantalla">{sel('pantalla_val', [{ v: '—', l: '—' }, { v: 'Sí', l: 'Sí' }, { v: 'No', l: 'No' }])}</Row>
        <Row label="Resolución">{<input {...f('pantalla_res')} placeholder="1920×1080" style={inputStyle} />}</Row>
        <Row label="Realización">{sel('realizacion', [{ v: '—', l: '—' }, { v: 'Sí', l: 'Sí' }, { v: 'No', l: 'No' }])}</Row>
      </Section>

      <Section title="Hotel">
        <Row label="Nombre">{<input {...f('hotel_name')} style={inputStyle} />}</Row>
        <Row label="Dirección">{<input {...f('hotel_address')} style={inputStyle} />}</Row>
        <Row label="Check-in">{<input {...f('hotel_checkin')} style={inputStyle} />}</Row>
        <Row label="Check-out">{<input {...f('hotel_checkout')} style={inputStyle} />}</Row>
        <Row label="Teléfono">{<input {...f('hotel_tel')} style={inputStyle} />}</Row>
      </Section>

      <Section title="Habitaciones">
        <textarea {...f('hotel_habitaciones')} placeholder="Triple: Framis, Peguero, Víctor&#10;Twin: Joanet, Gonzo" rows={4} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
      </Section>

      <Section title="Notas">
        <textarea {...f('notas')} placeholder="Notas libres del show..." rows={4} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
      </Section>

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button onClick={() => onSave(form)} disabled={saving} style={btnStyle('#E24B4A', saving)}>
          {saving ? 'Guardando...' : 'Guardar show'}
        </button>
        {show.id && (
          <button onClick={onSchedule} style={btnStyle('#1d2636')}>
            Editar horarios →
          </button>
        )}
      </div>
    </div>
  )
}

function AdminSchedule({ showId, members, onSave, onDelete, saving }) {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)

  useEffect(() => { fetchItems() }, [showId])

  async function fetchItems() {
    const { data } = await supabase.from('schedule_items').select('*').eq('show_id', showId).order('sort_order')
    setItems(data || [])
  }

  async function handleSave(item) {
    await onSave(item)
    await fetchItems()
    setEditing(null)
  }

  async function handleDelete(id) {
    await onDelete(id)
    await fetchItems()
  }

  const dotColor = { show: '#E24B4A', sound: '#4fc87a', travel: '#4a9eff' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: '#7a8fa8' }}>{items.length} items</span>
        <button onClick={() => setEditing({ show_id: showId, time_start: '', time_end: '', title: '', subtitle: '', type: '', extra_lines: [], visible_to: [], sort_order: items.length })} style={btnStyle('#E24B4A')}>
          + Añadir
        </button>
      </div>

      {editing && (
        <ScheduleItemForm item={editing} members={members} onSave={handleSave} onCancel={() => setEditing(null)} saving={saving} />
      )}

      {items.map(item => (
        <div key={item.id} style={{ background: '#161d27', border: `0.5px solid #263044`, borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: dotColor[item.type] || '#2e3a50', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#eef2f7' }}>{item.time_start} {item.title}</span>
              {item.extra_lines?.length > 0 && <div style={{ fontSize: '11px', color: '#7a8fa8', marginTop: '2px' }}>{item.extra_lines.length} líneas extra</div>}
            </div>
            <button onClick={() => setEditing(item)} style={{ background: 'none', border: `0.5px solid #263044`, borderRadius: '5px', padding: '3px 8px', fontSize: '11px', color: '#7a8fa8', cursor: 'pointer' }}>Editar</button>
            <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#3d5068', cursor: 'pointer', fontSize: '14px' }}>✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ScheduleItemForm({ item, members, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    ...item,
    extra_lines: item.extra_lines || [],
    visible_to: item.visible_to || [],
  })
  const [extraText, setExtraText] = useState((item.extra_lines || []).join('\n'))

  const f = (k) => ({ value: form[k] || '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })

  function toggleMember(id) {
    setForm(p => ({
      ...p,
      visible_to: p.visible_to.includes(id)
        ? p.visible_to.filter(x => x !== id)
        : [...p.visible_to, id]
    }))
  }

  function handleSave() {
    const lines = extraText.split('\n').map(l => l.trim()).filter(Boolean)
    onSave({ ...form, extra_lines: lines })
  }

  return (
    <div style={{ background: '#1d2636', borderRadius: '10px', padding: '12px', marginBottom: '12px', border: `0.5px solid #2e3a50` }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <input {...f('time_start')} placeholder="18:00" style={inputStyle} />
        <input {...f('time_end')} placeholder="19:00 (opcional)" style={inputStyle} />
      </div>
      <input {...f('title')} placeholder="Título del evento" style={{ ...inputStyle, width: '100%', marginBottom: '8px' }} />
      <input {...f('subtitle')} placeholder="Subtítulo (opcional)" style={{ ...inputStyle, width: '100%', marginBottom: '8px' }} />
      <select {...f('type')} style={{ ...inputStyle, marginBottom: '8px' }}>
        <option value="">— tipo —</option>
        <option value="show">Show</option>
        <option value="sound">Soundcheck</option>
        <option value="travel">Viaje</option>
      </select>
      <input {...f('sort_order')} type="number" placeholder="Orden" style={{ ...inputStyle, marginBottom: '8px' }} />

      <div style={{ fontSize: '11px', color: '#7a8fa8', marginBottom: '6px' }}>Líneas extra (una por línea)</div>
      <textarea
        value={extraText}
        onChange={e => setExtraText(e.target.value)}
        placeholder="60 min · Batería · Bajo · Guitars · Voz&#10;Monitor engineer: Luis M.&#10;Chequear in-ears"
        rows={3}
        style={{ ...inputStyle, width: '100%', resize: 'vertical', marginBottom: '8px' }}
      />

      <div style={{ fontSize: '11px', color: '#7a8fa8', marginBottom: '6px' }}>Visible para (dejar vacío = todos)</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
        {members.map(m => (
          <span key={m.id} onClick={() => toggleMember(m.id)} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '99px', cursor: 'pointer', background: form.visible_to.includes(m.id) ? m.bg_color : '#243040', color: form.visible_to.includes(m.id) ? m.text_color : '#7a8fa8', border: `0.5px solid #2e3a50` }}>
            {m.initials}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={handleSave} disabled={saving} style={btnStyle('#E24B4A', saving)}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button onClick={onCancel} style={btnStyle('#1d2636')}>Cancelar</button>
      </div>
    </div>
  )
}

function AdminMembers({ members, onRefresh }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: '#7a8fa8', marginBottom: '12px' }}>
        Los usuarios se crean en Supabase Dashboard → Authentication → Users, y luego se vinculan aquí actualizando auth_user_id.
      </div>
      {members.map(m => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#161d27', border: `0.5px solid #263044`, borderRadius: '8px', marginBottom: '8px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: m.bg_color, color: m.text_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '500' }}>
            {m.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#eef2f7' }}>{m.name}</div>
            <div style={{ fontSize: '11px', color: '#7a8fa8' }}>{m.role} · {m.type}</div>
          </div>
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '99px', background: m.type === 'admin' ? '#2a1020' : m.type === 'banda' ? '#2a1020' : '#0d1e35', color: m.type === 'admin' ? '#E24B4A' : m.type === 'banda' ? '#ee0088' : '#4a9eff' }}>
            {m.type}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Shared ─────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '10px', fontWeight: '500', color: '#3d5068', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '8px' }}>{title}</div>
      <div style={{ background: '#161d27', border: `0.5px solid #263044`, borderRadius: '10px', padding: '0 12px' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: `0.5px solid #263044`, gap: '12px' }}>
      <span style={{ fontSize: '12px', color: '#7a8fa8', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>{children}</div>
    </div>
  )
}

const inputStyle = {
  background: '#243040',
  border: '0.5px solid #2e3a50',
  borderRadius: '6px',
  padding: '7px 10px',
  fontSize: '13px',
  color: '#eef2f7',
  outline: 'none',
}

function btnStyle(bg, disabled) {
  return {
    background: bg,
    border: 'none',
    borderRadius: '7px',
    padding: '9px 14px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#eef2f7',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  }
}
