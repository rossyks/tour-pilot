'use client'

import { useState } from 'react'
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

const inlineError: React.CSSProperties = {
  fontSize: 13, color: '#DC412C', margin: '4px 0 0 0', fontFamily: SYS,
}

function FieldError({ msg }: { msg: string | null }) {
  if (!msg) return null
  return <p style={inlineError}>{msg}</p>
}

export default function RegisterPage() {
  const supabase = createClient()
  const [form, setForm] = useState({ email: '', password: '', full_name: '', username: '' })
  const [errors, setErrors] = useState<{ email?: string; username?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined, general: undefined }))
  }

  function sanitizeUsername(val: string) {
    return val.toLowerCase().replace(/[^a-z0-9_]/g, '')
  }

  function validateUsername(val: string): string | null {
    if (val.length < 3) return 'El username debe tener al menos 3 caracteres'
    if (val.length > 20) return 'El username debe tener máximo 20 caracteres'
    if (/[^a-z0-9_]/.test(val)) return 'El username solo puede contener letras, números y _'
    return null
  }

  async function submit() {
    const { email, password, full_name, username } = form
    const trimmedUsername = username.toLowerCase().trim()

    const newErrors: typeof errors = {}

    if (!email || !password || !full_name || !username) {
      newErrors.general = 'Todos los campos son obligatorios'
      setErrors(newErrors); return
    }
    if (password.length < 6) {
      newErrors.general = 'La contraseña debe tener al menos 6 caracteres'
      setErrors(newErrors); return
    }

    const usernameError = validateUsername(trimmedUsername)
    if (usernameError) {
      setErrors({ username: usernameError }); return
    }

    setErrors({})
    setLoading(true)

    // Check username availability
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', trimmedUsername)
      .maybeSingle()

    if (existingUser) {
      setErrors({ username: 'Este username ya está en uso' })
      setLoading(false); return
    }

    // Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      const msg = signUpError.message ?? ''
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
        setErrors({ email: 'Este email ya está registrado. ¿Quieres iniciar sesión?' })
      } else {
        setErrors({ general: 'Error al crear la cuenta. Inténtalo de nuevo.' })
      }
      setLoading(false); return
    }

    if (!data.user) {
      setErrors({ general: 'Error al crear la cuenta. Inténtalo de nuevo.' })
      setLoading(false); return
    }

    // Save profile
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name,
      username: trimmedUsername,
    })

    if (profileError) {
      setErrors({ general: 'Cuenta creada pero hubo un error al guardar el perfil. Contacta con soporte.' })
      setLoading(false); return
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F5EF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', fontFamily: SYS }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Tour Pilot" height={48} style={{ display: 'block', marginBottom: 36 }} />
        <p style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: '0 0 10px', textAlign: 'center' }}>Revisa tu email</p>
        <p style={{ fontSize: 14, color: '#888', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
          Te hemos enviado un link de confirmación a<br/>
          <span style={{ color: '#1a1a1a', fontWeight: 600 }}>{form.email}</span>
        </p>
        <p style={{ fontSize: 13, color: '#AAAAAA', marginTop: 8, textAlign: 'center' }}>
          Una vez confirmado podrás iniciar sesión
        </p>
        <a href="/login" style={{ color: '#1a1a1a', fontSize: 14, fontWeight: 600, marginTop: 32, textDecoration: 'none' }}>
          Volver al login
        </a>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F5EF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 28px', fontFamily: SYS }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Tour Pilot" height={48} style={{ display: 'block', margin: '0 auto 36px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onKeyDown={e => e.key === 'Enter' && submit()}>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="tu@email.com" autoComplete="email"
              style={{ ...fieldStyle, ...(errors.email ? { outline: '2px solid #DC412C' } : {}) }} />
            {errors.email && (
              <p style={inlineError}>
                {errors.email}{' '}
                {errors.email.includes('iniciar sesión') && (
                  <a href="/login" style={{ color: '#DC412C', fontWeight: 700 }}>Iniciar sesión</a>
                )}
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Contraseña</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
              placeholder="••••••••••" autoComplete="new-password" style={fieldStyle} />
          </div>

          <div>
            <label style={labelStyle}>Nombre completo</label>
            <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
              placeholder="Tu nombre" autoComplete="name" style={fieldStyle} />
          </div>

          <div>
            <label style={labelStyle}>Username</label>
            <input type="text" value={form.username}
              onChange={e => set('username', sanitizeUsername(e.target.value))}
              placeholder="@tunombre" autoComplete="username"
              style={{ ...fieldStyle, ...(errors.username ? { outline: '2px solid #DC412C' } : {}) }} />
            <FieldError msg={errors.username ?? null} />
          </div>

          {errors.general && <p style={{ ...inlineError, marginTop: 0 }}>{errors.general}</p>}

          <button
            onClick={submit} disabled={loading}
            style={{
              width: '100%', height: 52, background: '#1a1a1a', border: 'none',
              borderRadius: 14, fontSize: 16, fontWeight: 600, color: '#fff',
              cursor: 'pointer', fontFamily: SYS, marginTop: 20,
              opacity: loading ? 0.6 : 1,
            }}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>

          <p style={{ fontSize: 14, color: '#999', textAlign: 'center', margin: 0 }}>
            ¿Ya tienes cuenta?{' '}
            <a href="/login" style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>Entrar</a>
          </p>
        </div>
      </div>
    </div>
  )
}
