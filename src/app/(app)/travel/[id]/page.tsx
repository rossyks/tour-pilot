import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TravelDay, TravelScheduleItem, TravelDocument, TOUR_COLORS } from '@/lib/types'
import TravelClient from './TravelClient'

export default async function TravelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: travelDay } = await supabase
    .from('travel_days').select('*').eq('id', id).single()
  if (!travelDay) notFound()

  // Get linked show to find tour_id
  const { data: linkedShow } = await supabase
    .from('shows').select('id, date, tour_id').eq('id', travelDay.show_id).single()

  const tourId = linkedShow?.tour_id ?? null

  const [
    { data: tourShows },
    { data: scheduleItems },
    { data: documents },
    { data: { user } },
  ] = await Promise.all([
    tourId
      ? supabase.from('shows').select('id, date').eq('tour_id', tourId).order('date', { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase.from('travel_schedule_items').select('*').eq('travel_day_id', id).order('time_start', { ascending: true }),
    supabase.from('travel_documents').select('*').eq('travel_day_id', id).order('created_at', { ascending: true }),
    supabase.auth.getUser(),
  ])

  // Compute color by position of linked show in date-sorted tour shows
  const showIndex = (tourShows ?? []).findIndex((s: { id: string }) => s.id === travelDay.show_id)
  const showColor = TOUR_COLORS[Math.max(showIndex, 0) % TOUR_COLORS.length]

  const { data: membership } = user && tourId
    ? await supabase.from('tour_members').select('role').eq('tour_id', tourId).eq('user_id', user.id).single()
    : { data: null }

  const isAdmin = membership?.role === 'admin' || membership?.role === 'owner'

  return (
    <TravelClient
      travelDay={travelDay as TravelDay}
      showColor={showColor}
      tourId={tourId}
      scheduleItems={(scheduleItems ?? []) as TravelScheduleItem[]}
      documents={(documents ?? []) as TravelDocument[]}
      isAdmin={isAdmin}
    />
  )
}
