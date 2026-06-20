import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ tourId: string }> }

// POST /api/tours/[tourId]/transfer — transfer ownership to another member
export async function POST(req: NextRequest, { params }: Params) {
  const { tourId } = await params
  const { newOwnerMemberId } = await req.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Actor must be current owner
  const { data: actorMember } = await supabase
    .from('tour_members')
    .select('id, role')
    .eq('tour_id', tourId)
    .eq('user_id', user.id)
    .single()

  if (!actorMember || actorMember.role !== 'owner') {
    return NextResponse.json({ error: 'Solo el propietario puede transferir la propiedad' }, { status: 403 })
  }

  // Get new owner's membership
  const { data: newOwnerMember } = await supabase
    .from('tour_members')
    .select('id, user_id, role')
    .eq('id', newOwnerMemberId)
    .eq('tour_id', tourId)
    .single()

  if (!newOwnerMember) {
    return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })
  }

  // Execute transfer: new owner → 'owner', actor → 'admin', update tours.owner_id
  const [r1, r2, r3] = await Promise.all([
    supabase.from('tour_members').update({ role: 'owner' }).eq('id', newOwnerMemberId),
    supabase.from('tour_members').update({ role: 'admin' }).eq('id', actorMember.id),
    supabase.from('tours').update({ owner_id: newOwnerMember.user_id }).eq('id', tourId),
  ])

  const err = r1.error ?? r2.error ?? r3.error
  if (err) return NextResponse.json({ error: err.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
