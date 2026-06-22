'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TOUR_COLORS } from '@/lib/types'

const SYS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
const USERNAME_RE = /^[a-z0-9_]+$/

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase()
  }
  return email[0].toUpperCase()
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner', admin: 'Admin', band: 'Banda', artist: 'Artista', crew: 'Crew',
}
const ROLE_BG: Record<string, string> = {
  owner: '#1a1a1a', admin: '#333', band: '#A4B2DA', artist: '#A99F49', crew: '#DC412C',
}
const ROLE_TEXT: Record<string, string> = {
  owner: '#fff', admin: '#fff', band: '#1a1a1a', artist: '#1a1a1a', crew: '#fff',
}

interface Membership {
  role: string
  tours: { id: string; name: string; band_tag?: string | null; created_at?: string } | null
}

interface Profile {
  id: string
  full_name: string | null
  username: string | null
  band: string | null
  role: string | null
  avatar_url: string | null
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile?.avatar_url ? `${profile.avatar_url}?t=${Date.now()}` : null
  )
  const [avatarError, setAvatarError] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [resetMsg, setResetMsg] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState<string | null>(profile?.full_name ?? null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(profile?.full_name ?? '')
  const [nameError, setNameError] = useState<string | null>(null)

  const [displayUsername, setDisplayUsername] = useState<string | null>(profile?.username ?? null)
  const [editingUsername, setEditingUsername] = useState(false)
  const [usernameInput, setUsernameInput] = useState(profile?.username ?? '')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [savingUsername, setSavingUsername] = useState(false)

  const initials = getInitials(displayName, email)
  const globalRole = profile?.role ?? 'band'

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile?.id) return
    setUploading(true)
    setAvatarError(false)
    setUploadError(null)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const filePath = `${profile.id}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true, contentType: file.type })
    if (uploadErr) {
      setUploadError(uploadErr.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', profile.id)
    setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`)
    setAvatarError(false)
    setUploading(false)
  }

  async function handleResetPassword() {
    await supabase.auth.resetPasswordForEmail(email)
    setResetMsg('Email enviado. Revisa tu bandeja de entrada.')
    setTimeout(() => setResetMsg(null), 5000)
  }

  function startEditName() { setNameInput(displayName ?? ''); setNameError(null); setEditingName(true) }
  async function saveName() {
    const trimmed = nameInput.trim()
    if (!trimmed) { setNameError('El nombre no puede estar vacío'); return }
    if (!profile?.id) return
    const { error } = await supabase.from('profiles').update({ full_name: trimmed }).eq('id', profile.id)
    if (error) { setNameError('Error al guardar'); return }
    setDisplayName(trimmed); setEditingName(false); setNameError(null)
  }
  function cancelName() { setEditingName(false); setNameError(null) }

  function startEditUsername() { setUsernameInput(displayUsername ?? ''); setUsernameError(null); setEditingUsername(true) }
  async function saveUsername() {
    const val = usernameInput.trim().toLowerCase()
    if (val.length < 3 || val.length > 20) { setUsernameError('Entre 3 y 20 caracteres'); return }
    if (!USERNAME_RE.test(val)) { setUsernameError('Solo minúsculas, números y _'); return }
    if (!profile?.id) return
    setSavingUsername(true)
    const { data: existing } = await supabase.from('profiles').select('id').eq('username', val).neq('id', profile.id).maybeSingle()
    if (existing) { setUsernameError('Ya está en uso'); setSavingUsername(false); return }
    const { error } = await supabase.from('profiles').update({ username: val }).eq('id', profile.id)
    setSavingUsername(false)
    if (error) { setUsernameError('Error al guardar'); return }
    setDisplayUsername(val); setEditingUsername(false); setUsernameError(null)
  }
  function cancelUsername() { setEditingUsername(false); setUsernameError(null) }

  const SectionLabel = ({ children }: { children: string }) => (
    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', margin: '28px 0 8px 4px', fontFamily: SYS }}>
      {children}
    </p>
  )

  const inlineInput: React.CSSProperties = {
    flex: 1, fontSize: 14, fontWeight: 500, color: '#1a1a1a', fontFamily: SYS,
    background: 'transparent', border: 'none', borderBottom: '1.5px solid #A99F49',
    outline: 'none', padding: '2px 0', minWidth: 0,
  }

  const validTourMemberships = memberships.filter(m => m.tours)

  return (
    <div className="tp-page" style={{ minHeight: '100vh', background: '#F2F2F2', maxWidth: 390, margin: '0 auto', paddingBottom: 60, fontFamily: SYS }}>

      {/* ── Hero ── */}
      <div style={{ background: '#1a1a1a', padding: '56px 20px 32px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Avatar */}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        <div
          onClick={() => fileRef.current?.click()}
          style={{ position: 'relative', cursor: 'pointer', marginBottom: 16 }}
        >
          <div style={{
            width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
            background: '#333', border: '2.5px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: uploading ? 0.5 : 1, transition: 'opacity 0.2s',
          }}>
            {avatarUrl && !avatarError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setAvatarError(true)} />
            ) : (
              <span style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{initials}</span>
            )}
          </div>
          {/* Camera badge */}
          <div style={{
            position: 'absolute', bottom: 2, right: 2,
            width: 24, height: 24, borderRadius: '50%',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
        </div>

        {/* Name */}
        <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0, fontFamily: SYS, textAlign: 'center', lineHeight: 1.2 }}>
          {displayName ?? email.split('@')[0]}
        </p>

        {/* Username + role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {displayUsername && (
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontFamily: SYS }}>
              @{displayUsername}
            </span>
          )}
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: ROLE_TEXT[globalRole] ?? '#fff',
            background: ROLE_BG[globalRole] ?? '#555',
            borderRadius: 20, padding: '3px 10px', fontFamily: SYS,
          }}>
            {ROLE_LABEL[globalRole] ?? globalRole}
          </span>
        </div>

        {/* Miembro desde */}
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', margin: '10px 0 0', fontFamily: SYS }}>
          Miembro desde {formatDate(createdAt)}
        </p>

        {uploadError && (
          <p style={{ fontSize: 12, color: '#DC412C', margin: '8px 0 0', fontFamily: SYS, textAlign: 'center' }}>{uploadError}</p>
        )}
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ── Datos personales ── */}
        <SectionLabel>Datos</SectionLabel>
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden' }}>

          {/* Nombre editable */}
          {editingName ? (
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #F0F0F0', background: '#FFFDF5' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#999', fontFamily: SYS, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Nombre</span>
                <div style={{ display: 'flex', gap: 14 }}>
                  <button onClick={cancelName} style={{ background: 'none', border: 'none', fontSize: 13, color: '#999', cursor: 'pointer', fontFamily: SYS, padding: 0 }}>Cancelar</button>
                  <button onClick={saveName} style={{ background: 'none', border: 'none', fontSize: 13, color: '#A99F49', fontWeight: 700, cursor: 'pointer', fontFamily: SYS, padding: 0 }}>Guardar</button>
                </div>
              </div>
              <input autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelName() }}
                style={inlineInput} />
              {nameError && <p style={{ fontSize: 12, color: '#DC412C', margin: '4px 0 0', fontFamily: SYS }}>{nameError}</p>}
            </div>
          ) : (
            <div onClick={startEditName} style={{ height: 56, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: '0.5px solid #F0F0F0' }}>
              <span style={{ fontSize: 14, color: '#999', fontFamily: SYS }}>Nombre</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', fontFamily: SYS }}>{displayName ?? '—'}</span>
                <PencilIcon />
              </div>
            </div>
          )}

          {/* Username editable */}
          {editingUsername ? (
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #F0F0F0', background: '#FFFDF5' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#999', fontFamily: SYS, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Usuario</span>
                <div style={{ display: 'flex', gap: 14 }}>
                  <button onClick={cancelUsername} style={{ background: 'none', border: 'none', fontSize: 13, color: '#999', cursor: 'pointer', fontFamily: SYS, padding: 0 }}>Cancelar</button>
                  <button onClick={saveUsername} disabled={savingUsername} style={{ background: 'none', border: 'none', fontSize: 13, color: '#A99F49', fontWeight: 700, cursor: 'pointer', fontFamily: SYS, padding: 0, opacity: savingUsername ? 0.5 : 1 }}>
                    {savingUsername ? '…' : 'Guardar'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#BBB', fontFamily: SYS, marginRight: 2 }}>@</span>
                <input autoFocus value={usernameInput} onChange={e => setUsernameInput(e.target.value.toLowerCase())}
                  onKeyDown={e => { if (e.key === 'Enter') saveUsername(); if (e.key === 'Escape') cancelUsername() }}
                  style={{ ...inlineInput }} maxLength={20} placeholder="minusculas, numeros o _" />
              </div>
              {usernameError && <p style={{ fontSize: 12, color: '#DC412C', margin: '4px 0 0', fontFamily: SYS }}>{usernameError}</p>}
            </div>
          ) : (
            <div onClick={startEditUsername} style={{ height: 56, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: '0.5px solid #F0F0F0' }}>
              <span style={{ fontSize: 14, color: '#999', fontFamily: SYS }}>Usuario</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', fontFamily: SYS }}>
                  {displayUsername ? `@${displayUsername}` : '—'}
                </span>
                <PencilIcon />
              </div>
            </div>
          )}

          {/* Email */}
          <div style={{ height: 56, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: '#999', fontFamily: SYS }}>Email</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', fontFamily: SYS, maxWidth: '60%', textAlign: 'right', wordBreak: 'break-all' }}>{email}</span>
          </div>
        </div>

        {/* ── Giras ── */}
        <SectionLabel>Mis giras</SectionLabel>
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
          {validTourMemberships.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#BBB', fontFamily: SYS, margin: 0 }}>Sin giras todavía</p>
            </div>
          ) : validTourMemberships.map((m, i, arr) => {
            if (!m.tours) return null
            const color = TOUR_COLORS[i % TOUR_COLORS.length]
            const role = m.role ?? 'band'
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', height: 60, padding: '0 16px',
                borderBottom: i < arr.length - 1 ? '0.5px solid #F0F0F0' : 'none',
                gap: 12,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: 0, fontFamily: SYS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.tours.name}
                  </p>
                  {(m.tours as any).band_tag && (
                    <p style={{ fontSize: 12, color: '#999', margin: '1px 0 0', fontFamily: SYS }}>{(m.tours as any).band_tag}</p>
                  )}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: ROLE_TEXT[role] ?? '#fff',
                  background: ROLE_BG[role] ?? '#999',
                  borderRadius: 20, padding: '3px 9px', flexShrink: 0,
                  fontFamily: SYS, textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {ROLE_LABEL[role] ?? role}
                </span>
              </div>
            )
          })}
        </div>

        {/* ── Cuenta ── */}
        <SectionLabel>Cuenta</SectionLabel>
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
          <button onClick={handleResetPassword} style={{
            width: '100%', height: 56, padding: '0 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS,
            borderBottom: '0.5px solid #F0F0F0',
          }}>
            <span style={{ fontSize: 14, color: '#1a1a1a', fontFamily: SYS }}>Cambiar contraseña</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          {resetMsg && (
            <div style={{ padding: '10px 16px', background: '#F5FBF5' }}>
              <p style={{ fontSize: 13, color: '#27AE60', margin: 0, fontFamily: SYS }}>{resetMsg}</p>
            </div>
          )}
          <button onClick={handleSignOut} style={{
            width: '100%', height: 56, padding: '0 16px',
            display: 'flex', alignItems: 'center',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS,
          }}>
            <span style={{ fontSize: 14, color: '#DC412C', fontFamily: SYS, fontWeight: 500 }}>Cerrar sesión</span>
          </button>
        </div>

      </div>
    </div>
  )
}
