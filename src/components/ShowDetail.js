import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const C = {
  bg0: '#0d1117', bg1: '#161d27', bg2: '#1d2636', bg3: '#243040',
  border: '#263044', border2: '#2e3a50',
  t1: '#eef2f7', t2: '#7a8fa8', t3: '#3d5068',
  red: '#E24B4A', redS: '#2a1020',
  blue: '#4a9eff', blueS: '#0d1e35',
  green: '#4fc87a', greenS: '#0a2218',
  amber: '#f0a500', amberS: '#1e1400',
}

const s = (styles) => ({ fontFamily: '-apple-system, sans-serif', ...styles })

export default function ShowDetail({ show, onBack }) {
  const { member } = useAuth()
  const [tab, setTab] = useState('horarios')
  const [schedule, setSchedule] = useState([])
  const [contacts, setContacts] = useState([])
  const [docs, setDocs] = useState([])
  const [tickets, setTickets] = useState([])
  const [guestList, setGuestList] = useState([])
  const [setlist, setSetlist] = useState([])
  const [members, setMembers] = useState([])
  const [riderOpen, setRiderOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('schedule_items').select('*').eq('show_id', show.id).order('sort_order'),
      supabase.from('show_contacts').select('*').eq('show_id', show.id).order('sort_order'),
      supabase.from('documents').select('*').eq('show_id', show.id).order('sort_order'),
      supabase.from('tickets').select('*, tour_members(*)').eq('show_id', show.id),
      supabase.from('guest_list').select('*').eq('show_id', show.id).order('sort_order'),
      supabase.from('setlist_items').select('*').eq('show_id', show.id).order('track_number'),
      supabase.from('tour_members').select('*'),
    ]).then(([sch, con, doc, tix, gl, sl, mem]) => {
      setSchedule(sch.data || [])
      setContacts(con.data || [])
      setDocs(doc.data || [])
      setTickets(tix.data || [])
      setGuestList(gl.data || [])
      setSetlist(sl.data || [])
      setMembers(mem.data || [])
      setLoading(false)
    })
  }, [show.id])

  // Filtrar horarios según quién es el usuario
  const visibleSchedule = schedule.filter(item =>
    !item.visible_to || item.visible_to.length === 0 || item.visible_to.includes(member?.id)
  )

  // Billetes: banda solo ve el suyo, crew/admin ve todos
  const visibleTickets = member?.type === 'banda'
    ? tickets.filter(t => t.member_id === member?.id)
    : tickets

  async function downloadDoc(doc) {
    if (!doc.storage_path) return
    const { data } = await supabase.storage.from('tour-docs').createSignedUrl(doc.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const riderDocs = docs.filter(d => d.is_rider_doc)
  const allDocs = docs

  const TABS = ['horarios', 'hotel', 'contactos', 'guest list', 'setlist', 'docs']

  return (
    <div style={s({ background: C.bg0, minHeight: '100dvh' })}>

      {/* Back */}
      <div onClick={onBack} style={s({ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', background: C.bg1, borderBottom: `0.5px solid ${C.border}`, cursor: 'pointer' })}>
        <span style={{ fontSize: '17px', color: C.red }}>‹</span>
        <span style={s({ fontSize: '14px', color: C.t1 })}>Fechas</span>
      </div>

      {/* Hero */}
      <div style={s({ background: C.bg1, padding: '14px', borderBottom: `0.5px solid ${C.border}` })}>
        <div style={s({ fontSize: '17px', fontWeight: '500', color: C.t1 })}>{show.title}</div>
        <div style={s({ fontSize: '12px', color: C.t2, marginTop: '3px' })}>{show.day} {show.month} · {show.city}</div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
          {show.status === 'next' && <Badge bg={C.redS} color="#ee0088">Próximo</Badge>}
          {show.info_status === 'complete' && <Badge bg={C.greenS} color={C.green}>Info completa</Badge>}
          {show.info_status === 'wip' && <Badge bg={C.amberS} color={C.amber}>En proceso</Badge>}
        </div>
      </div>

      {/* Ficha del show */}
      <div style={s({ background: C.bg1, borderBottom: `0.5px solid ${C.border}`, padding: '14px' })}>
        <div style={s({ fontSize: '10px', fontWeight: '500', color: C.t2, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '10px' })}>Ficha del show</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <FichaCell label="Tiempo de show" value={show.show_duration} />
          <FichaCell label="Pantalla" value={show.pantalla_val} sub={show.pantalla_res} />
          <FichaCell label="Realización" value={show.realizacion} />
          <div
            style={s({ background: C.bg2, borderRadius: '8px', padding: '10px', cursor: riderDocs.length ? 'pointer' : 'default' })}
            onClick={() => riderDocs.length && setRiderOpen(o => !o)}
          >
            <div style={s({ fontSize: '10px', color: C.t3, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: '4px' })}>Rider / Docs</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={s({ fontSize: '13px', fontWeight: '500', color: C.t1 })}>
                {riderDocs.length ? `${riderDocs.length} archivos` : 'Sin archivos'}
              </div>
              {riderDocs.length > 0 && (
                <span style={{ fontSize: '14px', color: C.t2, transition: 'transform .2s', transform: riderOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>⌄</span>
              )}
            </div>
            {riderOpen && (
              <div style={{ marginTop: '8px', borderTop: `0.5px solid ${C.border}`, paddingTop: '6px' }}>
                {riderDocs.map(d => <DocRow key={d.id} doc={d} onDownload={downloadDoc} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notas */}
      <div style={s({ background: C.bg1, borderBottom: `0.5px solid ${C.border}`, padding: '14px' })}>
        <div style={s({ fontSize: '10px', fontWeight: '500', color: C.t2, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '8px' })}>Notas</div>
        {show.notas
          ? <div style={s({ fontSize: '13px', color: C.t1, lineHeight: '1.75', whiteSpace: 'pre-line' })}>{show.notas}</div>
          : <div style={s({ fontSize: '13px', color: C.t3 })}>Sin notas</div>
        }
      </div>

      {/* Billetes */}
      <div style={s({ background: C.bg1, borderBottom: `0.5px solid ${C.border}`, padding: '14px' })}>
        <div style={s({ fontSize: '10px', fontWeight: '500', color: C.t2, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '10px' })}>Billetes / Transporte</div>
        {loading ? <Placeholder /> :
          !visibleTickets.length
            ? <div style={s({ fontSize: '12px', color: C.t3 })}>Sin billetes añadidos</div>
            : visibleTickets.map(t => <TicketRow key={t.id} ticket={t} onDownload={downloadDoc} />)
        }
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', background: C.bg1, borderBottom: `0.5px solid ${C.border}` }}>
        {TABS.map(t => (
          <div key={t} onClick={() => setTab(t)} style={s({
            flexShrink: 0, padding: '9px 13px', fontSize: '12px',
            color: tab === t ? C.red : C.t2, cursor: 'pointer',
            borderBottom: `2px solid ${tab === t ? C.red : 'transparent'}`,
            whiteSpace: 'nowrap', textTransform: 'capitalize'
          })}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '12px 14px' }}>
        {loading ? <Placeholder /> : <>
          {tab === 'horarios' && <TabHorarios items={visibleSchedule} member={member} />}
          {tab === 'hotel' && <TabHotel show={show} />}
          {tab === 'contactos' && <TabContactos contacts={contacts} />}
          {tab === 'guest list' && <TabGL items={guestList} />}
          {tab === 'setlist' && <TabSetlist items={setlist} />}
          {tab === 'docs' && <TabDocs docs={allDocs} onDownload={downloadDoc} />}
        </>}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────

function Badge({ bg, color, children }) {
  return <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '99px', fontWeight: '500', background: bg, color }}>{children}</span>
}

function FichaCell({ label, value, sub }) {
  const isYes = value === 'Sí'
  const isNo = value === 'No'
  const isEmpty = value === '—' || !value
  return (
    <div style={s({ background: '#1d2636', borderRadius: '8px', padding: '10px' })}>
      <div style={s({ fontSize: '10px', color: '#3d5068', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: '4px' })}>{label}</div>
      <div style={s({ fontSize: '14px', fontWeight: '500', color: isYes ? '#4fc87a' : isNo ? '#7a8fa8' : isEmpty ? '#3d5068' : '#eef2f7', fontStyle: isEmpty ? 'italic' : 'normal' })}>
        {isEmpty ? 'Sin dato' : value}
      </div>
      {sub && <div style={s({ fontSize: '11px', color: '#7a8fa8', marginTop: '2px' })}>{sub}</div>}
    </div>
  )
}

function DocRow({ doc, onDownload }) {
  const icons = { pdf: '📄', img: '🖼️', txt: '📝' }
  const colors = { pdf: { bg: '#2a1020', color: '#E24B4A' }, img: { bg: '#0d1e35', color: '#4a9eff' }, txt: { bg: '#243040', color: '#7a8fa8' } }
  const c = colors[doc.file_type] || colors.pdf
  return (
    <div onClick={() => onDownload(doc)} style={s({ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', cursor: 'pointer' })}>
      <div style={{ width: '26px', height: '26px', borderRadius: '5px', background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>
        {icons[doc.file_type]}
      </div>
      <div style={s({ flex: 1, fontSize: '12px', fontWeight: '500', color: '#eef2f7' })}>{doc.name}</div>
      <span style={{ fontSize: '14px', color: '#3d5068' }}>⬇</span>
    </div>
  )
}

function TicketRow({ ticket, onDownload }) {
  const m = ticket.tour_members
  const typeLabel = { van: 'Furgoneta', train: 'Tren', fly: 'Vuelo' }
  const typeBg = { van: '#243040', train: '#1e1400', fly: '#0d1e35' }
  const typeCol = { van: '#7a8fa8', train: '#f0a500', fly: '#4a9eff' }
  return (
    <div style={s({ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `0.5px solid #263044` })}>
      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: m?.bg_color || '#243040', color: m?.text_color || '#7a8fa8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '500', flexShrink: 0 }}>
        {m?.initials || '?'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={s({ fontSize: '13px', fontWeight: '500', color: '#eef2f7' })}>{m?.name || '—'}</div>
        <div style={s({ fontSize: '11px', color: '#7a8fa8', marginTop: '1px' })}>{ticket.detail}</div>
        {ticket.file_name && (
          <div onClick={() => onDownload(ticket)} style={s({ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#4a9eff', marginTop: '3px', cursor: 'pointer' })}>
            ⬇ {ticket.file_name}
          </div>
        )}
      </div>
      <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '99px', background: typeBg[ticket.transport_type] || '#243040', color: typeCol[ticket.transport_type] || '#7a8fa8' }}>
        {typeLabel[ticket.transport_type] || ticket.transport_type}
      </span>
    </div>
  )
}

function TabHorarios({ items }) {
  if (!items.length) return <div style={s({ fontSize: '13px', color: '#3d5068', padding: '8px 0' })}>Sin horarios asignados</div>
  const dotColor = { show: '#E24B4A', sound: '#4fc87a', travel: '#4a9eff' }
  return (
    <div>
      {items.map(item => (
        <div key={item.id} style={{ padding: '10px 0', borderBottom: `0.5px solid #263044` }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ width: '54px', flexShrink: 0 }}>
              <div style={s({ fontSize: '13px', fontWeight: '500', fontVariantNumeric: 'tabular-nums', color: '#eef2f7' })}>{item.time_start}</div>
              {item.time_end && <div style={s({ fontSize: '10px', color: '#3d5068' })}>{item.time_end}</div>}
            </div>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: dotColor[item.type] || '#2e3a50', marginTop: '5px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={s({ fontSize: '13px', fontWeight: '500', color: '#eef2f7' })}>{item.title}</div>
              {item.subtitle && <div style={s({ fontSize: '11px', color: '#7a8fa8', marginTop: '2px', lineHeight: '1.5' })}>{item.subtitle}</div>}
              {item.extra_lines && item.extra_lines.length > 0 && (
                <div style={{ marginTop: '6px', background: '#1d2636', borderRadius: '8px', padding: '8px 10px' }}>
                  {item.extra_lines.map((line, i) => (
                    <div key={i} style={s({ fontSize: '11px', color: '#7a8fa8', padding: '2px 0', borderBottom: i < item.extra_lines.length - 1 ? `0.5px solid #263044` : 'none', lineHeight: '1.5' })}>
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TabHotel({ show }) {
  return (
    <>
      <ICard>
        <ICardHeader>Hotel</ICardHeader>
        <IRow label="Nombre" value={show.hotel_name || '—'} />
        <IRow label="Dirección" value={show.hotel_address || '—'} />
        <IRow label="Check-in" value={show.hotel_checkin || '—'} />
        <IRow label="Check-out" value={show.hotel_checkout || '—'} />
        <IRow label="Teléfono" value={show.hotel_tel || '—'} link={show.hotel_tel} last />
      </ICard>
      {show.hotel_habitaciones && (
        <ICard>
          <ICardHeader>Habitaciones</ICardHeader>
          <div style={s({ padding: '10px 12px', fontSize: '13px', lineHeight: '1.8', whiteSpace: 'pre-line', color: '#eef2f7' })}>
            {show.hotel_habitaciones}
          </div>
        </ICard>
      )}
    </>
  )
}

function TabContactos({ contacts }) {
  if (!contacts.length) return <Empty text="Sin contactos" />
  return (
    <ICard>
      {contacts.map((c, i) => (
        <IRow key={c.id} label={<><span>{c.name}</span><br /><span style={{ fontSize: '10px', color: '#3d5068' }}>{c.role}</span></>} value={c.phone} link={c.phone} last={i === contacts.length - 1} />
      ))}
    </ICard>
  )
}

function TabGL({ items }) {
  if (!items.length) return <Empty text="Sin guest list" />
  const total = items.reduce((a, b) => a + b.quantity, 0)
  const catBg = { m: '#2a1020', p: '#1e1400', f: '#0a2218', i: '#0d1e35' }
  const catCol = { m: '#ee0088', p: '#f0a500', f: '#4fc87a', i: '#4a9eff' }
  const catLbl = { m: 'Mgmt', p: 'Prensa', f: 'Familia', i: 'Industria' }
  return (
    <>
      <div style={s({ fontSize: '11px', color: '#7a8fa8', marginBottom: '8px' })}>{total} pases</div>
      <ICard>
        {items.map((g, i) => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: i < items.length - 1 ? `0.5px solid #263044` : 'none' }}>
            <span style={s({ flex: 1, fontSize: '13px', color: '#eef2f7' })}>{g.name}</span>
            <span style={s({ fontSize: '13px', fontWeight: '500', color: '#eef2f7', width: '18px', textAlign: 'center' })}>{g.quantity}</span>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '99px', background: catBg[g.category] || '#243040', color: catCol[g.category] || '#7a8fa8' }}>
              {catLbl[g.category] || g.category}
            </span>
          </div>
        ))}
      </ICard>
    </>
  )
}

function TabSetlist({ items }) {
  if (!items.length) return <Empty text="Sin setlist" />
  let total = 0
  items.forEach(t => { const [m, s] = t.duration.split(':').map(Number); total += (m || 0) * 60 + (s || 0) })
  return (
    <ICard>
      {items.map((t, i) => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: i < items.length - 1 ? `0.5px solid #263044` : 'none' }}>
          <span style={s({ width: '18px', fontSize: '11px', color: '#3d5068', textAlign: 'center' })}>{t.track_number}</span>
          <div style={{ flex: 1 }}>
            <div style={s({ fontSize: '13px', fontWeight: '500', color: '#eef2f7' })}>{t.title}</div>
            {t.note && <div style={s({ fontSize: '10px', color: '#4a9eff', marginTop: '1px' })}>{t.note}</div>}
          </div>
          <span style={s({ fontSize: '11px', color: '#7a8fa8' })}>{t.duration}</span>
        </div>
      ))}
      <div style={s({ textAlign: 'right', fontSize: '11px', color: '#7a8fa8', padding: '7px 12px' })}>
        {Math.floor(total / 60)}m {total % 60}s total
      </div>
    </ICard>
  )
}

function TabDocs({ docs, onDownload }) {
  if (!docs.length) return <Empty text="Sin documentos" />
  return (
    <ICard>
      <div style={{ padding: '0 12px' }}>
        {docs.map(d => <DocRow key={d.id} doc={d} onDownload={onDownload} />)}
      </div>
    </ICard>
  )
}

// ── Shared UI ─────────────────────────────────────────────

function ICard({ children }) {
  return <div style={{ background: '#161d27', border: `0.5px solid #263044`, borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>{children}</div>
}

function ICardHeader({ children }) {
  return <div style={s({ padding: '9px 12px', borderBottom: `0.5px solid #263044`, fontSize: '10px', fontWeight: '500', color: '#7a8fa8', letterSpacing: '.06em', textTransform: 'uppercase' })}>{children}</div>
}

function IRow({ label, value, link, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 12px', borderBottom: last ? 'none' : `0.5px solid #263044`, gap: '8px' }}>
      <span style={s({ fontSize: '12px', color: '#7a8fa8', flexShrink: 0 })}>{label}</span>
      <span style={s({ fontSize: '12px', fontWeight: '500', textAlign: 'right', color: link ? '#4a9eff' : '#eef2f7' })}>
        {link ? <a href={`tel:${link}`} style={{ color: '#4a9eff', textDecoration: 'none' }}>{value}</a> : value}
      </span>
    </div>
  )
}

function Empty({ text }) {
  return <div style={s({ fontSize: '13px', color: '#3d5068', padding: '8px 0' })}>{text}</div>
}

function Placeholder() {
  return <div style={s({ fontSize: '13px', color: '#3d5068', padding: '20px 0', textAlign: 'center' })}>Cargando...</div>
}
