import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TravelDay, TravelScheduleItem, TravelDocument } from '@/lib/types'
import TravelClient from './TravelClient'

export default async function TravelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: travelDay } = await supabase
    .from('travel_days').select('*').eq('id', id).single()
  if (!travelDay) notFound()

  const [
    { data: show },
    { data: scheduleItems },
    { data: documents },
    { data: { user } },
  ] = await Promise.all([
    supabase.from('shows').select('color, tour_id').eq('id', travelDay.show_id).single(),
    supabase.from('travel_schedule_items').select('*').eq('travel_day_id', id).order('time_start', { ascending: true }),
    supabase.from('travel_documents').select('*').eq('travel_day_id', id).order('created_at', { ascending: true }),
    supabase.auth.getUser(),
  ])

  const tourId = show?.tour_id ?? null

  const { data: membership } = user && tourId
    ? await supabase.from('tour_members').select('role').eq('tour_id', tourId).eq('user_id', user.id).single()
    : { data: null }

  const isAdmin = membership?.role === 'admin' || membership?.role === 'owner'

  return (
    <TravelClient
      travelDay={travelDay as TravelDay}
      showColor={show?.color ?? null}
      tourId={tourId}
      scheduleItems={(scheduleItems ?? []) as TravelScheduleItem[]}
      documents={(documents ?? []) as TravelDocument[]}
      isAdmin={isAdmin}
    />
  )
}
