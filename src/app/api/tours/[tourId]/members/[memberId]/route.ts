import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ tourId: string; memberId: string }> }

const ROLE_RANK: Record<string, number> = { owner: 4, admin: 3, band: 2, artist: 1, crew: 0 }

async function getActorMembership(supabase: Awaited<ReturnType<typeof createClient>>, tourId: string, userId: string) {
  const { data } = await supabase
    .from('tour_members')
    .select('role')
    .eq('tour_id', tourId)
    .eq('user_id', userId)
    .single()
  return data
}

// PATCH /api/tours/[tourId]/members/[memberId] — change role
export async function PATCH(req: NextRequest, { params }: Params) {
  const { tourId, memberId } = await params
  const { newRole } = await req.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const actor = await getActorMembership(supabase, tourId, user.id)
  if (!actor) return NextResponse.json({ error: 'No eres miembro de esta gira' }, { status: 403 })

  const { data: target } = await supabase
    .from('tour_members')
    .select('role, user_id')
    .eq('id', memberId)
    .single()
  if (!target) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })

  if (target.user_id === user.id) {
    return NextResponse.json({ error: 'No puedes cambiar tu propio rol' }, { status: 403 })
  }
  if (target.role === 'owner') {
    return NextResponse.json({ error: 'No puedes modificar al propietario de la gira' }, { status: 403 })
  }
  if (actor.role === 'admin' && ROLE_RANK[target.role] >= ROLE_RANK['admin']) {
    return NextResponse.json({ error: 'No puedes modificar a otro administrador' }, { status: 403 })
  }
  if (actor.role !== 'owner' && actor.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }
  if (newRole === 'owner') {
    return NextResponse.json({ error: 'Usa el endpoint de transferencia para cambiar el propietario' }, { status: 400 })
  }

  const { error } = await supabase
    .from('tour_members')
    .update({ role: newRole })
    .eq('id', memberId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/tours/[tourId]/members/[memberId] — remove member
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { tourId, memberId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const actor = await getActorMembership(supabase, tourId, user.id)
  if (!actor) return NextResponse.json({ error: 'No eres miembro de esta gira' }, { status: 403 })

  const { data: target } = await supabase
    .from('tour_members')
    .select('role, user_id')
    .eq('id', memberId)
    .single()
  if (!target) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })

  if (target.user_id === user.id) {
    return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 403 })
  }
  if (target.role === 'owner') {
    return NextResponse.json({ error: 'No puedes modificar al propietario de la gira' }, { status: 403 })
  }
  if (actor.role === 'admin' && ROLE_RANK[target.role] >= ROLE_RANK['admin']) {
    return NextResponse.json({ error: 'No puedes modificar a otro administrador' }, { status: 403 })
  }
  if (actor.role !== 'owner' && actor.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { error } = await supabase.from('tour_members').delete().eq('id', memberId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
