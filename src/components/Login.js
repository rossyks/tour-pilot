import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) setError('Email o contraseña incorrectos')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0d1117',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '-apple-system, sans-serif'
    }}>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '22px', fontWeight: '500', letterSpacing: '.1em', color: '#eef2f7' }}>
          MALMÖ<span style={{ color: '#E24B4A' }}>040</span>
        </div>
        <div style={{ fontSize: '12px', color: '#3d5068', marginTop: '6px', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          Tour Hub
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '320px' }}>
        <div style={{ marginBottom: '12px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              background: '#161d27',
              border: '0.5px solid #263044',
              borderRadius: '8px',
              padding: '13px 14px',
              fontSize: '14px',
              color: '#eef2f7',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              background: '#161d27',
              border: '0.5px solid #263044',
              borderRadius: '8px',
              padding: '13px 14px',
              fontSize: '14px',
              color: '#eef2f7',
              outline: 'none',
            }}
          />
        </div>
        {error && (
          <div style={{ fontSize: '13px', color: '#E24B4A', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            background: '#E24B4A',
            border: 'none',
            borderRadius: '8px',
            padding: '13px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#fff',
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
