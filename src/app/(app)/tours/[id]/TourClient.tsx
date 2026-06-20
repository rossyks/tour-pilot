'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Show, TravelDay, TourMember, TOUR_COLORS } from '@/lib/types'
import { useScrollLock } from '@/lib/useScrollLock'

const SYS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"

function formatDay(d: string) {
  return new Date(d + 'T00:00:00').getDate().toString().padStart(2, '0')
}
function formatMonth(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '')
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return createPortal(children, document.body)
}

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

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#F5F5F5', border: 'none', borderRadius: 12,
  padding: '12px 14px', fontSize: 15, fontFamily: SYS, outline: 'none',
}

type ListItem =
  | { _type: 'show'; show: Show; showIndex: number }
  | { _type: 'travel'; travel: TravelDay; showColor: string }

function SwipeDeleteRow({
  children,
  onDelete,
  isAdmin,
}: {
  children: React.ReactNode
  onDelete: () => void
  isAdmin: boolean
}) {
  const [offset, setOffset] = useState(0)
  const [confirmed, setConfirmed] = useState(false)
  const startX = useRef<number | null>(null)
  const THRESHOLD = 80

  if (!isAdmin) return <>{children}</>

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    setConfirmed(false)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startX.current === null) return
    const dx = e.touches[0].clientX - startX.current
    if (dx < 0) setOffset(Math.max(dx, -120))
  }

  function onTouchEnd() {
    if (offset < -THRESHOLD) {
      setConfirmed(true)
      setOffset(-100)
    } else {
      setOffset(0)
    }
    startX.current = null
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 18 }}>
      {/* Delete button behind */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 100,
        background: '#DC412C', borderRadius: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {confirmed ? (
          <button
            onClick={onDelete}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: SYS, cursor: 'pointer', padding: '0 12px', textAlign: 'center', lineHeight: 1.3 }}>
            ¿Confirmar?
          </button>
        ) : (
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: SYS }}>Eliminar</span>
        )}
      </div>
      {/* Swipeable content */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: `translateX(${offset}px)`, transition: startX.current === null ? 'transform 0.25s ease' : 'none' }}>
        {children}
      </div>
    </div>
  )
}

export default function TourClient({
  tour: initialTour, shows: initialShows, travelDays: initialTravelDays, isAdmin, isOwner, tourMembers: initialTourMembers, userId,
}: {
  tour: { id: string; name: string; band_tag: string | null; invite_code_band: string | null; invite_code_artist: string | null; invite_code_crew: string | null; owner_id: string | null; band_logo_url: string | null }
  shows: Show[]
  travelDays: TravelDay[]
  isAdmin: boolean
  isOwner: boolean
  tourMembers: TourMember[]
  userId: string | null
}) {
  const router = useRouter()
  const supabase = createClient()
  const [tourName, setTourName] = useState(initialTour.name)
  const [editingName, setEditingName] = useState(false)
  const [shows, setShows] = useState<Show[]>(initialShows)
  const [travelDays, setTravelDays] = useState<TravelDay[]>(initialTravelDays)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [teamSheetOpen, setTeamSheetOpen] = useState(false)
  const [copiedBand, setCopiedBand] = useState(false)
  const [copiedArtist, setCopiedArtist] = useState(false)
  const [copiedCrew, setCopiedCrew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pressed, setPressed] = useState<string | null>(null)
  const [tab, setTab] = useState<'proximos' | 'historico'>('proximos')
  const [members, setMembers] = useState<TourMember[]>(initialTourMembers)
  const [rolePickerId, setRolePickerId] = useState<string | null>(null)
  const [confirmRoleChange, setConfirmRoleChange] = useState<{ memberId: string; newRole: string; name: string } | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<{ memberId: string; name: string } | null>(null)
  const [transferSheet, setTransferSheet] = useState(false)
  const [confirmTransfer, setConfirmTransfer] = useState<{ memberId: string; name: string } | null>(null)
  const [teamError, setTeamError] = useState<string | null>(null)
  const [bandLogoUrl, setBandLogoUrl] = useState<string | null>(initialTour.band_logo_url)
  const bandLogoInputRef = useRef<HTMLInputElement>(null)

  useScrollLock(sheetOpen || teamSheetOpen || transferSheet || !!confirmRoleChange || !!confirmRemove || !!confirmTransfer)
  const [form, setForm] = useState({
    venue_name: '', city: '', date: '', show_time: '', soundcheck_time: '',
  })

  function setF(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function saveTourName() {
    if (!tourName.trim() || tourName.trim() === initialTour.name) {
      setTourName(initialTour.name)
      setEditingName(false)
      return
    }
    await supabase.from('tours').update({ name: tourName.trim() }).eq('id', initialTour.id)
    setEditingName(false)
  }

  async function handleBandLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const filePath = `${initialTour.id}.jpg`
    const { error: upErr } = await supabase.storage.from('band-logos').upload(filePath, file, { upsert: true, contentType: file.type })
    if (upErr) { alert('Error al subir logo'); return }
    const { data: { publicUrl } } = supabase.storage.from('band-logos').getPublicUrl(filePath)
    const urlWithBust = publicUrl + '?t=' + Date.now()
    await supabase.from('tours').update({ band_logo_url: publicUrl }).eq('id', initialTour.id)
    setBandLogoUrl(urlWithBust)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.venue_name || !form.city || !form.date) return
    setSaving(true)
    const color = TOUR_COLORS[shows.length % TOUR_COLORS.length]
    const { data, error } = await supabase.from('shows').insert({
      tour_id: initialTour.id,
      venue_name: form.venue_name,
      city: form.city,
      date: form.date,
      show_time: form.show_time || null,
      soundcheck_time: form.soundcheck_time || null,
      status: 'pendiente',
      color,
    }).select().single()
    if (!error && data) {
      router.push(`/shows/${data.id}`)
    }
    setSaving(false)
  }

  async function handleDeleteShow(showId: string) {
    await supabase.from('shows').delete().eq('id', showId)
    setShows(s => s.filter(sh => sh.id !== showId))
  }

  async function handleDeleteTravel(travelId: string) {
    await supabase.from('travel_days').delete().eq('id', travelId)
    setTravelDays(t => t.filter(td => td.id !== travelId))
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    const member = members.find(m => m.id === memberId)
    if (!member) return
    if (newRole === 'admin') {
      setConfirmRoleChange({ memberId, newRole, name: member.profiles?.full_name ?? member.profiles?.username ?? 'este usuario' })
      setRolePickerId(null)
      return
    }
    setTeamError(null)
    const res = await fetch(`/api/tours/${initialTour.id}/members/${memberId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newRole }),
    })
    if (!res.ok) { const d = await res.json(); setTeamError(d.error ?? 'Error'); return }
    setMembers(ms => ms.map(m => m.id === memberId ? { ...m, role: newRole as TourMember['role'] } : m))
    setRolePickerId(null)
  }

  async function confirmRoleChangeNow() {
    if (!confirmRoleChange) return
    setTeamError(null)
    const res = await fetch(`/api/tours/${initialTour.id}/members/${confirmRoleChange.memberId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newRole: confirmRoleChange.newRole }),
    })
    if (!res.ok) { const d = await res.json(); setTeamError(d.error ?? 'Error'); setConfirmRoleChange(null); return }
    setMembers(ms => ms.map(m => m.id === confirmRoleChange.memberId ? { ...m, role: confirmRoleChange.newRole as TourMember['role'] } : m))
    setConfirmRoleChange(null)
  }

  async function handleRemoveMember(memberId: string) {
    setTeamError(null)
    const res = await fetch(`/api/tours/${initialTour.id}/members/${memberId}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json(); setTeamError(d.error ?? 'Error'); setConfirmRemove(null); return }
    setMembers(ms => ms.filter(m => m.id !== memberId))
    setConfirmRemove(null)
  }

  async function handleTransfer(memberId: string) {
    setTeamError(null)
    const res = await fetch(`/api/tours/${initialTour.id}/transfer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newOwnerMemberId: memberId }),
    })
    if (!res.ok) { const d = await res.json(); setTeamError(d.error ?? 'Error'); setConfirmTransfer(null); return }
    // Update local state: new owner gets 'owner', current user gets 'admin'
    setMembers(ms => ms.map(m => {
      if (m.id === memberId) return { ...m, role: 'owner' as TourMember['role'] }
      if (m.user_id === userId) return { ...m, role: 'admin' as TourMember['role'] }
      return m
    }))
    setConfirmTransfer(null)
    setTransferSheet(false)
  }

  function closeSheet() {
    setSheetOpen(false)
    setForm({ venue_name: '', city: '', date: '', show_time: '', soundcheck_time: '' })
  }

  const today = new Date().toISOString().split('T')[0]

  // Build intercalated list (all items)
  const allItems: ListItem[] = [
    ...shows.map((show, i) => ({ _type: 'show' as const, show, showIndex: i })),
    ...travelDays.map(travel => {
      const linkedShow = shows.find(s => s.id === travel.show_id)
      const showIndex = shows.findIndex(s => s.id === travel.show_id)
      const showColor = linkedShow?.color ?? TOUR_COLORS[showIndex % TOUR_COLORS.length] ?? TOUR_COLORS[0]
      return { _type: 'travel' as const, travel, showColor }
    }),
  ].sort((a, b) => {
    const dateA = a._type === 'show' ? a.show.date : a.travel.date
    const dateB = b._type === 'show' ? b.show.date : b.travel.date
    return dateA.localeCompare(dateB)
  })

  const proximosItems = allItems.filter(item => {
    const date = item._type === 'show' ? item.show.date : item.travel.date
    return date >= today
  })
  const historicoItems = [...allItems.filter(item => {
    const date = item._type === 'show' ? item.show.date : item.travel.date
    return date < today
  })].reverse()

  const items = tab === 'proximos' ? proximosItems : historicoItems

  const fechaLabel = shows.length === 1 ? '1 fecha' : `${shows.length} fechas`

  return (
    <div className="tp-page" style={{ minHeight: '100vh', background: '#fff', maxWidth: 390, margin: '0 auto', paddingBottom: 80, fontFamily: SYS }}>

      {/* Header */}
      <div style={{ padding: '48px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Tour Pilot" height={28} style={{ display: 'block', maxWidth: 140 }} />
        <Link href="/dashboard">
          <button style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 8, background: 'none', border: 'none', cursor: 'pointer', minHeight: 44, justifyContent: 'center' }}>
            <span style={{ display: 'block', width: 22, height: 2, background: '#1a1a1a', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#1a1a1a', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#1a1a1a', borderRadius: 2 }} />
          </button>
        </Link>
      </div>

      {/* Tour title — editable for admin */}
      <div style={{ padding: '16px 20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        {isAdmin && editingName ? (
          <input
            autoFocus
            value={tourName}
            onChange={e => setTourName(e.target.value)}
            onBlur={saveTourName}
            onKeyDown={e => { if (e.key === 'Enter') saveTourName(); if (e.key === 'Escape') { setTourName(initialTour.name); setEditingName(false) } }}
            style={{
              flex: 1, minWidth: 0, fontWeight: 800, fontSize: 22, color: '#1a1a1a',
              letterSpacing: '-0.02em', fontFamily: SYS, border: 'none', outline: 'none',
              background: '#F5F5F5', borderRadius: 10, padding: '4px 10px',
            }}
          />
        ) : (
          <p
            onClick={() => isAdmin && setEditingName(true)}
            style={{
              fontWeight: 800, fontSize: 22, color: '#1a1a1a', margin: 0,
              letterSpacing: '-0.02em', fontFamily: SYS, flex: 1, minWidth: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              cursor: isAdmin ? 'text' : 'default',
            }}>
            {tourName}
          </p>
        )}
        <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#1a1a1a', borderRadius: 20, padding: '4px 10px', flexShrink: 0, fontFamily: SYS, whiteSpace: 'nowrap' }}>{fechaLabel}</span>
        {bandLogoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bandLogoUrl} alt="Band logo" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        )}
        {isAdmin && (
          <button onClick={() => setTeamSheetOpen(true)} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
              <circle cx="8" cy="5" r="3.5" stroke="#1a1a1a" strokeWidth="1.5"/>
              <path d="M1 17c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="17" cy="5" r="2.5" stroke="#1a1a1a" strokeWidth="1.5"/>
              <path d="M15 17c0-2.21 1.79-4 4-4" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      {allItems.length > 0 && (
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 24 }}>
            {(['proximos', 'historico'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 8px 0',
                  fontSize: 14, fontFamily: SYS,
                  fontWeight: tab === t ? 700 : 400,
                  color: tab === t ? '#1a1a1a' : '#999',
                  borderBottom: tab === t ? '2px solid #1a1a1a' : '2px solid transparent',
                }}>
                {t === 'proximos' ? 'Próximos' : 'Histórico'}
              </button>
            ))}
          </div>
          <div style={{ height: '0.5px', background: '#F0F0F0' }} />
        </div>
      )}

      {/* List */}
      <div style={{ padding: '0 20px 48px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {allItems.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, paddingBottom: 32 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: '16px 0 6px', fontFamily: SYS, textAlign: 'center' }}>Sin fechas todavía</p>
            <p style={{ fontSize: 14, color: '#999', margin: '0 0 24px', fontFamily: SYS, textAlign: 'center' }}>Añade el primer concierto de esta gira</p>
            {isAdmin && (
              <button
                onClick={() => setSheetOpen(true)}
                style={{ height: 48, background: '#1a1a1a', border: 'none', borderRadius: 20, fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: SYS, padding: '0 28px', marginTop: 24 }}>
                + Añadir fecha
              </button>
            )}
          </div>
        )}

        {allItems.length > 0 && items.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 48, paddingBottom: 32 }}>
            {tab === 'proximos' ? (
              <>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p style={{ fontSize: 15, color: '#999', margin: '14px 0 0', fontFamily: SYS, textAlign: 'center' }}>No hay fechas próximas</p>
                {isAdmin && (
                  <button onClick={() => setSheetOpen(true)}
                    style={{ height: 44, background: '#1a1a1a', border: 'none', borderRadius: 20, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: SYS, padding: '0 24px', marginTop: 16 }}>
                    + Añadir fecha
                  </button>
                )}
              </>
            ) : (
              <p style={{ fontSize: 15, color: '#999', margin: 0, fontFamily: SYS, textAlign: 'center' }}>Sin fechas anteriores</p>
            )}
          </div>
        )}

        {items.map(item => {
          if (item._type === 'show') {
            const { show, showIndex } = item
            const card = (
              <Link key={show.id} href={`/shows/${show.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div
                  onMouseDown={() => setPressed(show.id)}
                  onMouseUp={() => setPressed(null)}
                  onMouseLeave={() => setPressed(null)}
                  onTouchStart={() => setPressed(show.id)}
                  onTouchEnd={() => setPressed(null)}
                  style={{
                    backgroundColor: show.color ?? TOUR_COLORS[showIndex % TOUR_COLORS.length],
                    borderRadius: 18, padding: '20px 16px', minHeight: 80,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 18,
                    position: 'relative',
                    opacity: tab === 'historico' ? 0.7 : 1,
                    transform: pressed === show.id ? 'scale(0.97)' : 'scale(1)',
                    transition: 'transform 0.15s ease',
                  }}>
                  <div style={{
                    width: 52, flexShrink: 0, background: 'rgba(255,255,255,0.25)', borderRadius: 10,
                    padding: '8px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', lineHeight: 1, fontFamily: SYS }}>{formatDay(show.date)}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1a1a1a', opacity: 0.65, marginTop: 2, fontFamily: SYS }}>{formatMonth(show.date)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: 0, lineHeight: 1.2, fontFamily: SYS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{show.venue_name}</p>
                    <p style={{ fontSize: 13, fontStyle: 'italic', color: '#1a1a1a', opacity: 0.6, margin: '4px 0 0 0', fontFamily: SYS }}>{show.city}</p>
                  </div>
                  {bandLogoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bandLogoUrl} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', position: 'absolute', top: 10, right: 36, flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 14, color: '#1a1a1a', opacity: 0.35, position: 'absolute', bottom: 14, right: 16, lineHeight: 1 }}>→</span>
                </div>
              </Link>
            )
            return card
          }

          // Travel day card
          const { travel, showColor } = item
          const travelCard = (
            <Link key={travel.id} href={`/travel/${travel.id}`} style={{ textDecoration: 'none' }}>
              <div
                onMouseDown={() => setPressed(travel.id)}
                onMouseUp={() => setPressed(null)}
                onMouseLeave={() => setPressed(null)}
                onTouchStart={() => setPressed(travel.id)}
                onTouchEnd={() => setPressed(null)}
                style={{
                  backgroundColor: showColor, opacity: 0.6,
                  borderRadius: 18, padding: '10px 16px', minHeight: 60,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 18,
                  position: 'relative',
                  transform: pressed === travel.id ? 'scale(0.97)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                }}>
                <div style={{
                  width: 52, flexShrink: 0, background: 'rgba(255,255,255,0.25)', borderRadius: 10,
                  padding: '6px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', lineHeight: 1, fontFamily: SYS }}>{formatDay(travel.date)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1a1a1a', opacity: 0.65, marginTop: 2, fontFamily: SYS }}>{formatMonth(travel.date)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, fontStyle: 'italic', color: '#1a1a1a', margin: 0, lineHeight: 1.2, fontFamily: SYS }}>Travel Day</p>
                  {travel.destination && (
                    <p style={{ fontSize: 13, color: '#1a1a1a', opacity: 0.65, margin: '3px 0 0 0', fontFamily: SYS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{travel.destination}</p>
                  )}
                </div>
                <span style={{ fontSize: 14, color: '#1a1a1a', opacity: 0.35, position: 'absolute', bottom: 10, right: 16, lineHeight: 1 }}>→</span>
              </div>
            </Link>
          )
          return travelCard
        })}

        {/* Add fecha — admin only, only in Próximos tab */}
        {isAdmin && tab === 'proximos' && allItems.length > 0 && (
          <button onClick={() => setSheetOpen(true)} style={{
            width: '100%', height: 64, background: 'transparent',
            border: '1.5px dashed #CCCCCC', borderRadius: 18,
            fontSize: 15, fontWeight: 600, color: '#999',
            cursor: 'pointer', fontFamily: SYS,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            + Añadir fecha
          </button>
        )}
      </div>

      {/* Team sheet */}
      <Portal>
        {isAdmin && teamSheetOpen && (
          <>
            <div onClick={() => setTeamSheetOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }} />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 44px', zIndex: 9999, maxHeight: '85dvh', overflowY: 'auto', WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}>

              {/* Identidad de la gira */}
              <p style={{ fontWeight: 700, fontSize: 13, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px 0', fontFamily: SYS }}>Identidad de la gira</p>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                <input ref={bandLogoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBandLogoChange} />
                <div
                  onClick={() => isAdmin && bandLogoInputRef.current?.click()}
                  style={{ width: 64, height: 64, borderRadius: '50%', background: bandLogoUrl ? 'transparent' : '#F5F5F5', cursor: isAdmin ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {bandLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bandLogoUrl} alt="Band logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  )}
                </div>
                <p style={{ fontSize: 12, color: '#999', margin: '6px 0 0 0', fontFamily: SYS }}>Logo de la banda</p>
              </div>

              {/* Equipo actual */}
              <p style={{ fontWeight: 700, fontSize: 13, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px 0', fontFamily: SYS }}>Equipo actual</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {members.map(member => {
                  const name = member.profiles?.full_name ?? member.profiles?.username ?? 'Usuario'
                  const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                  const avatarColors: Record<string, string> = { owner: '#1a1a1a', admin: '#333', band: '#A4B2DA', artist: '#B090F5', crew: '#D0B53C' }
                  const badgeBg: Record<string, string> = { owner: '#1a1a1a', admin: '#333', band: '#A4B2DA', artist: '#B090F5', crew: '#D0B53C' }
                  const badgeText: Record<string, string> = { owner: '#fff', admin: '#fff', band: '#1a1a1a', artist: '#fff', crew: '#1a1a1a' }
                  const roleLabels: Record<string, string> = { owner: 'Owner', admin: 'Admin', band: 'Banda', artist: 'Artista', crew: 'Crew' }
                  const isSelf = member.user_id === userId
                  const targetIsOwner = member.user_id === initialTour.owner_id || member.role === 'owner'
                  const effectiveRole = targetIsOwner ? 'owner' : member.role
                  const targetIsAdmin = effectiveRole === 'admin'
                  const avatarColor = avatarColors[effectiveRole] ?? '#999'
                  // who can delete/change-role this member?
                  const canEdit = !isSelf && !targetIsOwner && (isOwner || (isAdmin && !targetIsAdmin))
                  // which roles can be assigned (owner can assign admin/band/artist/crew to non-owners)
                  const assignableRoles = ['admin', 'band', 'artist', 'crew']
                  return (
                    <div key={member.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Trash */}
                        {canEdit ? (
                          <button onClick={() => setConfirmRemove({ memberId: member.id, name })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#CCC', flexShrink: 0, minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        ) : (
                          <div style={{ width: 28, flexShrink: 0 }} />
                        )}
                        {/* Avatar */}
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: SYS }}>{initials}</span>
                        </div>
                        {/* Name */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', margin: '0 0 1px 0', fontFamily: SYS }}>
                            {targetIsOwner && <span style={{ marginRight: 4 }}>♛</span>}{name}
                          </p>
                          {member.profiles?.username && (
                            <p style={{ fontSize: 13, color: '#999', margin: 0, fontFamily: SYS }}>@{member.profiles.username}</p>
                          )}
                        </div>
                        {/* Role badge */}
                        <button
                          onClick={() => canEdit ? setRolePickerId(rolePickerId === member.id ? null : member.id) : undefined}
                          style={{ fontSize: 10, fontWeight: 700, color: badgeText[effectiveRole] ?? '#fff', background: badgeBg[effectiveRole] ?? '#999', borderRadius: 20, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: SYS, flexShrink: 0, border: 'none', cursor: canEdit ? 'pointer' : 'default' }}>
                          {roleLabels[effectiveRole] ?? effectiveRole}
                        </button>
                      </div>
                      {/* Inline role picker */}
                      {rolePickerId === member.id && (
                        <div style={{ marginLeft: 68, marginTop: 8, background: '#F5F5F5', borderRadius: 12, overflow: 'hidden' }}>
                          {assignableRoles.map((r, i) => (
                            <button key={r} onClick={() => {
                              if (r === member.role) { setRolePickerId(null); return }
                              handleRoleChange(member.id, r)
                            }}
                              style={{
                                width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none',
                                borderBottom: i < assignableRoles.length - 1 ? '0.5px solid #E8E8E8' : 'none',
                                fontSize: 14, fontWeight: r === member.role ? 700 : 400,
                                color: avatarColors[r] ?? '#1a1a1a',
                                cursor: 'pointer', fontFamily: SYS, display: 'flex', alignItems: 'center', gap: 8,
                              }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: avatarColors[r] ?? '#999', flexShrink: 0, display: 'inline-block' }} />
                              {roleLabels[r]}
                              {r === member.role && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#999' }}>✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
                {members.length === 0 && (
                  <p style={{ fontSize: 14, color: '#999', margin: 0, fontFamily: SYS }}>Sin miembros en esta gira</p>
                )}
              </div>

              {/* Team error */}
              {teamError && <p style={{ fontSize: 13, color: '#DC412C', margin: '0 0 12px', fontFamily: SYS }}>{teamError}</p>}

              {/* Confirm role → admin */}
              {confirmRoleChange && (
                <div style={{ background: '#F5F5F5', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
                  <p style={{ fontSize: 14, color: '#1a1a1a', margin: '0 0 12px', fontFamily: SYS, lineHeight: 1.4 }}>
                    ¿Hacer admin a <strong>{confirmRoleChange.name}</strong>? Tendrá acceso de gestión en esta gira.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setConfirmRoleChange(null)}
                      style={{ flex: 1, height: 40, background: '#E0E0E0', border: 'none', borderRadius: 10, fontSize: 14, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS }}>
                      Cancelar
                    </button>
                    <button onClick={confirmRoleChangeNow}
                      style={{ flex: 1, height: 40, background: '#1a1a1a', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: SYS }}>
                      Confirmar
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm remove member */}
              {confirmRemove && (
                <div style={{ background: '#FFF3F3', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
                  <p style={{ fontSize: 14, color: '#1a1a1a', margin: '0 0 12px', fontFamily: SYS, lineHeight: 1.4 }}>
                    ¿Eliminar a <strong>{confirmRemove.name}</strong> de la gira?
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setConfirmRemove(null)}
                      style={{ flex: 1, height: 40, background: '#F5F5F5', border: 'none', borderRadius: 10, fontSize: 14, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS }}>
                      Cancelar
                    </button>
                    <button onClick={() => handleRemoveMember(confirmRemove.memberId)}
                      style={{ flex: 1, height: 40, background: '#DC412C', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: SYS }}>
                      Eliminar
                    </button>
                  </div>
                </div>
              )}

              {/* Transfer ownership — only for owner */}
              {isOwner && !transferSheet && !confirmTransfer && (
                <div style={{ marginBottom: 16 }}>
                  <button onClick={() => setTransferSheet(true)}
                    style={{ fontSize: 13, color: '#999', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS, padding: '4px 0' }}>
                    Transferir propiedad
                  </button>
                </div>
              )}

              {/* Transfer: pick new owner */}
              {isOwner && transferSheet && !confirmTransfer && (
                <div style={{ background: '#F5F5F5', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px', fontFamily: SYS }}>Transferir propiedad a…</p>
                  {members.filter(m => m.role === 'admin').length === 0 && (
                    <p style={{ fontSize: 13, color: '#999', margin: 0, fontFamily: SYS }}>No hay admins disponibles. Primero asigna rol Admin a alguien.</p>
                  )}
                  {members.filter(m => m.role === 'admin').map(m => {
                    const n = m.profiles?.full_name ?? m.profiles?.username ?? 'Usuario'
                    return (
                      <button key={m.id} onClick={() => setConfirmTransfer({ memberId: m.id, name: n })}
                        style={{ width: '100%', textAlign: 'left', padding: '10px 0', background: 'none', border: 'none', borderBottom: '0.5px solid #E8E8E8', fontSize: 14, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS }}>
                        {n}
                      </button>
                    )
                  })}
                  <button onClick={() => setTransferSheet(false)}
                    style={{ fontSize: 13, color: '#999', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SYS, padding: '10px 0 0 0' }}>
                    Cancelar
                  </button>
                </div>
              )}

              {/* Confirm transfer */}
              {confirmTransfer && (
                <div style={{ background: '#FFF3F3', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
                  <p style={{ fontSize: 14, color: '#1a1a1a', margin: '0 0 12px', fontFamily: SYS, lineHeight: 1.4 }}>
                    ¿Transferir la propiedad a <strong>{confirmTransfer.name}</strong>? Perderás el control total de esta gira.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => { setConfirmTransfer(null); setTransferSheet(false) }}
                      style={{ flex: 1, height: 40, background: '#F5F5F5', border: 'none', borderRadius: 10, fontSize: 14, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS }}>
                      Cancelar
                    </button>
                    <button onClick={() => handleTransfer(confirmTransfer.memberId)}
                      style={{ flex: 1, height: 40, background: '#DC412C', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: SYS }}>
                      Transferir
                    </button>
                  </div>
                </div>
              )}

              {/* Separador */}
              <div style={{ height: 1, background: '#F0F0F0', margin: '0 0 24px' }} />

              {/* Códigos fijos */}
              <p style={{ fontWeight: 700, fontSize: 13, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px 0', fontFamily: SYS }}>Invitar al equipo</p>
              <p style={{ fontSize: 13, color: '#999', margin: '0 0 20px', fontFamily: SYS }}>Comparte este código para que se unan</p>

              {/* Código Artista */}
              <div style={{ background: '#F5F5F5', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#B090F5', margin: '0 0 4px', fontFamily: SYS }}>Código Artista</p>
                <p style={{ fontSize: 11, color: '#999', margin: '0 0 10px', fontFamily: SYS }}>Artista o artistas principales de la gira</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '0.4em', color: '#1a1a1a', fontFamily: 'monospace' }}>
                    {initialTour.invite_code_artist ?? '—'}
                  </span>
                  {initialTour.invite_code_artist && (
                    <button
                      onClick={() => copyToClipboard(initialTour.invite_code_artist!, () => { setCopiedArtist(true); setTimeout(() => setCopiedArtist(false), 2000) })}
                      style={{ height: 36, padding: '0 16px', background: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: copiedArtist ? '#2ECC71' : '#1a1a1a', cursor: 'pointer', fontFamily: SYS, transition: 'color 0.2s', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {copiedArtist ? '¡Copiado! ✓' : 'Copiar'}
                    </button>
                  )}
                </div>
              </div>

              {/* Código Banda */}
              <div style={{ background: '#F5F5F5', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A4B2DA', margin: '0 0 4px', fontFamily: SYS }}>Código Banda</p>
                <p style={{ fontSize: 11, color: '#999', margin: '0 0 10px', fontFamily: SYS }}>Músicos que acompañan al artista</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '0.4em', color: '#1a1a1a', fontFamily: 'monospace' }}>
                    {initialTour.invite_code_band ?? '—'}
                  </span>
                  {initialTour.invite_code_band && (
                    <button
                      onClick={() => copyToClipboard(initialTour.invite_code_band!, () => { setCopiedBand(true); setTimeout(() => setCopiedBand(false), 2000) })}
                      style={{ height: 36, padding: '0 16px', background: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: copiedBand ? '#2ECC71' : '#1a1a1a', cursor: 'pointer', fontFamily: SYS, transition: 'color 0.2s', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {copiedBand ? '¡Copiado! ✓' : 'Copiar'}
                    </button>
                  )}
                </div>
              </div>

              {/* Código Crew */}
              <div style={{ background: '#F5F5F5', borderRadius: 14, padding: '16px', marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#D0B53C', margin: '0 0 4px', fontFamily: SYS }}>Código Crew</p>
                <p style={{ fontSize: 11, color: '#999', margin: '0 0 10px', fontFamily: SYS }}>Crew de la gira</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '0.4em', color: '#1a1a1a', fontFamily: 'monospace' }}>
                    {initialTour.invite_code_crew ?? '—'}
                  </span>
                  {initialTour.invite_code_crew && (
                    <button
                      onClick={() => copyToClipboard(initialTour.invite_code_crew!, () => { setCopiedCrew(true); setTimeout(() => setCopiedCrew(false), 2000) })}
                      style={{ height: 36, padding: '0 16px', background: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: copiedCrew ? '#2ECC71' : '#1a1a1a', cursor: 'pointer', fontFamily: SYS, transition: 'color 0.2s', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {copiedCrew ? '¡Copiado! ✓' : 'Copiar'}
                    </button>
                  )}
                </div>
              </div>

              <button onClick={() => setTeamSheetOpen(false)} style={{ width: '100%', height: 52, background: '#F5F5F5', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 500, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS }}>
                Cerrar
              </button>
            </div>
          </>
        )}
      </Portal>

      {/* Add show sheet */}
      <Portal>
        {sheetOpen && (
          <>
            <div onClick={closeSheet} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }} />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, top: 'auto', background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 44px', zIndex: 9999, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}>
              <p style={{ fontWeight: 700, fontSize: 18, margin: '0 0 20px 0', fontFamily: SYS }}>Nueva fecha</p>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <p style={{ fontSize: 11, color: '#999', margin: '0 0 6px 0', fontFamily: SYS, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Venue *</p>
                  <input autoFocus value={form.venue_name} onChange={e => setF('venue_name', e.target.value)}
                    placeholder="Nombre del recinto" style={{ width: '100%', height: 48, background: '#F5F5F5', border: 'none', borderRadius: 12, padding: '0 14px', fontSize: 16, fontFamily: SYS, boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#999', margin: '0 0 6px 0', fontFamily: SYS, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ciudad *</p>
                  <input value={form.city} onChange={e => setF('city', e.target.value)}
                    placeholder="Ciudad" style={{ width: '100%', height: 48, background: '#F5F5F5', border: 'none', borderRadius: 12, padding: '0 14px', fontSize: 16, fontFamily: SYS, boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#999', margin: '0 0 6px 0', fontFamily: SYS, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fecha *</p>
                  <input type="date" value={form.date} onChange={e => setF('date', e.target.value)}
                    style={{ width: '100%', height: 48, background: '#F5F5F5', border: 'none', borderRadius: 12, padding: '0 14px', fontSize: 16, fontFamily: SYS, boxSizing: 'border-box', outline: 'none', appearance: 'none', WebkitAppearance: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={closeSheet}
                    style={{ flex: 1, height: 48, background: '#F5F5F5', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 500, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving || !form.venue_name || !form.city || !form.date}
                    style={{ flex: 1, height: 48, background: '#1a1a1a', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: SYS, opacity: (saving || !form.venue_name || !form.city || !form.date) ? 0.4 : 1 }}>
                    {saving ? '…' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </Portal>
    </div>
  )
}
