'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TOUR_COLORS } from '@/lib/types'

const SYS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase()
  }
  return email[0].toUpperCase()
}

const ROLE_LABEL: Record<string, string> = {
  owner: '♛ Owner', admin: 'Admin', band: 'Banda', artist: 'Artista', crew: 'Crew',
}
const ROLE_BG: Record<string, string> = {
  owner: '#1a1a1a', admin: '#333', band: '#A4B2DA', artist: '#A99F49', crew: '#DC412C',
}
const ROLE_TEXT: Record<string, string> = {
  owner: '#fff', admin: '#fff', band: '#1a1a1a', artist: '#1a1a1a', crew: '#fff',
}

interface Membership {
  role: string
  tours: { id: string; name: string; created_at?: string } | null
}

interface Profile {
  id: string
  full_name: string | null
  username: string | null
  band: string | null
  role: string | null
  avatar_url: string | null
}

export default function ProfileClient({
  email,
  profile,
  memberships,
  createdAt,
}: {
  email: string
  profile: Profile | null
  memberships: Membership[]
  createdAt: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)
  const [uploading, setUploading] = useState(false)
  const [resetMsg, setResetMsg] = useState<string | null>(null)

  const name = profile?.full_name ?? null
  const username = profile?.username ?? null
  const initials = getInitials(name, email)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile?.id) return
    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const filePath = `${profile.id}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true, contentType: file.type })
    if (uploadError) { setUploading(false); return }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', profile.id)
    setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`)
    setUploading(false)
  }

  async function handleResetPassword() {
    await supabase.auth.resetPasswordForEmail(email)
    setResetMsg('Te hemos enviado un email para cambiar tu contraseña')
    setTimeout(() => setResetMsg(null), 5000)
  }

  const rowStyle: React.CSSProperties = {
    height: 52, padding: '0 16px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '0.5px solid #F5F5F5',
  }

  return (
    <div className="tp-page" style={{ minHeight: '100vh', background: '#F5F4F2', maxWidth: 390, margin: '0 auto', paddingBottom: 100, fontFamily: SYS }}>

      {/* ── Header ── */}
      <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Tour Pilot" style={{ display: 'block', alignSelf: 'flex-start', height: 22, maxWidth: 110, marginBottom: 20 }} />

        {/* Avatar */}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
            background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: uploading ? 0.6 : 1, flexShrink: 0,
          }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={name ?? email} style={{ width: 80, height: 80, objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: SYS }}>{initials}</span>
            )}
          </div>
          <div style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 22, height: 22, borderRadius: '50%',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}>📷</div>
        </div>

        {/* Name */}
        <p style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: '12px 0 0', fontFamily: SYS, textAlign: 'center' }}>
          {name ?? email}
        </p>
        {username && (
          <p style={{ fontSize: 14, color: '#999', margin: '4px 0 0', fontFamily: SYS, textAlign: 'center' }}>
            @{username}
          </p>
        )}
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ── Info card ── */}
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', marginTop: 24 }}>
          <div style={rowStyle}>
            <span style={{ fontSize: 14, color: '#999', fontFamily: SYS }}>Email</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', fontFamily: SYS, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-all' }}>{email}</span>
          </div>
          {username && (
            <div style={rowStyle}>
              <span style={{ fontSize: 14, color: '#999', fontFamily: SYS }}>Usuario</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', fontFamily: SYS }}>@{username}</span>
            </div>
          )}
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <span style={{ fontSize: 14, color: '#999', fontFamily: SYS }}>Miembro desde</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', fontFamily: SYS }}>{formatDate(createdAt)}</span>
          </div>
        </div>

        {/* ── Mis giras ── */}
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', margin: '24px 0 8px 4px', fontFamily: SYS }}>
          Mis giras
        </p>
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
          {memberships.filter(m => m.tours).length === 0 ? (
            <p style={{ fontSize: 14, color: '#999', fontFamily: SYS, textAlign: 'center', padding: '20px 16px', margin: 0 }}>
              Aún no perteneces a ninguna gira
            </p>
          ) : memberships.filter(m => m.tours).map((m, i, arr) => {
            if (!m.tours) return null
            const color = TOUR_COLORS[i % TOUR_COLORS.length]
            const role = m.role ?? 'band'
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', height: 56,
                borderBottom: i < arr.length - 1 ? '0.5px solid #F5F5F5' : 'none',
              }}>
                <div style={{ width: 3, height: '100%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', fontFamily: SYS, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 12px' }}>
                  {m.tours.name}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: ROLE_TEXT[role] ?? '#fff',
                  background: ROLE_BG[role] ?? '#999',
                  borderRadius: 20, padding: '3px 8px', flexShrink: 0,
                  fontFamily: SYS, textTransform: 'uppercase', letterSpacing: '0.05em',
                  marginRight: 12,
                }}>
                  {ROLE_LABEL[role] ?? role}
                </span>
              </div>
            )
          })}
        </div>

        {/* ── Cambiar contraseña ── */}
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', marginTop: 16 }}>
          <button onClick={handleResetPassword} style={{
            width: '100%', height: 52, padding: '0 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS,
          }}>
            <span style={{ fontSize: 14, color: '#1a1a1a' }}>Cambiar contraseña</span>
            <span style={{ fontSize: 16, color: '#CCC' }}>›</span>
          </button>
        </div>
        {resetMsg && (
          <p style={{ fontSize: 13, color: '#2ECC71', margin: '8px 4px 0', fontFamily: SYS }}>{resetMsg}</p>
        )}

        {/* ── Cerrar sesión ── */}
        <button onClick={handleSignOut} style={{
          width: '100%', background: 'none', border: 'none',
          fontSize: 15, color: '#DC412C', cursor: 'pointer',
          fontFamily: SYS, padding: '16px 0', marginTop: 16, textAlign: 'center',
        }}>
          Cerrar sesión
        </button>

      </div>
    </div>
  )
}
