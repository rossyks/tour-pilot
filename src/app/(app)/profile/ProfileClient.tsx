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
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
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
  tours: { id: string; name: string; band_tag?: string | null } | null
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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CACACA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D0D0D0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
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
  const validMemberships = memberships.filter(m => m.tours)

  // Use best tour role for the hero badge
  const heroBadgeRole = validMemberships[0]?.role ?? null

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile?.id) return
    setUploading(true); setAvatarError(false); setUploadError(null)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const filePath = `${profile.id}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true, contentType: file.type })
    if (uploadErr) { setUploadError(uploadErr.message); setUploading(false); return }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', profile.id)
    setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`); setAvatarError(false); setUploading(false)
  }

  async function handleResetPassword() {
    await supabase.auth.resetPasswordForEmail(email)
    setResetMsg('Email enviado. Revisa tu bandeja de entrada.')
    setTimeout(() => setResetMsg(null), 5000)
  }

  function startEditName() { setNameInput(displayName ?? ''); setNameError(null); setEditingName(true) }
  async function saveName() {
    const trimmed = nameInput.trim()
    if (!trimmed) { setNameError('No puede estar vacío'); return }
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

  const editActive: React.CSSProperties = {
    padding: '12px 16px', background: '#FAFAFA',
    borderBottom: '0.5px solid #EBEBEB',
    display: 'flex', flexDirection: 'column', gap: 8,
  }

  const inlineInput: React.CSSProperties = {
    fontSize: 15, fontWeight: 500, color: '#1a1a1a', fontFamily: SYS,
    background: 'transparent', border: 'none',
    borderBottom: '1.5px solid #A99F49',
    outline: 'none', padding: '3px 0', width: '100%',
  }

  const SL = ({ label }: { label: string }) => (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ABABAB', margin: '28px 0 8px 2px', fontFamily: SYS }}>
      {label}
    </p>
  )

  return (
    <div className="tp-page" style={{ minHeight: '100vh', background: '#F2F2F7', maxWidth: 390, margin: '0 auto', paddingBottom: 80, fontFamily: SYS }}>

      {/* ── Hero ── */}
      <div style={{ background: '#fff', padding: '52px 20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid #EBEBEB' }}>

        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />

        {/* Avatar */}
        <div onClick={() => fileRef.current?.click()} style={{ position: 'relative', cursor: 'pointer', marginBottom: 14 }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
            background: '#E8E8E8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: uploading ? 0.5 : 1, transition: 'opacity 0.15s',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          }}>
            {avatarUrl && !avatarError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setAvatarError(true)} />
            ) : (
              <span style={{ fontSize: 34, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.5px', fontFamily: SYS }}>{initials}</span>
            )}
          </div>
          <div style={{
            position: 'absolute', bottom: 2, right: 2,
            width: 26, height: 26, borderRadius: '50%',
            background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
        </div>

        {uploadError && <p style={{ fontSize: 12, color: '#DC412C', margin: '-8px 0 10px', fontFamily: SYS, textAlign: 'center' }}>{uploadError}</p>}

        {/* Name */}
        <p style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', margin: 0, fontFamily: SYS, textAlign: 'center', lineHeight: 1.2 }}>
          {displayName ?? email.split('@')[0]}
        </p>

        {/* Username + role badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {displayUsername && (
            <span style={{ fontSize: 15, color: '#ABABAB', fontFamily: SYS }}>@{displayUsername}</span>
          )}
          {heroBadgeRole && ROLE_LABEL[heroBadgeRole] && (
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
              color: ROLE_TEXT[heroBadgeRole] ?? '#fff',
              background: ROLE_BG[heroBadgeRole] ?? '#999',
              borderRadius: 20, padding: '3px 10px', fontFamily: SYS,
            }}>
              {ROLE_LABEL[heroBadgeRole]}
            </span>
          )}
        </div>

        <p style={{ fontSize: 12, color: '#C8C8C8', margin: '10px 0 0', fontFamily: SYS }}>
          Miembro desde {formatDate(createdAt)}
        </p>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ── Datos personales ── */}
        <SL label="Datos" />
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>

          {/* Nombre */}
          {editingName ? (
            <div style={editActive}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#ABABAB', fontFamily: SYS, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</span>
                <div style={{ display: 'flex', gap: 14 }}>
                  <button onClick={cancelName} style={{ background: 'none', border: 'none', fontSize: 14, color: '#ABABAB', cursor: 'pointer', fontFamily: SYS, padding: 0 }}>Cancelar</button>
                  <button onClick={saveName} style={{ background: 'none', border: 'none', fontSize: 14, color: '#A99F49', fontWeight: 700, cursor: 'pointer', fontFamily: SYS, padding: 0 }}>Guardar</button>
                </div>
              </div>
              <input autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelName() }}
                style={inlineInput} />
              {nameError && <p style={{ fontSize: 12, color: '#DC412C', margin: 0, fontFamily: SYS }}>{nameError}</p>}
            </div>
          ) : (
            <div onClick={startEditName} style={{ height: 56, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: '0.5px solid #EBEBEB' }}>
              <span style={{ fontSize: 15, color: '#ABABAB', fontFamily: SYS }}>Nombre</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', fontFamily: SYS }}>{displayName ?? '—'}</span>
                <PencilIcon />
              </div>
            </div>
          )}

          {/* Usuario */}
          {editingUsername ? (
            <div style={{ ...editActive, borderBottom: '0.5px solid #EBEBEB' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#ABABAB', fontFamily: SYS, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario</span>
                <div style={{ display: 'flex', gap: 14 }}>
                  <button onClick={cancelUsername} style={{ background: 'none', border: 'none', fontSize: 14, color: '#ABABAB', cursor: 'pointer', fontFamily: SYS, padding: 0 }}>Cancelar</button>
                  <button onClick={saveUsername} disabled={savingUsername} style={{ background: 'none', border: 'none', fontSize: 14, color: '#A99F49', fontWeight: 700, cursor: 'pointer', fontFamily: SYS, padding: 0, opacity: savingUsername ? 0.5 : 1 }}>
                    {savingUsername ? '…' : 'Guardar'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 15, color: '#C8C8C8', fontFamily: SYS, marginRight: 2 }}>@</span>
                <input autoFocus value={usernameInput} onChange={e => setUsernameInput(e.target.value.toLowerCase())}
                  onKeyDown={e => { if (e.key === 'Enter') saveUsername(); if (e.key === 'Escape') cancelUsername() }}
                  style={{ ...inlineInput, flex: 1 }} maxLength={20} placeholder="minusculas, numeros o _" />
              </div>
              {usernameError && <p style={{ fontSize: 12, color: '#DC412C', margin: 0, fontFamily: SYS }}>{usernameError}</p>}
            </div>
          ) : (
            <div onClick={startEditUsername} style={{ height: 56, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: '0.5px solid #EBEBEB' }}>
              <span style={{ fontSize: 15, color: '#ABABAB', fontFamily: SYS }}>Usuario</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', fontFamily: SYS }}>
                  {displayUsername ? `@${displayUsername}` : '—'}
                </span>
                <PencilIcon />
              </div>
            </div>
          )}

          {/* Email */}
          <div style={{ height: 56, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, color: '#ABABAB', fontFamily: SYS }}>Email</span>
            <span style={{ fontSize: 14, fontWeight: 400, color: '#888', fontFamily: SYS, maxWidth: '62%', textAlign: 'right', wordBreak: 'break-all' }}>{email}</span>
          </div>
        </div>

        {/* ── Giras ── */}
        <SL label="Mis giras" />
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
          {validMemberships.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#C8C8C8', fontFamily: SYS, margin: 0 }}>Sin giras todavía</p>
            </div>
          ) : validMemberships.map((m, i, arr) => {
            if (!m.tours) return null
            const color = TOUR_COLORS[i % TOUR_COLORS.length]
            const role = m.role ?? 'band'
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', minHeight: 60, padding: '10px 16px',
                borderBottom: i < arr.length - 1 ? '0.5px solid #EBEBEB' : 'none',
                gap: 12,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', margin: 0, fontFamily: SYS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.tours.name}
                  </p>
                  {(m.tours as any).band_tag && (
                    <p style={{ fontSize: 12, color: '#ABABAB', margin: '2px 0 0', fontFamily: SYS }}>{(m.tours as any).band_tag}</p>
                  )}
                </div>
                {ROLE_LABEL[role] && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                    color: ROLE_TEXT[role] ?? '#fff',
                    background: ROLE_BG[role] ?? '#999',
                    borderRadius: 20, padding: '3px 10px', flexShrink: 0, fontFamily: SYS,
                  }}>
                    {ROLE_LABEL[role]}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Cuenta ── */}
        <SL label="Cuenta" />
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
          <button onClick={handleResetPassword} style={{
            width: '100%', height: 56, padding: '0 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS,
            borderBottom: '0.5px solid #EBEBEB',
          }}>
            <span style={{ fontSize: 15, color: '#1a1a1a', fontFamily: SYS }}>Cambiar contraseña</span>
            <ChevronRight />
          </button>
          {resetMsg && (
            <div style={{ padding: '10px 16px', background: '#F5FBF5', borderBottom: '0.5px solid #EBEBEB' }}>
              <p style={{ fontSize: 13, color: '#27AE60', margin: 0, fontFamily: SYS }}>{resetMsg}</p>
            </div>
          )}
          <button onClick={handleSignOut} style={{
            width: '100%', height: 56, padding: '0 16px',
            display: 'flex', alignItems: 'center',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS,
          }}>
            <span style={{ fontSize: 15, color: '#DC412C', fontFamily: SYS }}>Cerrar sesión</span>
          </button>
        </div>

      </div>
    </div>
  )
}
