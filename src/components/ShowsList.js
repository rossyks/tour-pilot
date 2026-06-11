import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function ShowsList({ onSelectShow }) {
  const { member, signOut } = useAuth()
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('shows')
      .select('*')
      .order('sort_order')
      .then(({ data }) => { setShows(data || []); setLoading(false) })
  }, [])

  const infoBadge = (s) => {
    if (s.info_status === 'complete') return <span style={badge('#0a1e14', '#4fc87a')}>Info completa</span>
    if (s.info_status === 'wip') return <span style={badge('#1e1400', '#f0a500')}>En proceso</span>
    return null
  }

  return (
    <div style={{ background: '#0d1117', minHeight: '100dvh', fontFamily: '-apple-system, sans-serif' }}>
      {/* Topbar */}
      <div style={{ background: '#161d27', borderBottom: '0.5px solid #263044', padding: '12px 14px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '15px', fontWeight: '500', letterSpacing: '.1em', color: '#eef2f7' }}>
          MALMÖ<span style={{ color: '#E24B4A' }}>040</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {member && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#1d2636', border: '0.5px solid #2e3a50', borderRadius: '99px', padding: '4px 10px 4px 5px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: member.bg_color, color: member.text_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '500' }}>
                {member.initials}
              </div>
              <span style={{ fontSize: '12px', color: '#eef2f7' }}>{member.name.split(' ')[0]}</span>
            </div>
          )}
          <button onClick={signOut} style={{ background: 'none', border: 'none', color: '#3d5068', fontSize: '12px', cursor: 'pointer', padding: '4px' }}>
            Salir
          </button>
        </div>
      </div>

      <div style={{ padding: '10px 14px 5px', fontSize: '10px', fontWeight: '500', color: '#3d5068', letterSpacing: '.08em', textTransform: 'uppercase' }}>
        Festivales 2026
      </div>

      {loading ? (
        <div style={{ padding: '40px 14px', textAlign: 'center', color: '#3d5068', fontSize: '13px' }}>Cargando...</div>
      ) : (
        shows.map(s => (
          <div key={s.id} onClick={() => onSelectShow(s)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderBottom: '0.5px solid #263044', cursor: 'pointer', background: '#0d1117' }}>
            <div style={{ width: '34px', flexShrink: 0, textAlign: 'center' }}>
              <div style={{ fontSize: '19px', fontWeight: '500', lineHeight: 1, color: '#eef2f7' }}>{s.day}</div>
              <div style={{ fontSize: '10px', color: '#7a8fa8', textTransform: 'uppercase', marginTop: '1px' }}>{s.month}</div>
              <div style={{ fontSize: '9px', color: '#3d5068' }}>{s.weekday}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#eef2f7' }}>{s.title}</div>
              <div style={{ fontSize: '12px', color: '#7a8fa8', marginTop: '1px' }}>{s.city}</div>
              <div style={{ display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
                {s.status === 'next' && <span style={badge('#2a1020', '#ee0088')}>Próximo</span>}
                {infoBadge(s)}
              </div>
            </div>
            <div style={{ color: '#3d5068', fontSize: '16px' }}>›</div>
          </div>
        ))
      )}
    </div>
  )
}

function badge(bg, color) {
  return { fontSize: '10px', padding: '2px 7px', borderRadius: '99px', fontWeight: '500', background: bg, color }
}
