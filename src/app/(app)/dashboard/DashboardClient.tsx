'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Tour, TOUR_COLORS } from '@/lib/types'
import { useScrollLock } from '@/lib/useScrollLock'
import CalendarView from './CalendarView'

const SYS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"

function fallbackCopy(text: string, onSuccess: () => void) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;opacity:0;'
  document.body.appendChild(ta)
  ta.focus()
  ta.setSelectionRange(0, 99999)
  try { document.execCommand('copy'); onSuccess() } catch (e) { console.error('Copy failed', e) }
  document.body.removeChild(ta)
}

function copyToClipboard(text: string, onSuccess: () => void) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(() => fallbackCopy(text, onSuccess))
  } else {
    fallbackCopy(text, onSuccess)
  }
}

function fmtFull(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).replace('.', '')
}

function fmtShort(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short',
  }).replace('.', '')
}

function daysUntil(d: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(d + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const sheetInputStyle: React.CSSProperties = {
  width: '100%', height: 48, background: '#F5F5F5', border: 'none', borderRadius: 12,
  padding: '0 14px', fontSize: 16, fontFamily: SYS, outline: 'none', color: '#1a1a1a',
  boxSizing: 'border-box',
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return createPortal(children, document.body)
}

function SwipeTourRow({
  tour,
  tourIndex,
  stats,
  isAdminOfTour,
  pressed,
  onPressStart,
  onPressEnd,
  onDeleteRequest,
}: {
  tour: Tour
  tourIndex: number
  stats: { count: number; nextDate: string | null }
  isAdminOfTour: boolean
  pressed: string | null
  onPressStart: (id: string) => void
  onPressEnd: () => void
  onDeleteRequest: (tour: Tour) => void
}) {
  const [offset, setOffset] = useState(0)
  const startX = useRef<number | null>(null)
  const THRESHOLD = 80

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startX.current === null) return
    const dx = e.touches[0].clientX - startX.current
    if (dx < 0) setOffset(Math.max(dx, -120))
    else if (offset < 0) setOffset(Math.min(dx + offset, 0))
  }

  function onTouchEnd() {
    if (offset < -THRESHOLD) {
      setOffset(-100)
    } else {
      setOffset(0)
    }
    startX.current = null
  }

  const card = (
    <Link href={`/tours/${tour.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseDown={() => onPressStart(tour.id)}
        onMouseUp={onPressEnd}
        onMouseLeave={onPressEnd}
        onTouchStart={(e) => { onPressStart(tour.id); onTouchStart(e) }}
        onTouchMove={onTouchMove}
        onTouchEnd={() => { onPressEnd(); onTouchEnd() }}
        style={{
          backgroundColor: TOUR_COLORS[tourIndex % TOUR_COLORS.length],
          borderRadius: 18, padding: '16px 16px', minHeight: 72,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
          position: 'relative',
          transform: pressed === tour.id ? 'scale(0.97)' : 'scale(1)',
          transition: 'transform 0.15s ease',
        }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: 0, fontFamily: SYS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tour.name}
            </p>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', background: 'rgba(0,0,0,0.12)', borderRadius: 20, padding: '3px 8px', flexShrink: 0, fontFamily: SYS }}>
              {stats.count} {stats.count === 1 ? 'show' : 'shows'}
            </span>
          </div>
          {stats.nextDate ? (
            <p style={{ fontSize: 12, color: 'rgba(26,26,26,0.6)', margin: 0, fontFamily: SYS }}>
              Próx: {fmtShort(stats.nextDate)}
            </p>
          ) : (
            <p style={{ fontSize: 12, color: 'rgba(26,26,26,0.4)', margin: 0, fontFamily: SYS }}>
              Sin fechas próximas
            </p>
          )}
        </div>
        {tour.band_logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tour.band_logo_url} alt="" style={{ maxHeight: 20, width: 'auto', maxWidth: 70, objectFit: 'contain', position: 'absolute', top: 12, right: 12 }} />
        )}
        <span style={{ fontSize: 14, color: '#1a1a1a', opacity: 0.35, position: 'absolute', bottom: 12, right: 16, lineHeight: 1 }}>→</span>
      </div>
    </Link>
  )

  if (!isAdminOfTour) return card

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 18 }}>
      {/* Delete button behind */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 100,
        background: '#DC412C', borderRadius: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <button
          onClick={() => { setOffset(0); onDeleteRequest(tour) }}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: SYS, cursor: 'pointer', padding: '0 12px' }}>
          Eliminar
        </button>
      </div>
      {/* Swipeable content */}
      <div style={{ transform: `translateX(${offset}px)`, transition: startX.current === null ? 'transform 0.25s ease' : 'none' }}>
        {card}
      </div>
    </div>
  )
}

export default function DashboardClient({
  tours: initialTours,
  tourStats: initialTourStats,
  nextShow,
  isAdmin,
  adminTourIds,
  userName,
  allShows,
  allTravelDays,
}: {
  tours: Tour[]
  tourStats: Record<string, { count: number; nextDate: string | null }>
  nextShow: { id: string; venue_name: string; city: string; date: string; color: string | null; tourName: string | null; show_time: string | null; show_duration: number | null } | null
  isAdmin: boolean
  adminTourIds: string[]
  userName: string | null
  allShows: Array<{ id: string; tour_id: string; date: string; venue_name: string; city: string; show_time: string | null }>
  allTravelDays: Array<{ id: string; show_id: string; date: string; destination: string | null; tour_id: string }>
}) {
  const router = useRouter()
  const supabase = createClient()
  const [tours, setTours] = useState<Tour[]>(initialTours)
  const [view, setView] = useState<'list' | 'calendar'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('dashboard-view') as 'list' | 'calendar') ?? 'list'
    }
    return 'list'
  })
  function switchView(v: 'list' | 'calendar') {
    setView(v)
    if (typeof window !== 'undefined') localStorage.setItem('dashboard-view', v)
  }
  const [tourStats, setTourStats] = useState(initialTourStats)
  const [pressed, setPressed] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', band_tag: '' })
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  // Delete tour
  const [deleteTarget, setDeleteTarget] = useState<Tour | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null)

  type CountdownState = { hours: number; minutes: number; seconds: number; live: boolean } | null
  const [countdown, setCountdown] = useState<CountdownState>(null)

  useEffect(() => {
    if (!nextShow?.show_time) { setCountdown(null); return }
    const compute = () => {
      const now = new Date()
      const [h, m] = nextShow.show_time!.split(':').map(Number)
      const showStart = new Date(nextShow.date + 'T' + nextShow.show_time!)
      showStart.setFullYear(now.getFullYear(), now.getMonth(), now.getDate())
      // If show date is in the future, use the actual date
      const [sy, smth, sd] = nextShow.date.split('-').map(Number)
      const actualStart = new Date(sy, smth - 1, sd, h, m, 0)
      const diffMs = actualStart.getTime() - now.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      if (diffHours > 24 || diffHours < -(nextShow.show_duration ?? 120)) {
        setCountdown(null)
        return
      }
      if (diffMs <= 0) {
        // Show has started — check if still live
        const endMs = actualStart.getTime() + (nextShow.show_duration ?? 120) * 60 * 1000
        if (now.getTime() < endMs) {
          setCountdown({ hours: 0, minutes: 0, seconds: 0, live: true })
        } else {
          setCountdown(null)
        }
        return
      }
      const totalSec = Math.floor(diffMs / 1000)
      setCountdown({
        hours: Math.floor(totalSec / 3600),
        minutes: Math.floor((totalSec % 3600) / 60),
        seconds: totalSec % 60,
        live: false,
      })
    }
    compute()
    const id = setInterval(compute, 1000)
    return () => clearInterval(id)
  }, [nextShow])

  useScrollLock(sheetOpen || joinOpen || !!deleteTarget)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    setCreateError(null)

    const { data: { user } } = await supabase.auth.getUser()

    const genCode = () => Math.floor(Math.random() * 900000 + 100000).toString()

    let data = null, error = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await supabase.from('tours').insert({
        name: form.name,
        band_tag: form.band_tag || null,
        invite_code_band: genCode(),
        invite_code_artist: genCode(),
        invite_code_crew: genCode(),
      }).select().single()
      data = result.data
      error = result.error
      if (!error) break
    }

    if (error || !data) {
      setCreateError('No se pudo crear la gira, inténtalo de nuevo')
      setSaving(false)
      return
    }

    if (user) {
      const [{ error: memberError }] = await Promise.all([
        supabase.from('tour_members').insert({ tour_id: data.id, user_id: user.id, role: 'owner' }),
        supabase.from('tours').update({ owner_id: user.id }).eq('id', data.id),
      ])
      if (memberError) {
        setCreateError('No se pudo crear la gira, inténtalo de nuevo')
        await supabase.from('tours').delete().eq('id', data.id)
        setSaving(false)
        return
      }
    }

    router.push(`/tours/${data.id}`)
    setSaving(false)
  }

  async function handleJoin() {
    if (!joinCode) return
    setJoinError(null)
    setJoining(true)

    const code = joinCode.trim()

    const { data: byBand } = await supabase
      .from('tours').select('id, name').eq('invite_code_band', code).maybeSingle()

    const { data: byArtist } = byBand ? { data: null } : await supabase
      .from('tours').select('id, name').eq('invite_code_artist', code).maybeSingle()

    const { data: byCrew } = (byBand || byArtist) ? { data: null } : await supabase
      .from('tours').select('id, name').eq('invite_code_crew', code).maybeSingle()

    const matchedTour = byBand ?? byArtist ?? byCrew
    const role: 'band' | 'artist' | 'crew' = byBand ? 'band' : byArtist ? 'artist' : 'crew'

    if (!matchedTour) { setJoinError('Código inválido'); setJoining(false); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setJoinError('Debes iniciar sesión'); setJoining(false); return }

    // Already a member?
    const { data: existing } = await supabase
      .from('tour_members')
      .select('id')
      .eq('tour_id', matchedTour.id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (existing) { setJoinError('Ya perteneces a esta gira'); setJoining(false); return }

    // Join
    const { error: memberError } = await supabase.from('tour_members').insert({
      tour_id: matchedTour.id,
      user_id: user.id,
      role,
    })
    if (memberError) { setJoinError('No se pudo unir, inténtalo de nuevo'); setJoining(false); return }

    const roleLabel = role === 'band' ? 'Banda' : role === 'artist' ? 'Artista' : 'Crew'
    setJoining(false)
    setJoinOpen(false)
    setJoinCode('')
    setJoinError(null)
    setJoinSuccess(`Te has unido a ${matchedTour.name} como ${roleLabel}`)
    setTimeout(() => setJoinSuccess(null), 3000)
    router.refresh()
  }

  async function handleDeleteTour() {
    if (!deleteTarget) return
    setDeleting(true)
    const id = deleteTarget.id
    // Delete in order to avoid FK issues
    await supabase.from('shows').delete().eq('tour_id', id)
    await supabase.from('tour_members').delete().eq('tour_id', id)
    await supabase.from('tours').delete().eq('id', id)
    setTours(ts => ts.filter(t => t.id !== id))
    setTourStats(s => { const n = { ...s }; delete n[id]; return n })
    setDeleteTarget(null)
    setDeleting(false)
  }

  const days = nextShow ? daysUntil(nextShow.date) : null

  return (
    <div className="tp-page" style={{ background: '#fff', maxWidth: 390, margin: '0 auto', fontFamily: SYS }}>

      {/* ── Estado vacío — 100dvh sin scroll ── */}
      {tours.length === 0 && (
        <div style={{
          height: '100dvh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '0 28px',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Tour Pilot" height={28} style={{ display: 'block', margin: '0 auto 40px' }} />
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9M3 12c0 4.97 4.03 9 9 9s9-4.03 9-9M3 12H1m20 0h-2M12 3V1m0 20v-2"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: '16px 0 6px', fontFamily: SYS, textAlign: 'center' }}>Sin giras activas</p>
          <p style={{ fontSize: 14, color: '#999', margin: '0 0 28px', fontFamily: SYS, textAlign: 'center', lineHeight: 1.5 }}>
            Crea tu primera gira o únete<br/>con un código de invitación
          </p>
          <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => setSheetOpen(true)}
              style={{ width: '100%', height: 48, background: '#1a1a1a', border: 'none', borderRadius: 20, fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: SYS }}>
              Crear gira
            </button>
            <button
              onClick={() => { setJoinCode(''); setJoinError(null); setJoinOpen(true) }}
              style={{ width: '100%', height: 48, background: 'transparent', border: '1.5px solid #1a1a1a', borderRadius: 20, fontSize: 15, fontWeight: 600, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS }}>
              Unirse con código
            </button>
          </div>
        </div>
      )}

      {/* Header — solo cuando hay giras */}
      {tours.length > 0 && (
        <div style={{ padding: '48px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Tour Pilot" height={28} style={{ display: 'block', maxWidth: 140 }} />
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => switchView('list')} style={{ background: view === 'list' ? '#F0F0F0' : 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={view === 'list' ? '#1a1a1a' : '#CCC'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
              <button onClick={() => switchView('calendar')} style={{ background: view === 'calendar' ? '#F0F0F0' : 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={view === 'calendar' ? '#1a1a1a' : '#CCC'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </button>
            </div>
          </div>
          {userName && (
            <p style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', margin: 0, fontFamily: SYS, lineHeight: 1.2 }}>
              ¡Hola, {userName.split(' ')[0]}!
            </p>
          )}
        </div>
      )}

      {tours.length > 0 && view === 'calendar' && (
        <CalendarView tours={tours} shows={allShows} travelDays={allTravelDays} />
      )}

      {tours.length > 0 && view === 'list' && (
        <div style={{ padding: '0 20px 80px', display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* ── Próximo show ── */}
          {nextShow && days !== null && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', margin: '0 0 12px 0', fontFamily: SYS }}>
                Próximo show
              </p>
              <Link href={`/shows/${nextShow.id}`} style={{ textDecoration: 'none' }}>
                <div
                  onMouseDown={() => setPressed('next')}
                  onMouseUp={() => setPressed(null)}
                  onMouseLeave={() => setPressed(null)}
                  onTouchStart={() => setPressed('next')}
                  onTouchEnd={() => setPressed(null)}
                  style={{
                    backgroundColor: nextShow.color ?? TOUR_COLORS[0],
                    borderRadius: 20, padding: '14px 18px 14px', cursor: 'pointer',
                    transform: pressed === 'next' ? 'scale(0.97)' : 'scale(1)',
                    transition: 'transform 0.15s ease',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: '0 0 2px 0', fontFamily: SYS, lineHeight: 1.15 }}>
                    {nextShow.venue_name}
                  </p>
                  <p style={{ fontSize: 14, fontStyle: 'italic', color: 'rgba(26,26,26,0.7)', margin: '0 0 2px 0', fontFamily: SYS }}>
                    {nextShow.city} · {fmtFull(nextShow.date)}
                  </p>
                  {nextShow.tourName && (
                    <p style={{ fontSize: 12, color: 'rgba(26,26,26,0.5)', margin: '0 0 10px 0', fontFamily: SYS }}>
                      {nextShow.tourName}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {/* Días/countdown box */}
                    <div style={{ background: 'rgba(255,255,255,0.35)', borderRadius: 14, padding: '10px 14px', display: 'inline-flex', alignItems: 'center' }}>
                      {countdown?.live ? (
                        <span style={{
                          fontSize: 18, fontWeight: 800, color: '#DC412C', fontFamily: SYS,
                          animation: 'pulse 1.2s ease-in-out infinite',
                        }}>EN DIRECTO</span>
                      ) : countdown ? (() => {
                        const urgent = countdown.hours === 0 && countdown.minutes < 60
                        const col = urgent ? '#DC412C' : '#1a1a1a'
                        const pad = (n: number) => String(n).padStart(2, '0')
                        return (
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span style={{ fontSize: 26, fontWeight: 800, color: col, lineHeight: 1, fontFamily: SYS }}>{pad(countdown.hours)}</span>
                              <span style={{ fontSize: 9, color: 'rgba(26,26,26,0.5)', fontFamily: SYS, marginTop: 1 }}>h</span>
                            </div>
                            <span style={{ fontSize: 22, fontWeight: 800, color: col, lineHeight: 1, fontFamily: SYS, marginBottom: 3 }}>:</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span style={{ fontSize: 26, fontWeight: 800, color: col, lineHeight: 1, fontFamily: SYS }}>{pad(countdown.minutes)}</span>
                              <span style={{ fontSize: 9, color: 'rgba(26,26,26,0.5)', fontFamily: SYS, marginTop: 1 }}>min</span>
                            </div>
                            <span style={{ fontSize: 22, fontWeight: 800, color: col, lineHeight: 1, fontFamily: SYS, marginBottom: 3 }}>:</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span style={{ fontSize: 26, fontWeight: 800, color: col, lineHeight: 1, fontFamily: SYS }}>{pad(countdown.seconds)}</span>
                              <span style={{ fontSize: 9, color: 'rgba(26,26,26,0.5)', fontFamily: SYS, marginTop: 1 }}>seg</span>
                            </div>
                          </div>
                        )
                      })() : days === 0 ? (
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', fontFamily: SYS }}>HOY</span>
                      ) : days === 1 ? (
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', fontFamily: SYS }}>MAÑANA</span>
                      ) : (
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', fontFamily: SYS }}>
                          Quedan {days} días
                        </span>
                      )}
                    </div>
                    {/* Hora del show */}
                    {nextShow.show_time && !countdown?.live && (
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: 4 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(26,26,26,0.5)', fontFamily: SYS, marginBottom: 2 }}>SHOW</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', fontFamily: SYS, lineHeight: 1 }}>
                          {nextShow.show_time.slice(0, 5)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* ── Tus giras ── */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', margin: '0 0 12px 0', fontFamily: SYS }}>
              Tus giras
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tours.map((tour, i) => {
                const stats = tourStats[tour.id] ?? { count: 0, nextDate: null }
                const isAdminOfTour = adminTourIds.includes(tour.id)
                return (
                  <SwipeTourRow
                    key={tour.id}
                    tour={tour}
                    tourIndex={i}
                    stats={stats}
                    isAdminOfTour={isAdminOfTour}
                    pressed={pressed}
                    onPressStart={setPressed}
                    onPressEnd={() => setPressed(null)}
                    onDeleteRequest={setDeleteTarget}
                  />
                )
              })}
            </div>
          </div>

          {/* Acciones — siempre al final */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {isAdmin && (
              <button
                onClick={() => setSheetOpen(true)}
                style={{
                  width: '100%', height: 64, background: 'transparent',
                  border: '1.5px dashed #CCCCCC', borderRadius: 18,
                  fontSize: 15, fontWeight: 600, color: '#999',
                  cursor: 'pointer', fontFamily: SYS,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                + Nueva gira
              </button>
            )}
            <button
              onClick={() => { setJoinCode(''); setJoinError(null); setJoinOpen(true) }}
              style={{ width: '100%', background: 'none', border: 'none', fontSize: 14, color: '#999', cursor: 'pointer', fontFamily: SYS, textAlign: 'center', padding: '4px 0' }}>
              + Unirse con código
            </button>
          </div>
        </div>
      )}

      {/* ── Sheet: Nueva gira ── */}
      <Portal>
        {sheetOpen && (
          <>
            <div
              onClick={() => { setSheetOpen(false); setForm({ name: '', band_tag: '' }); setCreateError(null) }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}
            />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', zIndex: 9999, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}>
              <p style={{ fontWeight: 700, fontSize: 17, margin: '0 0 20px 0', fontFamily: SYS }}>Nueva gira</p>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {createError && <p style={{ fontSize: 13, color: '#DC412C', margin: 0 }}>{createError}</p>}
                <div>
                  <p style={{ fontSize: 11, color: '#999', margin: '0 0 6px 0', fontFamily: SYS, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nombre *</p>
                  <input autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nombre de la gira" required style={sheetInputStyle} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#999', margin: '0 0 6px 0', fontFamily: SYS, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Artista / Banda *</p>
                  <input value={form.band_tag} onChange={e => setForm(f => ({ ...f, band_tag: e.target.value }))}
                    placeholder="Nombre del artista o banda" required style={sheetInputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button"
                    onClick={() => { setSheetOpen(false); setForm({ name: '', band_tag: '' }) }}
                    style={{ flex: 1, height: 48, background: '#F5F5F5', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 500, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving}
                    style={{ flex: 1, height: 48, background: '#1a1a1a', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: SYS, opacity: saving ? 0.6 : 1 }}>
                    {saving ? '…' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </Portal>

      {/* ── Sheet: Unirse con código ── */}
      <Portal>
        {joinOpen && (
          <>
            <div
              onClick={() => { setJoinOpen(false); setJoinCode(''); setJoinError(null) }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}
            />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', zIndex: 9999, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}>
              <p style={{ fontWeight: 700, fontSize: 17, margin: '0 0 20px 0', fontFamily: SYS, textAlign: 'center' }}>Unirse con código</p>

              <input
                type="tel"
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.replace(/[^0-9]/g, '')); setJoinError(null) }}
                placeholder="000000"
                maxLength={6}
                style={{
                  width: '100%', height: 64, background: '#F5F5F5', border: 'none', borderRadius: 14,
                  padding: '0 16px', fontSize: 32, fontWeight: 800, fontFamily: 'monospace',
                  textAlign: 'center', letterSpacing: '0.3em', color: '#1a1a1a', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <p style={{ fontSize: 13, color: '#999', textAlign: 'center', margin: '12px 0 20px', lineHeight: 1.5 }}>
                Introduce el código que te ha enviado<br/>el administrador de la gira
              </p>

              {joinError && (
                <p style={{ fontSize: 13, color: '#DC412C', textAlign: 'center', margin: '0 0 12px' }}>{joinError}</p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={handleJoin}
                  disabled={joinCode.length < 6 || joining}
                  style={{
                    width: '100%', height: 48, background: '#1a1a1a', border: 'none', borderRadius: 12,
                    fontSize: 16, fontWeight: 700, color: '#fff', cursor: joinCode && !joining ? 'pointer' : 'default',
                    fontFamily: SYS, opacity: joinCode.length >= 6 && !joining ? 1 : 0.3,
                  }}>
                  {joining ? '…' : 'Unirse'}
                </button>
                <button
                  onClick={() => { setJoinOpen(false); setJoinCode(''); setJoinError(null) }}
                  style={{
                    width: '100%', height: 48, background: '#F5F5F5', border: 'none', borderRadius: 12,
                    fontSize: 16, fontWeight: 500, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS,
                  }}>
                  Cancelar
                </button>
              </div>
            </div>
          </>
        )}
      </Portal>

      {/* ── Toast: Unirse con éxito ── */}
      <Portal>
        {joinSuccess && (
          <div style={{
            position: 'fixed', bottom: 80, left: 20, right: 20, zIndex: 10000,
            background: '#1a1a1a', color: '#fff', borderRadius: 16, padding: '14px 18px',
            fontSize: 14, fontWeight: 600, fontFamily: SYS, textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)',
          }}>
            <span style={{ marginRight: 8, color: '#2ECC71' }}>✓</span>{joinSuccess}
          </div>
        )}
      </Portal>

      {/* ── Sheet: Confirmar eliminar gira ── */}
      <Portal>
        {deleteTarget && (
          <>
            <div
              onClick={() => !deleting && setDeleteTarget(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}
            />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', padding: '28px 20px 44px', zIndex: 9999, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}>
              <p style={{ fontWeight: 700, fontSize: 17, margin: '0 0 8px 0', fontFamily: SYS, textAlign: 'center' }}>¿Eliminar esta gira?</p>
              <p style={{ fontSize: 14, color: '#999', margin: '0 0 28px', fontFamily: SYS, textAlign: 'center', lineHeight: 1.5 }}>
                Esta acción no se puede deshacer.<br />Se eliminarán todos los datos de<br/><strong style={{ color: '#1a1a1a' }}>{deleteTarget.name}</strong>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={handleDeleteTour}
                  disabled={deleting}
                  style={{ width: '100%', height: 52, background: '#DC412C', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: SYS, opacity: deleting ? 0.6 : 1 }}>
                  {deleting ? '…' : 'Eliminar gira'}
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  style={{ width: '100%', height: 52, background: '#F5F5F5', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 500, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS }}>
                  Cancelar
                </button>
              </div>
            </div>
          </>
        )}
      </Portal>
    </div>
  )
}
