'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const SYS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"

const fieldStyle: React.CSSProperties = {
  width: '100%', height: 52, background: '#A99F49', border: 'none',
  borderRadius: 14, padding: '0 16px', fontSize: 16, fontFamily: SYS,
  color: '#1a1a1a', outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: '#888', marginBottom: 6,
  fontFamily: SYS, display: 'block',
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!email || !password) return
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Usuario o contraseña incorrectos'); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F5EF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 28px', fontFamily: SYS }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Tour Pilot" height={48} style={{ display: 'block', margin: '0 auto 36px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onKeyDown={e => e.key === 'Enter' && submit()}>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" autoComplete="email"
              style={{ ...fieldStyle, caretColor: '#1a1a1a' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••" autoComplete="current-password"
              style={{ ...fieldStyle, caretColor: '#1a1a1a' }}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: '#DC412C', margin: 0 }}>{error}</p>}

          <button
            onClick={submit} disabled={loading}
            style={{
              width: '100%', height: 52, background: '#1a1a1a', border: 'none',
              borderRadius: 14, fontSize: 16, fontWeight: 600, color: '#fff',
              cursor: 'pointer', fontFamily: SYS, marginTop: 20,
              opacity: loading ? 0.6 : 1,
            }}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>

          <p style={{ fontSize: 14, color: '#999', textAlign: 'center', margin: 0 }}>
            ¿Sin cuenta?{' '}
            <a href="/register" style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>Crear cuenta</a>
          </p>
        </div>
      </div>
    </div>
  )
}
