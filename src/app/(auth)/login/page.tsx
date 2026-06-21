'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const SYS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
const MUSTARD = '#A99F49'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null)

  async function submit() {
    if (!email || !password) return
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Usuario o contraseña incorrectos'); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  const inputStyle = (field: 'email' | 'password'): React.CSSProperties => ({
    width: '100%', height: 44, background: 'transparent',
    border: 'none', borderBottom: `1.5px solid ${focusedField === field ? MUSTARD : '#E0E0E0'}`,
    padding: '0 2px', fontSize: 14, fontFamily: SYS,
    color: '#1a1a1a', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s ease', borderRadius: 0,
    caretColor: MUSTARD,
  })

  return (
    <div style={{
      minHeight: '100vh', background: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 32px', fontFamily: SYS,
    }}>
      <div style={{ width: '100%', maxWidth: 320 }}>

        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Tour Pilot" height={22} style={{ display: 'block', marginBottom: 48 }} />

        {/* Headline */}
        <p style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: '0 0 6px', fontFamily: SYS, lineHeight: 1.2 }}>
          Bienvenido de nuevo
        </p>
        <p style={{ fontSize: 13, color: '#999', margin: '0 0 36px', fontFamily: SYS }}>
          Accede a tu cuenta para continuar
        </p>

        {/* Form */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          onKeyDown={e => e.key === 'Enter' && submit()}
        >
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#AAAAAA', fontFamily: SYS, display: 'block', marginBottom: 8 }}>
              Email
            </label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="tu@email.com"
              autoComplete="email"
              style={inputStyle('email')}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#AAAAAA', fontFamily: SYS, display: 'block', marginBottom: 8 }}>
              Contraseña
            </label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={inputStyle('password')}
            />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: '#DC412C', margin: 0, fontFamily: SYS }}>{error}</p>
          )}

          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: '100%', height: 46, background: '#1a1a1a', border: 'none',
              borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff',
              cursor: loading ? 'default' : 'pointer', fontFamily: SYS,
              opacity: loading ? 0.5 : 1, marginTop: 8,
              letterSpacing: '0.02em', transition: 'opacity 0.2s',
            }}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 11, color: '#CCCCCC', textAlign: 'center', margin: '40px 0 0', fontFamily: SYS, letterSpacing: '0.02em' }}>
          Tour Pilot · Uso interno
        </p>
      </div>
    </div>
  )
}
