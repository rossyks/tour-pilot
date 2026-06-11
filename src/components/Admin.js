import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const C = {
  bg0: '#0a0e14', bg1: '#111720', bg2: '#182030', bg3: '#1e2a3a',
  border: '#1e2d40', border2: '#253550',
  t1: '#f0f4f8', t2: '#6e859e', t3: '#384d63',
  red: '#E24B4A', redS: '#280f0e', redM: '#7a1a19',
  green: '#3ec97a', greenS: '#081e12',
  amber: '#f0a500', amberS: '#1c1300',
  blue: '#4a9eff', blueS: '#0a1a30',
  pink: '#ee0088', pinkS: '#260014',
}

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const WEEKDAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function parseDateFromShow(day, month) {
  const m = MONTHS_ES.indexOf(month)
  if (!day || m < 0) return ''
  const year = m >= 5 ? 2026 : 2027 // Jun onwards = 2026, else 2027
  return `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function dateToFields(dateStr) {
  if (!dateStr) return {}
  const d = new Date(dateStr + 'T12:00:00')
  return {
    day: String(d.getDate()),
    month: MONTHS_ES[d.getMonth()],
    weekday: WEEKDAYS_ES[d.getDay()],
  }
}

// ── Root ────────────────────────────────────────────────────

export default function Admin({ onBack }) {
  const [shows, setShows] = useState([])
  const [members, setMembers] = useState([])
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('shows')
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchShows(); fetchMembers() }, [])

  async function fetchShows() {
    const { data } = await supabase.from('shows').select('*').order('sort_order')
    setShows(data || [])
  }
  async function fetchMembers() {
    const { data } = await supabase.from('tour_members').select('*')
    setMembers(data || [])
  }

  function flash(text, type = 'ok') {
    setToast({ text, type })
    setTimeout(() => setToast(null), 2500)
  }

  function openShow(s) { setSelected(s); setView('show-edit') }
  function goBack() { setView('shows'); setSelected(null); fetchShows() }

  return (
    <div style={{ background: C.bg0, minHeight: '100dvh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Header */}
      <div style={{ background: C.bg1, borderBottom: `1px solid ${C.border}`, padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {view !== 'shows' && (
            <button onClick={goBack} style={ghostBtn}>‹ Volver</button>
          )}
          <div style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '.12em', color: C.t1 }}>
            MALMÖ<span style={{ color: C.red }}>040</span>
            <span style={{ fontSize: '10px', color: C.t3, fontWeight: '400', marginLeft: '7px', letterSpacing: '.06em' }}>ADMIN</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {toast && (
            <div style={{ fontSize: '12px', color: toast.type === 'ok' ? C.green : '#f87', background: toast.type === 'ok' ? C.greenS : C.redS, border: `0.5px solid ${toast.type === 'ok' ? C.green : C.red}`, borderRadius: '20px', padding: '4px 10px' }}>
              {toast.text}
            </div>
          )}
          <button onClick={onBack} style={ghostBtn}>← App</button>
        </div>
      </div>

      {/* Nav tabs (only on shows view) */}
      {view === 'shows' && (
        <div style={{ display: 'flex', background: C.bg1, borderBottom: `1px solid ${C.border}`, padding: '0 16px' }}>
          {[['shows', 'Shows'], ['members', 'Crew']].map(([v, label]) => (
            <div key={v} onClick={() => setView(v)} style={{ padding: '10px 14px', fontSize: '12px', fontWeight: '500', color: view === v ? C.red : C.t2, borderBottom: `2px solid ${view === v ? C.red : 'transparent'}`, cursor: 'pointer', transition: 'color .15s' }}>
              {label}
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '16px', maxWidth: '640px', margin: '0 auto' }}>
        {view === 'shows' && <AdminShows shows={shows} onEdit={openShow} onNew={() => { setSelected(null); setView('show-edit') }} onDelete={fetchShows} onFlash={flash} />}
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
    setConfirmId(null); onDelete(); onFlash('Show eliminado')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', color: C.t2 }}>{shows.length} shows · 2026</span>
        <PrimaryBtn onClick={onNew}>+ Nuevo show</PrimaryBtn>
      </div>
      {shows.map(s => (
        <div key={s.id} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: '12px', marginBottom: '10px', overflow: 'hidden', transition: 'border-color .2s' }}>
          <div onClick={() => onEdit(s)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 14px', cursor: 'pointer' }}>
            {/* Date badge */}
            <div style={{ width: '40px', flexShrink: 0, textAlign: 'center', background: s.status === 'next' ? C.pinkS : C.bg3, borderRadius: '8px', padding: '6px 0', border: `0.5px solid ${s.status === 'next' ? C.pink : C.border2}` }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: s.status === 'next' ? C.pink : C.t1, lineHeight: 1 }}>{s.day}</div>
              <div style={{ fontSize: '9px', color: s.status === 'next' ? C.pink : C.t2, textTransform: 'uppercase', marginTop: '2px', letterSpacing: '.05em' }}>{s.month}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: C.t1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
              <div style={{ fontSize: '11px', color: C.t2, marginTop: '3px' }}>{s.city}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
              <StatusPill complete={s.info_status === 'complete'} />
              <span style={{ color: C.t3, fontSize: '16px' }}>›</span>
            </div>
          </div>
          {confirmId === s.id ? (
            <div style={{ background: C.redS, borderTop: `1px solid ${C.redM}`, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#f09090' }}>¿Eliminar "{s.title}"?</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <DangerBtn onClick={() => handleDelete(s.id)}>Eliminar</DangerBtn>
                <GhostBtn2 onClick={() => setConfirmId(null)}>Cancelar</GhostBtn2>
              </div>
            </div>
          ) : (
            <div style={{ borderTop: `1px solid ${C.border}`, padding: '7px 14px', display: 'flex', justifyContent: 'flex-end' }}>
              <span onClick={() => setConfirmId(s.id)} style={{ fontSize: '11px', color: C.t3, cursor: 'pointer' }}>Eliminar show</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Show edit (with inner tabs) ──────────────────────────────

const SHOW_TABS = [
  { id: 'info', label: 'Info' },
  { id: 'horarios', label: 'Horarios' },
  { id: 'contactos', label: 'Contactos' },
  { id: 'guestlist', label: 'Guest List' },
  { id: 'setlist', label: 'Setlist' },
  { id: 'docs', label: 'Docs' },
]

function AdminShowEdit({ show, members, onFlash, onBack }) {
  const [tab, setTab] = useState('info')
  const [showData, setShowData] = useState(show)

  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '700', color: C.t1, marginBottom: '4px' }}>
        {showData?.id ? showData.title : 'Nuevo show'}
      </div>
      {showData?.id && <div style={{ fontSize: '12px', color: C.t2, marginBottom: '16px' }}>{showData.weekday} {showData.day} {showData.month} · {showData.city}</div>}
      {!showData?.id && <div style={{ height: '8px' }} />}

      {/* Scrollable tab bar */}
      <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: '10px', marginBottom: '18px' }}>
        {SHOW_TABS.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{ flexShrink: 0, padding: '9px 14px', fontSize: '12px', fontWeight: tab === t.id ? '600' : '400', color: tab === t.id ? C.red : C.t2, borderBottom: `2px solid ${tab === t.id ? C.red : 'transparent'}`, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color .15s' }}>
            {t.label}
          </div>
        ))}
      </div>

      {tab === 'info' && <TabInfo show={showData} onSaved={s => { setShowData(s); onFlash('Guardado ✓') }} />}
      {tab === 'horarios' && <TabSchedule show={showData} members={members} onFlash={onFlash} />}
      {tab === 'contactos' && <TabContacts show={showData} onFlash={onFlash} />}
      {tab === 'guestlist' && <TabGuestList show={showData} onFlash={onFlash} />}
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
    show_duration: '', pantalla_val: '—', pantalla_res: '', realizacion: '—',
    notas: '',
    hotel_name: '', hotel_address: '', hotel_checkin: '', hotel_checkout: '',
    hotel_tel: '', hotel_habitaciones: '', sort_order: 0,
  }
  const [form, setForm] = useState({ ...blank, ...(show || {}) })
  const [dateVal, setDateVal] = useState(parseDateFromShow(show?.day, show?.month))
  const [saving, setSaving] = useState(false)

  function handleDate(e) {
    const val = e.target.value
    setDateVal(val)
    const fields = dateToFields(val)
    setForm(p => ({ ...p, ...fields }))
  }

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

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
      {/* Date — full width prominent */}
      <Card title="Fecha del show">
        <div style={{ padding: '12px 14px' }}>
          <label style={labelStyle}>Selecciona la fecha</label>
          <input type="date" value={dateVal} onChange={handleDate} style={{ ...inputFull, fontSize: '15px', padding: '10px 12px' }} />
          {form.day && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              {[['Día', form.day], ['Mes', form.month], ['Día semana', form.weekday]].map(([label, val]) => (
                <div key={label} style={{ flex: 1, background: C.bg3, border: `0.5px solid ${C.border2}`, borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: C.t3, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '3px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: C.green }}>{val}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Divider />
        <FieldRow label="Título del show">
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Madrid / Puesta de largo" style={inputFull} />
        </FieldRow>
        <FieldRow label="Ciudad">
          <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Madrid, ES" style={inputFull} />
        </FieldRow>
        <FieldRow label="Orden en lista" last>
          <input value={form.sort_order} onChange={e => set('sort_order', e.target.value)} type="number" style={{ ...inputBase, width: '80px' }} />
        </FieldRow>
      </Card>

      <Card title="Estado">
        <div style={{ padding: '12px 14px' }}>
          <label style={labelStyle}>Visibilidad en lista</label>
          <ToggleGroup
            value={form.status}
            onChange={v => set('status', v)}
            options={[{ v: '', l: 'Normal' }, { v: 'next', l: '⚡ Próximo' }]}
          />
        </div>
        <Divider />
        <div style={{ padding: '12px 14px' }}>
          <label style={labelStyle}>Estado de información</label>
          <ToggleGroup
            value={form.info_status}
            onChange={v => set('info_status', v)}
            options={[{ v: 'wip', l: '🔧 En proceso' }, { v: 'complete', l: '✓ Info completa' }]}
          />
        </div>
      </Card>

      <Card title="Ficha técnica del show">
        <FieldRow label="Duración set">
          <input value={form.show_duration} onChange={e => set('show_duration', e.target.value)} placeholder="75 min" style={{ ...inputBase, width: '120px' }} />
        </FieldRow>
        <Divider />
        <div style={{ padding: '12px 14px' }}>
          <label style={labelStyle}>Pantalla</label>
          <ToggleGroup
            value={form.pantalla_val}
            onChange={v => set('pantalla_val', v)}
            options={[{ v: '—', l: 'Sin dato' }, { v: 'Sí', l: '✓ Sí' }, { v: 'No', l: '✗ No' }]}
          />
          {form.pantalla_val === 'Sí' && (
            <input value={form.pantalla_res} onChange={e => set('pantalla_res', e.target.value)} placeholder="Resolución (ej: 1920×1080)" style={{ ...inputFull, marginTop: '8px' }} />
          )}
        </div>
        <Divider />
        <div style={{ padding: '12px 14px' }}>
          <label style={labelStyle}>Realización</label>
          <ToggleGroup
            value={form.realizacion}
            onChange={v => set('realizacion', v)}
            options={[{ v: '—', l: 'Sin dato' }, { v: 'Sí', l: '✓ Sí' }, { v: 'No', l: '✗ No' }]}
          />
        </div>
      </Card>

      <Card title="Hotel">
        <FieldRow label="Nombre hotel">
          <input value={form.hotel_name} onChange={e => set('hotel_name', e.target.value)} placeholder="Ibis Madrid Centro" style={inputFull} />
        </FieldRow>
        <FieldRow label="Dirección">
          <input value={form.hotel_address} onChange={e => set('hotel_address', e.target.value)} placeholder="C/ Gran Vía 1, Madrid" style={inputFull} />
        </FieldRow>
        <FieldRow label="Teléfono">
          <input value={form.hotel_tel} onChange={e => set('hotel_tel', e.target.value)} placeholder="+34 91 000 00 00" style={inputFull} />
        </FieldRow>
        <FieldRow label="Check-in">
          <input value={form.hotel_checkin} onChange={e => set('hotel_checkin', e.target.value)} placeholder="14:00" style={{ ...inputBase, width: '100px' }} />
        </FieldRow>
        <FieldRow label="Check-out" last>
          <input value={form.hotel_checkout} onChange={e => set('hotel_checkout', e.target.value)} placeholder="11:00" style={{ ...inputBase, width: '100px' }} />
        </FieldRow>
      </Card>

      <Card title="Habitaciones">
        <div style={{ padding: '10px 14px' }}>
          <textarea value={form.hotel_habitaciones} onChange={e => set('hotel_habitaciones', e.target.value)} placeholder={'Triple: Framis, Peguero, Víctor\nTwin: Joanet, Gonzo\nDUI: Karateka'} rows={4} style={{ ...inputFull, resize: 'vertical' }} />
        </div>
      </Card>

      <Card title="Notas internas">
        <div style={{ padding: '10px 14px' }}>
          <textarea value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Parking trasero backstage. Acreditaciones puerta lateral..." rows={4} style={{ ...inputFull, resize: 'vertical' }} />
        </div>
      </Card>

      <PrimaryBtn onClick={save} disabled={saving} style={{ width: '100%', marginTop: '4px', padding: '13px', fontSize: '14px' }}>
        {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : '+ Crear show'}
      </PrimaryBtn>
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

  if (!show?.id) return <NoShowNote />

  const dotC = { show: C.red, sound: C.green, travel: C.blue }

  return (
    <div>
      <ListHeader count={`${items.length} items`} onAdd={() => setEditing({ time_start: '', time_end: '', title: '', subtitle: '', type: '', extra_lines: [], visible_to: [], sort_order: items.length })} />
      {editing && <ScheduleForm item={editing} members={members} onSave={save} onCancel={() => setEditing(null)} />}
      {items.map(item => (
        <ItemRow key={item.id}
          left={<div style={{ width: '7px', height: '7px', borderRadius: '50%', background: dotC[item.type] || C.border2, flexShrink: 0, marginTop: '3px' }} />}
          onEdit={() => setEditing(item)} onDelete={() => del(item.id)}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: C.t1 }}>{item.time_start} {item.title}</div>
          {item.subtitle && <div style={{ fontSize: '11px', color: C.t2, marginTop: '1px' }}>{item.subtitle}</div>}
          {item.extra_lines?.length > 0 && <div style={{ fontSize: '10px', color: C.t3, marginTop: '1px' }}>{item.extra_lines.length} líneas extra</div>}
        </ItemRow>
      ))}
    </div>
  )
}

function ScheduleForm({ item, members, onSave, onCancel }) {
  const [form, setForm] = useState({ ...item, extra_lines: item.extra_lines || [], visible_to: item.visible_to || [] })
  const [extraText, setExtraText] = useState((item.extra_lines || []).join('\n'))
  const [saving, setSaving] = useState(false)
  const s = k => v => setForm(p => ({ ...p, [k]: v }))

  async function handleSave() {
    setSaving(true)
    await onSave({ ...form, extra_lines: extraText.split('\n').map(l => l.trim()).filter(Boolean) })
    setSaving(false)
  }

  return (
    <div style={formCard}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <LabeledInput label="Hora inicio" value={form.time_start} onChange={e => s('time_start')(e.target.value)} placeholder="18:00" />
        <LabeledInput label="Hora fin (opt)" value={form.time_end} onChange={e => s('time_end')(e.target.value)} placeholder="19:00" />
      </div>
      <LabeledInput label="Título *" value={form.title} onChange={e => s('title')(e.target.value)} placeholder="Soundcheck" style={{ marginBottom: '8px' }} />
      <LabeledInput label="Subtítulo (opt)" value={form.subtitle} onChange={e => s('subtitle')(e.target.value)} placeholder="Sala principal" style={{ marginBottom: '8px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <div>
          <label style={labelStyle}>Tipo</label>
          <select value={form.type} onChange={e => s('type')(e.target.value)} style={inputFull}>
            <option value="">— tipo —</option>
            <option value="show">Show</option>
            <option value="sound">Soundcheck</option>
            <option value="travel">Viaje</option>
          </select>
        </div>
        <LabeledInput label="Orden" value={form.sort_order} onChange={e => s('sort_order')(e.target.value)} type="number" />
      </div>
      <div style={{ marginBottom: '8px' }}>
        <label style={labelStyle}>Líneas extra (una por línea)</label>
        <textarea value={extraText} onChange={e => setExtraText(e.target.value)} rows={3} style={{ ...inputFull, resize: 'vertical' }} placeholder={'60 min · Bajo · Voz\nMonitor engineer: Luis'} />
      </div>
      {members.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Visible para (vacío = todos)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {members.map(m => (
              <span key={m.id} onClick={() => setForm(p => ({ ...p, visible_to: p.visible_to.includes(m.id) ? p.visible_to.filter(x => x !== m.id) : [...p.visible_to, m.id] }))}
                style={{ fontSize: '11px', padding: '4px 9px', borderRadius: '99px', cursor: 'pointer', fontWeight: '500', background: form.visible_to.includes(m.id) ? m.bg_color : C.bg3, color: form.visible_to.includes(m.id) ? m.text_color : C.t2, border: `0.5px solid ${C.border2}`, transition: 'all .15s' }}>
                {m.initials}
              </span>
            ))}
          </div>
        </div>
      )}
      <FormActions onSave={handleSave} onCancel={onCancel} saving={saving} />
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

  if (!show?.id) return <NoShowNote />

  return (
    <div>
      <ListHeader count={`${items.length} contactos`} onAdd={() => setEditing({ name: '', role: '', phone: '', sort_order: items.length })} />
      {editing && (
        <div style={formCard}>
          <LabeledInput label="Nombre *" value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} style={{ marginBottom: '8px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <LabeledInput label="Rol" value={editing.role} onChange={e => setEditing(p => ({ ...p, role: e.target.value }))} placeholder="Producción" />
            <LabeledInput label="Teléfono" value={editing.phone} onChange={e => setEditing(p => ({ ...p, phone: e.target.value }))} placeholder="+34 6xx" />
          </div>
          <FormActions onSave={() => save(editing)} onCancel={() => setEditing(null)} />
        </div>
      )}
      {items.map(c => (
        <ItemRow key={c.id} onEdit={() => setEditing(c)} onDelete={() => del(c.id)}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: C.t1 }}>{c.name}</div>
          <div style={{ fontSize: '11px', color: C.t2 }}>{c.role}{c.phone ? ` · ${c.phone}` : ''}</div>
        </ItemRow>
      ))}
    </div>
  )
}

// ── Tab: Guest List ──────────────────────────────────────────

const CAT = {
  m: { label: 'Mgmt', bg: C.pinkS, color: C.pink },
  p: { label: 'Prensa', bg: C.amberS, color: C.amber },
  f: { label: 'Familia', bg: C.greenS, color: C.green },
  i: { label: 'Industria', bg: C.blueS, color: C.blue },
}

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

  if (!show?.id) return <NoShowNote />

  const total = items.reduce((a, b) => a + (Number(b.quantity) || 1), 0)

  return (
    <div>
      <ListHeader count={`${total} pases · ${items.length} entradas`} onAdd={() => setEditing({ name: '', quantity: 1, category: 'f', sort_order: items.length })} />
      {editing && (
        <div style={formCard}>
          <LabeledInput label="Nombre *" value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} style={{ marginBottom: '8px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', marginBottom: '12px' }}>
            <LabeledInput label="Cantidad" value={editing.quantity} onChange={e => setEditing(p => ({ ...p, quantity: e.target.value }))} type="number" min="1" />
            <div>
              <label style={labelStyle}>Categoría</label>
              <select value={editing.category} onChange={e => setEditing(p => ({ ...p, category: e.target.value }))} style={inputFull}>
                {Object.entries(CAT).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
          </div>
          <FormActions onSave={() => save(editing)} onCancel={() => setEditing(null)} />
        </div>
      )}
      {items.map(g => {
        const cat = CAT[g.category] || CAT.f
        return (
          <ItemRow key={g.id} onEdit={() => setEditing(g)} onDelete={() => del(g.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: C.t1, flex: 1 }}>{g.name}</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: C.t1, width: '22px', textAlign: 'center' }}>{g.quantity}</span>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: cat.bg, color: cat.color, fontWeight: '600' }}>{cat.label}</span>
            </div>
          </ItemRow>
        )
      })}
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

  if (!show?.id) return <NoShowNote />

  return (
    <div>
      <ListHeader count={`${items.length} canciones`} onAdd={() => setEditing({ track_number: items.length + 1, title: '', duration: '', note: '' })} />
      {editing && (
        <div style={formCard}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '8px', marginBottom: '8px' }}>
            <LabeledInput label="#" value={editing.track_number} onChange={e => setEditing(p => ({ ...p, track_number: e.target.value }))} type="number" />
            <LabeledInput label="Título *" value={editing.title} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <LabeledInput label="Duración (mm:ss)" value={editing.duration} onChange={e => setEditing(p => ({ ...p, duration: e.target.value }))} placeholder="3:45" />
            <LabeledInput label="Nota" value={editing.note} onChange={e => setEditing(p => ({ ...p, note: e.target.value }))} placeholder="Versión acústica" />
          </div>
          <FormActions onSave={() => save(editing)} onCancel={() => setEditing(null)} />
        </div>
      )}
      {items.map(t => (
        <ItemRow key={t.id}
          left={<span style={{ fontSize: '11px', color: C.t3, width: '22px', textAlign: 'center', flexShrink: 0 }}>{t.track_number}</span>}
          onEdit={() => setEditing(t)} onDelete={() => del(t.id)}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: C.t1 }}>{t.title}</div>
          {t.note && <div style={{ fontSize: '10px', color: C.blue, marginTop: '1px' }}>{t.note}</div>}
          {t.duration && <div style={{ fontSize: '11px', color: C.t2 }}>{t.duration}</div>}
        </ItemRow>
      ))}
    </div>
  )
}

// ── Tab: Docs & Billetes ─────────────────────────────────────

function TabDocs({ show, members, onFlash }) {
  const [docs, setDocs] = useState([])
  const [tickets, setTickets] = useState([])
  const [section, setSection] = useState('docs')
  const [editingDoc, setEditingDoc] = useState(null)
  const [editingTicket, setEditingTicket] = useState(null)
  const [uploading, setUploading] = useState(false)

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
      await fetchDocs(); onFlash('Archivo subido ✓')
    } else {
      onFlash('Error al subir')
    }
    setUploading(false)
  }

  async function uploadTicketFile(file, ticketId) {
    setUploading(true)
    const path = `tickets/${show.id}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('tour-docs').upload(path, file)
    if (!error) {
      await supabase.from('tickets').update({ file_name: file.name, storage_path: path }).eq('id', ticketId)
      await fetchTickets(); onFlash('Billete subido ✓')
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

  if (!show?.id) return <NoShowNote />

  const typeC = { pdf: { bg: C.redS, color: C.red, label: 'PDF' }, img: { bg: C.blueS, color: C.blue, label: 'IMG' }, txt: { bg: C.bg3, color: C.t2, label: 'TXT' } }
  const transportC = { van: { bg: C.bg3, color: C.t2, label: 'Furgoneta' }, train: { bg: C.amberS, color: C.amber, label: 'Tren' }, fly: { bg: C.blueS, color: C.blue, label: 'Vuelo' } }

  return (
    <div>
      {/* Section switcher */}
      <div style={{ display: 'flex', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: '10px', marginBottom: '16px', overflow: 'hidden' }}>
        {[['docs', `Documentos (${docs.length})`], ['tickets', `Billetes (${tickets.length})`]].map(([v, l]) => (
          <div key={v} onClick={() => setSection(v)} style={{ flex: 1, textAlign: 'center', padding: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: section === v ? C.red : 'transparent', color: section === v ? '#fff' : C.t2, transition: 'all .15s' }}>{l}</div>
        ))}
      </div>

      {section === 'docs' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <label style={{ ...uploadBtnStyle(C.bg2), cursor: 'pointer', flex: 1 }}>
              {uploading ? '⏳ Subiendo...' : '↑ Subir documento'}
              <input type="file" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadDoc(e.target.files[0], false)} />
            </label>
            <label style={{ ...uploadBtnStyle(C.redS), cursor: 'pointer', flex: 1, color: C.red, border: `1px solid ${C.redM}` }}>
              ↑ Subir rider
              <input type="file" accept=".pdf,.jpg,.png" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadDoc(e.target.files[0], true)} />
            </label>
          </div>

          {editingDoc && (
            <div style={formCard}>
              <LabeledInput label="Nombre del archivo" value={editingDoc.name} onChange={e => setEditingDoc(p => ({ ...p, name: e.target.value }))} style={{ marginBottom: '10px' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: C.t2, marginBottom: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={editingDoc.is_rider_doc} onChange={e => setEditingDoc(p => ({ ...p, is_rider_doc: e.target.checked }))} />
                Mostrar en ficha del show (rider doc)
              </label>
              <FormActions onSave={() => updateDocMeta(editingDoc)} onCancel={() => setEditingDoc(null)} />
            </div>
          )}

          {docs.map(d => {
            const tc = typeC[d.file_type] || typeC.txt
            return (
              <ItemRow key={d.id}
                left={<div style={{ width: '30px', height: '30px', borderRadius: '7px', background: tc.bg, color: tc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', flexShrink: 0 }}>{tc.label}</div>}
                onEdit={() => setEditingDoc(d)} onDelete={() => delDoc(d)}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                {d.is_rider_doc && <div style={{ fontSize: '10px', color: C.amber, marginTop: '1px' }}>★ Rider doc</div>}
              </ItemRow>
            )
          })}
        </div>
      )}

      {section === 'tickets' && (
        <div>
          <ListHeader count={`${tickets.length} billetes`} onAdd={() => setEditingTicket({ member_id: '', transport_type: 'van', detail: '' })} />
          {editingTicket && (
            <div style={formCard}>
              <div style={{ marginBottom: '8px' }}>
                <label style={labelStyle}>Miembro</label>
                <select value={editingTicket.member_id} onChange={e => setEditingTicket(p => ({ ...p, member_id: e.target.value }))} style={inputFull}>
                  <option value="">— Seleccionar —</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={labelStyle}>Transporte</label>
                <ToggleGroup value={editingTicket.transport_type} onChange={v => setEditingTicket(p => ({ ...p, transport_type: v }))}
                  options={[{ v: 'van', l: '🚐 Furgoneta' }, { v: 'train', l: '🚆 Tren' }, { v: 'fly', l: '✈️ Vuelo' }]} />
              </div>
              <LabeledInput label="Detalle (nº tren, vuelo...)" value={editingTicket.detail} onChange={e => setEditingTicket(p => ({ ...p, detail: e.target.value }))} style={{ marginBottom: '12px' }} />
              <FormActions onSave={() => saveTicket(editingTicket)} onCancel={() => setEditingTicket(null)} />
            </div>
          )}

          {tickets.map(t => {
            const m = t.tour_members
            const tc = transportC[t.transport_type] || transportC.van
            return (
              <div key={t.id} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 14px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: m?.bg_color || C.bg3, color: m?.text_color || C.t2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>{m?.initials || '?'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: C.t1 }}>{m?.name || '—'}</div>
                    {t.detail && <div style={{ fontSize: '11px', color: C.t2 }}>{t.detail}</div>}
                    {t.file_name && <div style={{ fontSize: '10px', color: C.blue, marginTop: '2px' }}>📎 {t.file_name}</div>}
                  </div>
                  <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '99px', background: tc.bg, color: tc.color, fontWeight: '600' }}>{tc.label}</span>
                  <Ico onClick={() => setEditingTicket(t)}>✎</Ico>
                  <Ico onClick={() => delTicket(t.id)} red>✕</Ico>
                </div>
                {t.id && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '11px', color: C.blue, cursor: 'pointer', borderTop: `0.5px solid ${C.border}`, paddingTop: '8px' }}>
                    📎 {uploading ? 'Subiendo...' : 'Adjuntar archivo de billete'}
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
      <div style={{ fontSize: '11px', color: C.t3, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', lineHeight: '1.7' }}>
        Para vincular un usuario: ve a Supabase → Authentication → Users, copia el UUID y pégalo en auth_user_id.
      </div>
      <ListHeader count={`${members.length} miembros`} onAdd={() => setEditing({ name: '', initials: '', role: '', type: 'banda', bg_color: '#2a1020', text_color: '#ee0088', auth_user_id: '' })} />
      {editing && (
        <div style={formCard}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '8px', marginBottom: '8px' }}>
            <LabeledInput label="Nombre completo *" value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} />
            <LabeledInput label="Iniciales" value={editing.initials} onChange={e => setEditing(p => ({ ...p, initials: e.target.value }))} placeholder="FR" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <LabeledInput label="Rol (ej: Batería)" value={editing.role} onChange={e => setEditing(p => ({ ...p, role: e.target.value }))} />
            <div>
              <label style={labelStyle}>Tipo</label>
              <select value={editing.type} onChange={e => setEditing(p => ({ ...p, type: e.target.value }))} style={inputFull}>
                <option value="banda">Banda</option>
                <option value="crew">Crew</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={labelStyle}>Color fondo</label>
              <input type="color" value={editing.bg_color} onChange={e => setEditing(p => ({ ...p, bg_color: e.target.value }))} style={{ ...inputFull, padding: '3px', height: '38px' }} />
            </div>
            <div>
              <label style={labelStyle}>Color texto</label>
              <input type="color" value={editing.text_color} onChange={e => setEditing(p => ({ ...p, text_color: e.target.value }))} style={{ ...inputFull, padding: '3px', height: '38px' }} />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Preview avatar</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: editing.bg_color, color: editing.text_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>{editing.initials || '?'}</div>
              <span style={{ fontSize: '13px', color: C.t1 }}>{editing.name || 'Nombre'}</span>
            </div>
          </div>
          <LabeledInput label="auth_user_id (UUID Supabase Auth)" value={editing.auth_user_id} onChange={e => setEditing(p => ({ ...p, auth_user_id: e.target.value }))} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" style={{ marginBottom: '12px', fontFamily: 'monospace', fontSize: '11px' }} />
          <FormActions onSave={() => save(editing)} onCancel={() => setEditing(null)} saving={saving} />
        </div>
      )}
      {members.map(m => (
        <div key={m.id} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: m.bg_color, color: m.text_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
            {m.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: C.t1 }}>{m.name}</div>
            <div style={{ fontSize: '11px', color: C.t2, marginTop: '2px' }}>{m.role}</div>
            {m.auth_user_id && <div style={{ fontSize: '9px', color: C.t3, marginTop: '2px', fontFamily: 'monospace' }}>🔗 {m.auth_user_id.slice(0, 18)}…</div>}
          </div>
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '99px', fontWeight: '600', background: m.type === 'admin' ? C.redS : m.type === 'banda' ? C.pinkS : C.blueS, color: m.type === 'admin' ? C.red : m.type === 'banda' ? C.pink : C.blue }}>
            {m.type}
          </span>
          <Ico onClick={() => setEditing(m)}>✎</Ico>
          <Ico onClick={() => del(m.id)} red>✕</Ico>
        </div>
      ))}
    </div>
  )
}

// ── Shared Components ────────────────────────────────────────

function Card({ title, children }) {
  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: '12px', marginBottom: '14px', overflow: 'hidden' }}>
      {title && <div style={{ padding: '10px 14px 0', fontSize: '10px', fontWeight: '700', color: C.t3, letterSpacing: '.1em', textTransform: 'uppercase' }}>{title}</div>}
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: '0.5px', background: C.border, margin: '0 14px' }} />
}

function FieldRow({ label, children, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: last ? 'none' : `0.5px solid ${C.border}`, gap: '12px' }}>
      <span style={{ fontSize: '12px', color: C.t2, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>{children}</div>
    </div>
  )
}

function ToggleGroup({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${value === o.v ? C.red : C.border2}`, background: value === o.v ? C.redS : C.bg3, color: value === o.v ? C.t1 : C.t2, fontSize: '12px', fontWeight: value === o.v ? '600' : '400', cursor: 'pointer', transition: 'all .15s', fontFamily: '-apple-system, sans-serif' }}>
          {o.l}
        </button>
      ))}
    </div>
  )
}

function StatusPill({ complete }) {
  return (
    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', fontWeight: '600', background: complete ? C.greenS : C.amberS, color: complete ? C.green : C.amber }}>
      {complete ? 'Completo' : 'En proceso'}
    </span>
  )
}

function ListHeader({ count, onAdd }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <span style={{ fontSize: '12px', color: C.t2 }}>{count}</span>
      <PrimaryBtn onClick={onAdd}>+ Añadir</PrimaryBtn>
    </div>
  )
}

function ItemRow({ left, children, onEdit, onDelete }) {
  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '11px 12px', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      {left}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      <Ico onClick={onEdit}>✎</Ico>
      <Ico onClick={onDelete} red>✕</Ico>
    </div>
  )
}

function LabeledInput({ label, value, onChange, placeholder, type = 'text', style }) {
  return (
    <div style={style}>
      {label && <label style={labelStyle}>{label}</label>}
      <input value={value ?? ''} onChange={onChange} placeholder={placeholder} type={type} style={inputFull} />
    </div>
  )
}

function FormActions({ onSave, onCancel, saving }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <PrimaryBtn onClick={onSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</PrimaryBtn>
      <GhostBtn2 onClick={onCancel}>Cancelar</GhostBtn2>
    </div>
  )
}

function NoShowNote() {
  return <div style={{ fontSize: '13px', color: C.t3, textAlign: 'center', padding: '30px 0' }}>Guarda primero la info del show para añadir contenido aquí.</div>
}

function Ico({ onClick, red, children }) {
  return <span onClick={onClick} style={{ fontSize: '15px', color: C.t3, cursor: 'pointer', padding: '2px 4px', flexShrink: 0 }}>{children}</span>
}

function PrimaryBtn({ onClick, disabled, children, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: C.red, border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', color: '#fff', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1, fontFamily: '-apple-system, sans-serif', transition: 'opacity .15s', ...style }}>
      {children}
    </button>
  )
}

function DangerBtn({ onClick, children }) {
  return <button onClick={onClick} style={{ background: C.redM, border: 'none', borderRadius: '7px', padding: '7px 12px', fontSize: '12px', fontWeight: '600', color: '#fcc', cursor: 'pointer', fontFamily: '-apple-system, sans-serif' }}>{children}</button>
}

function GhostBtn2({ onClick, children }) {
  return <button onClick={onClick} style={{ background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: '7px', padding: '7px 12px', fontSize: '12px', color: C.t2, cursor: 'pointer', fontFamily: '-apple-system, sans-serif' }}>{children}</button>
}

function NoShowNote2() { return null }

// ── Style constants ──────────────────────────────────────────

const inputBase = {
  background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: '8px',
  padding: '8px 10px', fontSize: '13px', color: C.t1, outline: 'none',
  fontFamily: '-apple-system, sans-serif',
}

const inputFull = { ...inputBase, width: '100%', boxSizing: 'border-box' }

const labelStyle = {
  display: 'block', fontSize: '10px', fontWeight: '600', color: C.t3,
  letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '5px',
}

const formCard = {
  background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: '12px',
  padding: '14px', marginBottom: '14px',
}

const ghostBtn = {
  background: 'none', border: `1px solid ${C.border}`, borderRadius: '7px',
  padding: '6px 12px', fontSize: '12px', color: C.t2, cursor: 'pointer',
  fontFamily: '-apple-system, sans-serif',
}

function uploadBtnStyle(bg) {
  return {
    background: bg, border: `1px solid ${C.border2}`, borderRadius: '9px',
    padding: '10px 14px', fontSize: '12px', fontWeight: '500', color: C.t1,
    textAlign: 'center', display: 'inline-block', fontFamily: '-apple-system, sans-serif',
  }
}
