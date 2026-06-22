'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Tour, TOUR_COLORS } from '@/lib/types'

const SYS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
const DAYS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

interface CalEvent {
  id: string
  type: 'show' | 'travel'
  date: string
  label: string
  tour_id: string
  show_time?: string | null
  venue_name?: string
  city?: string
  destination?: string | null
  show_id?: string
}

interface Props {
  tours: Tour[]
  shows: Array<{ id: string; tour_id: string; date: string; venue_name: string; city: string; show_time?: string | null }>
  travelDays: Array<{ id: string; show_id: string; date: string; destination: string | null; tour_id: string }>
}

function getTourColor(tours: Tour[], tourId: string): string {
  const idx = tours.findIndex(t => t.id === tourId)
  return TOUR_COLORS[Math.max(idx, 0) % TOUR_COLORS.length]
}

// Returns monday-based week grid for a given month
function buildCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  // Monday = 0 ... Sunday = 6
  const startDow = (firstDay.getDay() + 6) % 7
  const days: Date[] = []
  for (let i = 0; i < startDow; i++) {
    days.push(new Date(year, month, 1 - (startDow - i)))
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i))
    }
  }
  return days
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(children, document.body)
}

export default function CalendarView({ tours, shows, travelDays }: Props) {
  const router = useRouter()
  const today = new Date()
  const todayIso = toIso(today)
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => new Set(tours.map(t => t.id)))
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const calDays = buildCalendarDays(year, month)

  // Build event map keyed by ISO date
  const eventMap: Record<string, CalEvent[]> = {}
  for (const s of shows) {
    if (!activeFilters.has(s.tour_id)) continue
    if (!eventMap[s.date]) eventMap[s.date] = []
    eventMap[s.date].push({
      id: s.id,
      type: 'show',
      date: s.date,
      label: (s.venue_name ?? '').slice(0, 8),
      tour_id: s.tour_id,
      show_time: s.show_time,
      venue_name: s.venue_name,
      city: s.city,
    })
  }
  for (const td of travelDays) {
    if (!activeFilters.has(td.tour_id)) continue
    if (!eventMap[td.date]) eventMap[td.date] = []
    eventMap[td.date].push({
      id: td.id,
      type: 'travel',
      date: td.date,
      label: 'Travel',
      tour_id: td.tour_id,
      destination: td.destination,
      show_id: td.show_id,
    })
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }
  function toggleFilter(id: string) {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedEvents = selectedDay ? (eventMap[selectedDay] ?? []) : []

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 16px' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', fontFamily: SYS }}>
          {MONTHS_ES[month]} {year}
        </span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Tour filters */}
      {tours.length > 1 && (
        <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {tours.map((tour, i) => {
            const color = TOUR_COLORS[i % TOUR_COLORS.length]
            const active = activeFilters.has(tour.id)
            return (
              <button
                key={tour.id}
                onClick={() => toggleFilter(tour.id)}
                style={{
                  flexShrink: 0, background: color, border: 'none',
                  borderRadius: 20, padding: '5px 12px',
                  fontSize: 12, fontWeight: 600, color: '#1a1a1a',
                  cursor: 'pointer', fontFamily: SYS,
                  opacity: active ? 1 : 0.35,
                  transition: 'opacity 0.15s',
                }}
              >
                {tour.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 12px', marginBottom: 4 }}>
        {DAYS_ES.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#999', fontFamily: SYS, padding: '4px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 12px', gap: '2px 0' }}>
        {calDays.map((d, i) => {
          const iso = toIso(d)
          const isCurrentMonth = d.getMonth() === month
          const isToday = iso === todayIso
          const events = eventMap[iso] ?? []
          const hasEvents = events.length > 0
          const visible2 = events.slice(0, 2)
          const extra = events.length - 2

          return (
            <div
              key={i}
              onClick={() => hasEvents && setSelectedDay(iso)}
              style={{
                minHeight: 52, padding: '6px 3px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                opacity: isCurrentMonth ? 1 : 0.3,
                cursor: hasEvents ? 'pointer' : 'default',
              }}
            >
              {/* Day number */}
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: isToday ? '#1a1a1a' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 2,
              }}>
                <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? '#fff' : '#1a1a1a', fontFamily: SYS }}>
                  {d.getDate()}
                </span>
              </div>

              {/* Event pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', alignItems: 'center' }}>
                {visible2.map((ev, j) => (
                  <div
                    key={j}
                    style={{
                      background: getTourColor(tours, ev.tour_id),
                      borderRadius: 4, padding: '1px 4px',
                      fontSize: 9, fontWeight: 600, color: '#1a1a1a',
                      fontFamily: SYS, lineHeight: 1.4,
                      maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontStyle: ev.type === 'travel' ? 'italic' : 'normal',
                    }}
                  >
                    {ev.label}
                  </div>
                ))}
                {extra > 0 && (
                  <span style={{ fontSize: 9, color: '#999', fontFamily: SYS, lineHeight: 1.4 }}>+{extra} más</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Day detail bottom sheet */}
      <Portal>
        {selectedDay && (
          <>
            <div
              onClick={() => setSelectedDay(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998 }}
            />
            <div style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: '#fff', borderRadius: '20px 20px 0 0',
              padding: '24px 0 40px', zIndex: 9999,
              maxHeight: '70vh', overflowY: 'auto',
            }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px', fontFamily: SYS, padding: '0 20px' }}>
                {new Date(selectedDay + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {selectedEvents.map((ev, i) => {
                  const color = getTourColor(tours, ev.tour_id)
                  const tour = tours.find(t => t.id === ev.tour_id)
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedDay(null)
                        if (ev.type === 'show') router.push(`/shows/${ev.id}`)
                        else if (ev.show_id) router.push(`/shows/${ev.show_id}`)
                      }}
                      style={{
                        display: 'flex', alignItems: 'stretch',
                        background: 'none', border: 'none', cursor: 'pointer',
                        width: '100%', textAlign: 'left', padding: '0 20px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'stretch', width: '100%', background: '#FAFAFA', borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ width: 3, background: color, flexShrink: 0 }} />
                        <div style={{ padding: '12px 14px', flex: 1 }}>
                          <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0, fontFamily: SYS }}>
                            {ev.type === 'show' ? ev.venue_name : (ev.destination ?? 'Travel Day')}
                          </p>
                          <p style={{ fontSize: 12, color: '#999', margin: '2px 0 0', fontFamily: SYS }}>
                            {ev.type === 'show'
                              ? [ev.city, ev.show_time ? ev.show_time.slice(0, 5) : null].filter(Boolean).join(' · ')
                              : 'Travel Day'}
                          </p>
                          {tour && (
                            <p style={{ fontSize: 11, color: '#BBB', margin: '2px 0 0', fontFamily: SYS }}>{tour.name}</p>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', paddingRight: 14 }}>
                          <span style={{ fontSize: 18, color: '#CCC' }}>›</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setSelectedDay(null)}
                style={{
                  width: 'calc(100% - 40px)', margin: '20px 20px 0', height: 48,
                  background: '#F5F5F5', border: 'none', borderRadius: 14,
                  fontSize: 16, fontWeight: 500, color: '#1a1a1a', cursor: 'pointer', fontFamily: SYS,
                }}
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </Portal>
    </div>
  )
}
