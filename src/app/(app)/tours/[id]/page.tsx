import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Show, TravelDay, TourMember } from '@/lib/types'
import TourClient from './TourClient'

export default async function TourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: tour }, { data: { user } }] = await Promise.all([
    supabase.from('tours').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
  ])
  if (!tour) notFound()

  const [{ data: shows }, { data: tourMembers }] = await Promise.all([
    supabase.from('shows').select('*').eq('tour_id', id).order('date', { ascending: true }),
    supabase.from('tour_members').select('*, profiles(id, full_name, username, avatar_url)').eq('tour_id', id),
  ])

  const showIds = (shows ?? []).map((s: Show) => s.id)
  const { data: travelDays } = showIds.length
    ? await supabase.from('travel_days').select('*').in('show_id', showIds)
    : { data: [] }

  const myMembership = user
    ? (tourMembers ?? []).find((m: TourMember) => m.user_id === user.id)
    : null
  const isAdmin = myMembership?.role === 'admin' || myMembership?.role === 'owner'
  const isOwner = myMembership?.role === 'owner'

  return (
    <TourClient
      tour={tour}
      shows={(shows ?? []) as Show[]}
      travelDays={(travelDays ?? []) as TravelDay[]}
      isAdmin={isAdmin}
      isOwner={isOwner}
      tourMembers={(tourMembers ?? []) as TourMember[]}
      userId={user?.id ?? null}
    />
  )
}
