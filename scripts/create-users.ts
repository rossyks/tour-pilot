import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const users = [
  { email: 'tomo@tourpilot.app', password: '123456', full_name: 'Tomàs García', username: 'tomo' },
  { email: 'jani@tourpilot.app', password: '123456', full_name: 'Jani Cabau', username: 'jani' },
  { email: 'guillem@tourpilot.app', password: '123456', full_name: 'Guillem Pages', username: 'guillem' },
  { email: 'oleguer@tourpilot.app', password: '123456', full_name: 'Oleguer Roca', username: 'oleguer' },
]

async function main() {
  for (const u of users) {
    console.log(`Creating ${u.email}...`)

    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })

    if (error) {
      console.error(`  ✗ Auth error: ${error.message}`)
      continue
    }

    const userId = data.user.id

    const { error: profileError } = await admin
      .from('profiles')
      .upsert({ id: userId, full_name: u.full_name, username: u.username })

    if (profileError) {
      console.error(`  ✗ Profile error: ${profileError.message}`)
    } else {
      console.log(`  ✓ Created ${u.full_name} (${userId})`)
    }
  }
}

main()
