import { createClient } from '@/lib/supabase/server'
import { Tour, Show, TOUR_COLORS } from '@/lib/types'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: memberships }, { data: profile }] = await Promise.all([
    supabase.from('tour_members').select('tour_id, role').eq('user_id', user.id),
    supabase.from('profiles').select('role, full_name').eq('id', user.id).single(),
  ])

  const tourIds = memberships?.map(m => m.tour_id) ?? []
  const adminTourIds = (memberships ?? []).filter(m => m.role === 'admin' || m.role === 'owner').map(m => m.tour_id)

  if (tourIds.length === 0) {
    return (
      <DashboardClient
        tours={[]}
        tourStats={{}}
        nextShow={null}
        isAdmin={true}
        adminTourIds={[]}
        userName={profile?.full_name ?? null}
        allShows={[]}
        allTravelDays={[]}
      />
    )
  }

  const [{ data: tours }, { data: allShows }] = await Promise.all([
    supabase.from('tours').select('*').in('id', tourIds).order('created_at', { ascending: true }),
    supabase.from('shows').select('id, tour_id, date, venue_name, city, color, show_time, show_duration').in('tour_id', tourIds).order('date', { ascending: true }),
  ])

  const showIds = (allShows ?? []).map(s => s.id)
  const { data: allTravelDays } = showIds.length > 0
    ? await supabase.from('travel_days').select('id, show_id, date, destination').in('show_id', showIds)
    : { data: [] }

  // Resolve tour_id for each travel day via show lookup
  const showTourMap: Record<string, string> = {}
  for (const s of allShows ?? []) showTourMap[s.id] = s.tour_id
  const travelDaysWithTour = (allTravelDays ?? []).map(td => ({
    ...td,
    tour_id: showTourMap[td.show_id] ?? '',
  }))

  const today = new Date().toISOString().split('T')[0]
  const tourList = (tours ?? []) as Tour[]
  const showList = (allShows ?? []) as (Show & { tour_id: string })[]

  const upcomingShows = showList.filter(s => s.date >= today)
  const nextShow = upcomingShows.length > 0 ? upcomingShows[0] : null

  const tourStats: Record<string, { count: number; nextDate: string | null }> = {}
  for (const tour of tourList) {
    const tourShows = showList.filter(s => s.tour_id === tour.id)
    const future = tourShows.filter(s => s.date >= today)
    tourStats[tour.id] = {
      count: tourShows.length,
      nextDate: future.length > 0 ? future[0].date : null,
    }
  }

  const nextShowColor = (() => {
    if (!nextShow) return null
    const tourShows = showList.filter(s => s.tour_id === nextShow.tour_id).sort((a, b) => a.date.localeCompare(b.date))
    const idx = tourShows.findIndex(s => s.id === nextShow.id)
    return TOUR_COLORS[Math.max(idx, 0) % TOUR_COLORS.length]
  })()
  const nextShowTour = nextShow ? tourList.find(t => t.id === nextShow.tour_id) ?? null : null

  return (
    <DashboardClient
      tours={tourList}
      tourStats={tourStats}
      userName={profile?.full_name ?? null}
      nextShow={nextShow ? {
        id: nextShow.id,
        venue_name: nextShow.venue_name,
        city: nextShow.city,
        date: nextShow.date,
        color: nextShowColor,
        tourName: nextShowTour?.name ?? null,
        show_time: nextShow.show_time ?? null,
        show_duration: nextShow.show_duration ?? null,
      } : null}
      isAdmin={true}
      adminTourIds={adminTourIds}
      allShows={showList.map(s => ({ id: s.id, tour_id: s.tour_id, date: s.date, venue_name: s.venue_name, city: s.city, show_time: s.show_time ?? null }))}
      allTravelDays={travelDaysWithTour}
    />
  )
}
