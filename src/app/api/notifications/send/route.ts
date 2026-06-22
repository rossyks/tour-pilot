import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { show_id, subject: customSubject, message, recipient_ids } = await req.json() as {
    show_id: string
    subject: string
    message: string
    recipient_ids: string[]
  }

  if (!show_id || !message || !recipient_ids?.length) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const [{ data: show }, { data: sender }] = await Promise.all([
    supabase.from('shows').select('id, venue_name, city, date, show_time, tour_id').eq('id', show_id).single(),
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
  ])

  if (!show) return NextResponse.json({ error: 'Show not found' }, { status: 404 })

  const { data: tour } = await supabase.from('tours').select('name').eq('id', show.tour_id).single()
  const { data: recipients } = await supabase.from('profiles').select('id, full_name, email:id').eq('id', recipient_ids[0])

  // Get emails from auth.users via profiles join — fetch all recipients
  const { data: recipientProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', recipient_ids)

  // Get emails — we need auth admin for this, use service role workaround via tour_members emails
  // Actually profiles don't store email directly. Use supabase admin to get user emails.
  // We'll use the admin client pattern: call supabase.auth.admin.getUserById for each recipient
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const senderName = sender?.full_name ?? 'Alguien del equipo'
  const subject = customSubject?.trim() || `Tour Pilot — ${show.venue_name} · ${fmtDate(show.date)}`
  const showUrl = `https://tour-pilot-bice.vercel.app/shows/${show_id}`

  let sent = 0

  const errors: string[] = []

  await Promise.allSettled(
    recipient_ids.map(async (rid) => {
      const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(rid)
      if (authErr) { errors.push(`auth:${rid}:${authErr.message}`); return }
      const email = authUser?.user?.email
      const profile = recipientProfiles?.find(p => p.id === rid)
      const name = profile?.full_name ?? 'Miembro del equipo'
      if (!email) { errors.push(`no-email:${rid}`); return }

      const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#F5F4F2;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;padding:40px;max-width:480px;width:100%;">
        <tr><td style="padding-bottom:24px;">
          <img src="https://tour-pilot-bice.vercel.app/logo.svg" height="24" alt="Tour Pilot">
        </td></tr>
        <tr><td style="padding-bottom:8px;">
          <p style="margin:0;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.08em;">${tour?.name ?? ''}</p>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#1a1a1a;">${show.venue_name}</h1>
          <p style="margin:4px 0 0;font-size:14px;color:#999;">${show.city} · ${fmtDate(show.date)}</p>
        </td></tr>
        <tr><td style="padding-bottom:28px;">
          <div style="background:#F5F4F2;border-radius:12px;padding:16px;">
            <p style="margin:0 0 8px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.06em;">Mensaje de ${senderName}</p>
            <p style="margin:0;font-size:15px;color:#1a1a1a;line-height:1.6;">${message.replace(/\n/g, '<br>')}</p>
          </div>
        </td></tr>
        <tr><td style="padding-bottom:32px;">
          <a href="${showUrl}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;border-radius:12px;padding:14px 28px;font-size:15px;font-weight:600;">Ver show</a>
        </td></tr>
        <tr><td style="border-top:1px solid #F0F0F0;padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#999;text-align:center;">Tour Pilot · tourpilot.live</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

      const resend = new Resend(process.env.RESEND_API_KEY)
      const { error } = await resend.emails.send({
        from: 'Tour Pilot <no-reply@tourpilot.live>',
        to: email,
        subject,
        html,
      })
      if (error) { errors.push(`resend:${email}:${error.message}`) } else { sent++ }
    })
  )

  return NextResponse.json({ success: true, sent, errors })
}
