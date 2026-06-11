import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

// Paleta de colores por defecto si no hay card_color asignado
const DEFAULT_COLORS = [
  '#7C6AF5', '#E87B5A', '#4A9EFF', '#3EC97A',
  '#F0A500', '#E24B4A', '#9B6BF5', '#4FC8C8',
  '#EE0088', '#6BAF92',
]

function getCardColor(show, index) {
  if (show.card_color) return show.card_color
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length]
}

function isLight(hex) {
  const c = hex.replace('#', '')
  const r = parseInt(c.substr(0,2),16)
  const g = parseInt(c.substr(2,2),16)
  const b = parseInt(c.substr(4,2),16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 140
}

export default function ShowsList({ onSelectShow }) {
  const { member, signOut } = useAuth()
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('shows').select('*').order('sort_order')
      .then(({ data }) => { setShows(data || []); setLoading(false) })
  }, [])

  return (
    <div style={{ background: '#0a0e14', minHeight: '100dvh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Topbar */}
      <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '.12em', color: '#f0f4f8' }}>
          MALMÖ<span style={{ color: '#E24B4A' }}>040</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {member && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#182030', border: '0.5px solid #253550', borderRadius: '99px', padding: '4px 10px 4px 5px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: member.bg_color, color: member.text_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' }}>
                {member.initials}
              </div>
              <span style={{ fontSize: '12px', color: '#f0f4f8', fontWeight: '500' }}>{member.name.split(' ')[0]}</span>
            </div>
          )}
          <button onClick={signOut} style={{ background: 'none', border: 'none', color: '#384d63', fontSize: '12px', cursor: 'pointer', padding: '4px' }}>
            Salir
          </button>
        </div>
      </div>

      {/* Subheader */}
      <div style={{ padding: '0 16px 14px', fontSize: '11px', fontWeight: '600', color: '#384d63', letterSpacing: '.1em', textTransform: 'uppercase' }}>
        Festivales 2026
      </div>

      {loading ? (
        <div style={{ padding: '60px 16px', textAlign: 'center', color: '#384d63', fontSize: '13px' }}>Cargando...</div>
      ) : (
        <div style={{ padding: '0 12px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {shows.map((s, i) => {
            const color = getCardColor(s, i)
            const light = isLight(color)
            const fg = light ? '#0a0e14' : '#ffffff'
            const fgSub = light ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.55)'
            const fgDim = light ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'

            return (
              <div
                key={s.id}
                onClick={() => onSelectShow(s)}
                style={{
                  background: color,
                  borderRadius: '18px',
                  padding: '20px 20px 18px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '130px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                {/* Top row: weekday + status badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: fgSub, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                    {s.weekday} · {s.month}
                  </span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {s.status === 'next' && (
                      <span style={{ fontSize: '10px', fontWeight: '700', color: fg, background: light ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)', borderRadius: '99px', padding: '3px 9px', letterSpacing: '.04em' }}>
                        ⚡ PRÓXIMO
                      </span>
                    )}
                    {s.info_status === 'complete' && (
                      <span style={{ fontSize: '10px', fontWeight: '700', color: fg, background: light ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)', borderRadius: '99px', padding: '3px 9px' }}>
                        ✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Main content: day number + title */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: fg, lineHeight: 1.15, marginBottom: '4px' }}>
                      {s.title.split(' / ').map((part, pi) => (
                        <span key={pi}>{pi > 0 && <span style={{ color: fgSub }}> / </span>}{part}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: '12px', color: fgSub, fontWeight: '500' }}>{s.city}</div>
                  </div>
                  {/* Big day number */}
                  <div style={{ fontSize: '64px', fontWeight: '900', color: fgDim, lineHeight: 1, letterSpacing: '-3px', flexShrink: 0, marginBottom: '-4px' }}>
                    {s.day}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
