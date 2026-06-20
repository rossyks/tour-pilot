import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Show, TourMember, TicketVisibility, ScheduleVisibility, TOUR_COLORS } from '@/lib/types'
import ShowDetail from './ShowDetail'

export default async function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: show }, { data: { user } }] = await Promise.all([
    supabase.from('shows')
      .select('*, contacts(*), schedule_items(*), documents(*)')
      .eq('id', id).single(),
    supabase.auth.getUser(),
  ])

  if (!show) notFound()

  const [{ data: tour }, { data: tourMembers }, { data: tourShows }] = await Promise.all([
    supabase.from('tours').select('id, name, band_logo_url').eq('id', show.tour_id).single(),
    supabase.from('tour_members').select('*, profiles(id, full_name, username, avatar_url)').eq('tour_id', show.tour_id),
    supabase.from('shows').select('id').eq('tour_id', show.tour_id).order('date', { ascending: true }),
  ])

  const showIndex = (tourShows ?? []).findIndex((s: { id: string }) => s.id === id)
  const showColor = show.color ?? TOUR_COLORS[Math.max(showIndex, 0) % TOUR_COLORS.length]

  const myMembership = user
    ? (tourMembers ?? []).find((m: { user_id: string; role: string }) => m.user_id === user.id)
    : null
  const isAdmin = myMembership?.role === 'admin' || myMembership?.role === 'owner'

  // Fetch all visibility entries for this show's docs and schedule items
  const ticketDocIds = (show.documents ?? []).filter((d: { type: string }) => d.type === 'ticket').map((d: { id: string }) => d.id)
  const schedItemIds = (show.schedule_items ?? []).map((s: { id: string }) => s.id)

  const [{ data: ticketVisibility }, { data: scheduleVisibility }] = await Promise.all([
    ticketDocIds.length > 0
      ? supabase.from('ticket_visibility').select('*').in('document_id', ticketDocIds)
      : Promise.resolve({ data: [] }),
    schedItemIds.length > 0
      ? supabase.from('schedule_visibility').select('*').in('schedule_item_id', schedItemIds)
      : Promise.resolve({ data: [] }),
  ])

  return (
    <ShowDetail
      show={show as Show}
      isAdmin={isAdmin}
      tourId={tour?.id ?? ''}
      userId={user?.id ?? null}
      tourMembers={(tourMembers ?? []) as TourMember[]}
      ticketVisibility={(ticketVisibility ?? []) as TicketVisibility[]}
      scheduleVisibility={(scheduleVisibility ?? []) as ScheduleVisibility[]}
      color={showColor}
      bandLogoUrl={tour?.band_logo_url ?? null}
    />
  )
}
