'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const SYS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
const DURATION = 2500

export default function WelcomeClient({ name }: { name: string | null }) {
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => router.replace('/dashboard'), DURATION)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div style={{
      height: '100dvh', background: '#F7F5EF', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 28px', fontFamily: SYS,
    }}>
      {/* Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="Tour Pilot" height={36} style={{ display: 'block', marginBottom: 32 }} />

      {/* Check circle — animado */}
      <div className="tp-check-pop" style={{
        width: 64, height: 64, borderRadius: '50%', background: '#1a1a1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <p style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: '0 0 6px', textAlign: 'center' }}>
        Email confirmado
      </p>
      <p style={{ fontSize: 14, color: '#999', margin: 0, textAlign: 'center' }}>
        Bienvenido a Tour Pilot{name ? `, ${name.split(' ')[0]}` : ''}
      </p>

      {/* Progress bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 3, background: '#E8E6E0',
      }}>
        <div
          style={{
            height: '100%', background: '#A4B2DA',
            animation: `tp-progress ${DURATION}ms linear both`,
          }}
        />
      </div>
    </div>
  )
}
