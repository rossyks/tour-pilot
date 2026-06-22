'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const SYS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"

const PRO_FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A99F49" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
      </svg>
    ),
    title: 'Shows ilimitados',
    desc: 'Sin límite de fechas por gira',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A99F49" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l4-8 4 4 4-6 4 10"/><path d="M3 21h18"/>
      </svg>
    ),
    title: 'Travel Days',
    desc: 'Días de viaje con horario y billetes propios',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A99F49" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    title: 'Visibilidad por persona',
    desc: 'Controla quién ve cada billete y tramo del horario',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A99F49" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    title: 'Notificaciones al equipo',
    desc: 'Mensajes directos por email a tu equipo',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A99F49" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
      </svg>
    ),
    title: 'Tarjeta compartible',
    desc: 'Genera una tarjeta visual de tu gira para redes',
  },
]

const FREE_ITEMS = [
  '3 fechas por gira',
  'Horario completo',
  'Rider y docs',
  'Equipo ilimitado',
  'PDF del show',
  'Logo de banda',
]

export default function ProPage() {
  const router = useRouter()
  const [activated, setActivated] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: SYS, paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ padding: '16px 20px 0' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.6)', fontFamily: SYS }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Volver
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding: '40px 24px 32px' }}>
        <img src="/logo.svg" alt="Tour Pilot" height={24} style={{ display: 'block', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
        <span style={{ display: 'inline-block', marginTop: 20, background: '#A99F49', color: '#1a1a1a', fontSize: 11, fontWeight: 800, borderRadius: 6, padding: '4px 10px', letterSpacing: '0.05em', fontFamily: SYS }}>PRO</span>
        <p style={{ fontSize: 36, fontWeight: 800, color: '#ffffff', margin: '12px 0 0', lineHeight: 1.1, fontFamily: SYS }}>
          Gestiona tu gira<br />sin límites
        </p>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: '12px 0 0', lineHeight: 1.6, fontFamily: SYS }}>
          Todo lo que un profesional necesita, al precio de un café al mes.
        </p>
      </div>

      {/* Precio */}
      <div style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 64, fontWeight: 800, color: '#ffffff', lineHeight: 1, fontFamily: SYS }}>9,99€</span>
          <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginLeft: 8, fontFamily: SYS }}>/mes · por gira</span>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#A99F49', margin: '8px 0 0', fontFamily: SYS }}>
          o 89€/año — ahorras 20€
        </p>
        <button
          onClick={() => setActivated(true)}
          style={{
            width: '100%', height: 56, marginTop: 24, border: 'none', borderRadius: 14,
            background: activated ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #A4B2DA, #A99F49)',
            color: activated ? 'rgba(255,255,255,0.5)' : '#1a1a1a',
            fontSize: 17, fontWeight: 800, letterSpacing: '0.02em', cursor: 'pointer', fontFamily: SYS,
            transition: 'all 0.2s',
          }}>
          {activated ? 'Próximamente 🚀' : 'Activar Pro'}
        </button>
      </div>

      {/* Separador */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '40px 0' }} />

      {/* Features Pro */}
      <div style={{ padding: '0 24px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', margin: '0 0 24px', fontFamily: SYS }}>
          Qué incluye Pro
        </p>
        {PRO_FEATURES.map((f, i) => (
          <div key={f.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '20px 0', borderBottom: i < PRO_FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {f.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#ffffff', fontFamily: SYS }}>{f.title}</p>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: SYS, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Separador */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '40px 0' }} />

      {/* Siempre gratis */}
      <div style={{ padding: '0 24px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', margin: '0 0 16px', fontFamily: SYS }}>
          Siempre gratis
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {FREE_ITEMS.map(item => (
            <div key={item} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500, fontFamily: SYS }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 24, margin: '32px 24px 0' }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#ffffff', fontFamily: SYS }}>¿Tienes dudas?</p>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.4)', fontFamily: SYS }}>Escríbenos y te ayudamos.</p>
        <button
          onClick={() => window.location.href = 'mailto:hola@tourpilot.live'}
          style={{ width: '100%', height: 44, marginTop: 16, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: SYS }}>
          hola@tourpilot.live
        </button>
      </div>

    </div>
  )
}
