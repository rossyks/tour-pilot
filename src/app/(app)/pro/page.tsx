'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const SYS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"

const PRO_FEATURES = [
  { title: 'Shows ilimitados', desc: 'Sin límite de fechas por gira' },
  { title: 'Travel Days', desc: 'Añade días de viaje antes y después de cada concierto con su propio horario y billetes' },
  { title: 'Visibilidad por persona', desc: 'Controla quién ve cada billete y cada tramo del horario individualmente' },
  { title: 'Notificaciones al equipo', desc: 'Envía mensajes directamente a los miembros de tu gira por email' },
  { title: 'Tarjeta compartible', desc: 'Genera una tarjeta visual de tu gira para compartir en redes sociales' },
]

const FREE_FEATURES = [
  'Hasta 3 fechas por gira',
  'Horario, contactos, rider y documentos',
  'Compartir con tu equipo (banda, artistas, crew y admin)',
  'PDF del show',
  'Logo de banda',
  'Calendario de giras',
  'Historial de conciertos',
]

export default function ProPage() {
  const router = useRouter()
  const [showProximo, setShowProximo] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F2', fontFamily: SYS }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 500, color: '#1a1a1a', fontFamily: SYS }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Volver
        </button>
      </div>

      <div style={{ padding: '32px 20px 0', maxWidth: 480, margin: '0 auto' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <img src="/logo.svg" alt="Tour Pilot" height={28} style={{ display: 'block', margin: '0 auto' }} />
          <p style={{ fontSize: 32, fontWeight: 800, color: '#1a1a1a', margin: '20px 0 0', fontFamily: SYS }}>Tour Pilot Pro</p>
          <p style={{ fontSize: 16, color: '#999', margin: '8px 0 0', fontFamily: SYS, lineHeight: 1.5 }}>
            Todo lo que necesitas para gestionar tu gira profesionalmente
          </p>
        </div>

        {/* Precio */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 48, fontWeight: 800, color: '#1a1a1a', fontFamily: SYS, lineHeight: 1 }}>9,99€</span>
            <span style={{ fontSize: 16, color: '#999', fontFamily: SYS }}>/mes por gira</span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#A99F49', margin: '6px 0 0', fontFamily: SYS }}>
            o 89€/año · ahorras 2 meses
          </p>
          <button
            onClick={() => setShowProximo(true)}
            style={{ width: '100%', height: 52, background: '#1a1a1a', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: SYS, marginTop: 20 }}>
            {showProximo ? 'Próximamente 🚀' : 'Activar Pro'}
          </button>
        </div>

        {/* Features Pro */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', margin: '0 0 16px', fontFamily: SYS }}>Incluye</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PRO_FEATURES.map(f => (
              <div key={f.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1a1a1a', fontFamily: SYS }}>{f.title}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#999', fontFamily: SYS, lineHeight: 1.4 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features gratis */}
        <div style={{ background: '#F5F5F5', borderRadius: 16, padding: 24, marginTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', margin: '0 0 16px', fontFamily: SYS }}>Siempre gratis</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FREE_FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: '#BBBBBB', fontSize: 14, lineHeight: '20px', flexShrink: 0 }}>·</span>
                <span style={{ fontSize: 14, color: '#555', fontFamily: SYS, lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 13, color: '#999', textAlign: 'center', margin: '24px 0 40px', fontFamily: SYS }}>
          ¿Preguntas? <a href="mailto:hola@tourpilot.live" style={{ color: '#999', textDecoration: 'underline' }}>hola@tourpilot.live</a>
        </p>
      </div>
    </div>
  )
}
