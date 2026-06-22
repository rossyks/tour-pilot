/**
 * Run once: node scripts/setup-test-users.mjs
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Parse .env.local
const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('=').map(s => s.trim()))
)

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

if (!SERVICE_ROLE_KEY) {
  console.error('❌  Add SUPABASE_SERVICE_ROLE_KEY=... to .env.local first')
  process.exit(1)
}

const headers = {
  'Content-Type': 'application/json',
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
}

async function adminPost(path, body) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin${path}`, {
    method: 'POST', headers, body: JSON.stringify(body),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(JSON.stringify(j))
  return j
}

async function sql(query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST', headers,
    body: JSON.stringify({ query }),
  })
  // fallback: use postgres endpoint isn't available via REST easily, just use supabase-js
}

async function upsertProfile(userId, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ id: userId, ...data }),
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`Profile upsert failed: ${text}`)
}

async function addTourMember(tourId, userId, role) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/tour_members`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=ignore-duplicates' },
    body: JSON.stringify({ tour_id: tourId, user_id: userId, role }),
  })
  if (!r.ok) {
    const t = await r.text()
    console.warn(`  tour_member insert: ${t}`)
  }
}

async function getTourId(name) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/tours?name=eq.${encodeURIComponent(name)}&select=id`, { headers })
  const rows = await r.json()
  return rows[0]?.id ?? null
}

const users = [
  { email: 'admin@tourpilot.test',  password: 'tourpilot123', profileRole: 'admin',  username: 'admin',  full_name: 'Tour Admin',    band: 'Malmö 040', tourRole: 'admin'  },
  { email: 'artist@tourpilot.test', password: 'tourpilot123', profileRole: 'member', username: 'artist', full_name: 'Artista Prueba', band: 'Malmö 040', tourRole: 'artist' },
  { email: 'crew@tourpilot.test',   password: 'tourpilot123', profileRole: 'crew',   username: 'crew',   full_name: 'Crew Prueba',    band: 'Malmö 040', tourRole: 'crew'   },
]

async function main() {
  console.log('🚀  Setting up test users...\n')

  // Find tour
  const tourId = await getTourId('Malmö Festivales 2026')
  if (!tourId) {
    console.warn('⚠️  Tour "Malmö Festivales 2026" not found — will skip tour_members step')
  } else {
    console.log(`✅  Found tour: ${tourId}`)
  }

  for (const u of users) {
    try {
      // Create auth user
      const authUser = await adminPost('/users', {
        email: u.email,
        password: u.password,
        email_confirm: true,
      })
      const userId = authUser.id
      console.log(`✅  Created user: ${u.email} (${userId})`)

      // Upsert profile
      await upsertProfile(userId, {
        full_name: u.full_name,
        username: u.username,
        band: u.band,
        role: u.profileRole,
      })
      console.log(`   ✅  Profile: ${u.username}`)

      // Add to tour
      if (tourId) {
        await addTourMember(tourId, userId, u.tourRole)
        console.log(`   ✅  tour_members: ${u.tourRole}`)
      }
    } catch (err) {
      console.error(`❌  ${u.email}: ${err.message}`)
    }
  }

  console.log('\n✅  Done!')
}

main()
