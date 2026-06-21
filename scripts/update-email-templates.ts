// Usage: npx tsx scripts/update-email-templates.ts
// Requires SUPABASE_ACCESS_TOKEN in .env.local (personal access token from supabase.com/dashboard/account/tokens)

const PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1]
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!PROJECT_REF || !ACCESS_TOKEN) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_ACCESS_TOKEN in .env.local')
  process.exit(1)
}

const confirmHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#F5F4F2;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;padding:40px;max-width:480px;width:100%;">
        <tr><td align="left" style="padding-bottom:32px;">
          <img src="https://tour-pilot-bice.vercel.app/logo.svg" height="28" alt="Tour Pilot">
        </td></tr>
        <tr><td>
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a1a;">Bienvenido a Tour Pilot</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#666;line-height:1.6;">Confirma tu email para empezar a gestionar tus giras.</p>
          <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;border-radius:12px;padding:14px 28px;font-size:15px;font-weight:600;">Confirmar email</a>
        </td></tr>
        <tr><td style="padding-top:40px;border-top:1px solid #F0F0F0;margin-top:40px;">
          <p style="margin:0;font-size:12px;color:#999;text-align:center;">Tour Pilot · tourpilot.live</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

const resetHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#F5F4F2;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;padding:40px;max-width:480px;width:100%;">
        <tr><td align="left" style="padding-bottom:32px;">
          <img src="https://tour-pilot-bice.vercel.app/logo.svg" height="28" alt="Tour Pilot">
        </td></tr>
        <tr><td>
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a1a;">Cambiar contraseña</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#666;line-height:1.6;">Hemos recibido una solicitud para cambiar tu contraseña de Tour Pilot.</p>
          <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;border-radius:12px;padding:14px 28px;font-size:15px;font-weight:600;">Cambiar contraseña</a>
          <p style="font-size:12px;color:#999;margin:16px 0 0;">Si no has solicitado esto, puedes ignorar este email.</p>
        </td></tr>
        <tr><td style="padding-top:40px;border-top:1px solid #F0F0F0;margin-top:40px;">
          <p style="margin:0;font-size:12px;color:#999;text-align:center;">Tour Pilot · tourpilot.live</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

async function main() {
  console.log(`Updating email templates for project: ${PROJECT_REF}`)

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mailer_subjects_confirmation: 'Confirma tu cuenta en Tour Pilot',
      mailer_templates_confirmation_content: confirmHtml,
      mailer_subjects_recovery: 'Cambia tu contraseña de Tour Pilot',
      mailer_templates_recovery_content: resetHtml,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`✗ Error ${res.status}: ${body}`)
    process.exit(1)
  }

  console.log('✓ Plantilla "Confirmar cuenta" actualizada')
  console.log('✓ Plantilla "Reset password" actualizada')
}

main()
