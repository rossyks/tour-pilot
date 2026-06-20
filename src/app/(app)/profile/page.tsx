import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, username, band, role, avatar_url').eq('id', user.id).single(),
    supabase.from('tour_members').select('role, tours(id, name, created_at)').eq('user_id', user.id),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (
    <ProfileClient
      email={user.email ?? ''}
      profile={profile}
      memberships={(memberships ?? []) as any}
      createdAt={user.created_at}
    />
  )
}
