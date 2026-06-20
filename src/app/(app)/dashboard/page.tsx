import { createClient } from '@/lib/supabase/server'
import { Tour, Show, TOUR_COLORS } from '@/lib/types'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: memberships }, { data: profile }] = await Promise.all([
    supabase.from('tour_members').select('tour_id, role').eq('user_id', user.id),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  const tourIds = memberships?.map(m => m.tour_id) ?? []

  const adminTourIds = (memberships ?? []).filter(m => m.role === 'admin').map(m => m.tour_id)

  if (tourIds.length === 0) {
    return (
      <DashboardClient
        tours={[]}
        tourStats={{}}
        nextShow={null}
        isAdmin={true}
        adminTourIds={[]}
      />
    )
  }

  const [{ data: tours }, { data: allShows }] = await Promise.all([
    supabase.from('tours').select('*').in('id', tourIds).order('created_at', { ascending: true }),
    supabase.from('shows').select('id, tour_id, date, venue_name, city, color').in('tour_id', tourIds).order('date', { ascending: true }),
  ])

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

  const nextShowTourIndex = nextShow ? tourList.findIndex(t => t.id === nextShow.tour_id) : -1
  const nextShowColor = nextShow ? (nextShow.color ?? TOUR_COLORS[nextShowTourIndex % TOUR_COLORS.length]) : null
  const nextShowTour = nextShow ? tourList.find(t => t.id === nextShow.tour_id) ?? null : null

  return (
    <DashboardClient
      tours={tourList}
      tourStats={tourStats}
      nextShow={nextShow ? {
        id: nextShow.id,
        venue_name: nextShow.venue_name,
        city: nextShow.city,
        date: nextShow.date,
        color: nextShowColor,
        tourName: nextShowTour?.name ?? null,
      } : null}
      isAdmin={true}
      adminTourIds={adminTourIds}
    />
  )
}
