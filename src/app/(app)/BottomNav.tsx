'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SYS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"

export default function BottomNav() {
  const path = usePathname()
  const isGiras = !path.startsWith('/profile')
  const isPerfil = path.startsWith('/profile')

  const active = '#1a1a1a'
  const inactive = '#CCCCCC'

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
      background: '#FFFFFF', borderTop: '0.5px solid #EEECE8',
      height: 'calc(60px + env(safe-area-inset-bottom))',
      paddingBottom: 'env(safe-area-inset-bottom)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      gap: 0,
    }}>

      {/* Giras */}
      <Link href="/dashboard" style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 60, gap: 4 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isGiras ? active : inactive} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        <span style={{ fontSize: 10, fontWeight: 600, color: isGiras ? active : inactive, fontFamily: SYS, letterSpacing: '0.02em' }}>Giras</span>
      </Link>

      {/* Perfil */}
      <Link href="/profile" style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 60, gap: 4 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isPerfil ? active : inactive} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/>
        </svg>
        <span style={{ fontSize: 10, fontWeight: 600, color: isPerfil ? active : inactive, fontFamily: SYS, letterSpacing: '0.02em' }}>Perfil</span>
      </Link>

    </div>
  )
}
