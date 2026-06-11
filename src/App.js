import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Login from './components/Login'
import ShowsList from './components/ShowsList'
import ShowDetail from './components/ShowDetail'
import Admin from './components/Admin'

function AppInner() {
  const { user, member, loading } = useAuth()
  console.log('user:', user, 'member:', member, 'loading:', loading)
  const [selectedShow, setSelectedShow] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)

  if (loading) {
    return (
      <div style={{ background: '#0d1117', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#3d5068', fontSize: '13px', fontFamily: '-apple-system, sans-serif' }}>Cargando...</div>
      </div>
    )
  }

  if (!user) return <Login />

  if (showAdmin && member?.type === 'admin') {
    return <Admin onBack={() => setShowAdmin(false)} />
  }

  if (selectedShow) {
    return <ShowDetail show={selectedShow} onBack={() => setSelectedShow(null)} />
  }

  return (
    <div>
      <ShowsList onSelectShow={setSelectedShow} />
      {user && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
          <button
            onClick={() => setShowAdmin(true)}
            style={{
              background: '#E24B4A',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              fontSize: '20px',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(226,75,74,0.4)',
              fontFamily: '-apple-system, sans-serif'
            }}
          >
            ⚙
          </button>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
