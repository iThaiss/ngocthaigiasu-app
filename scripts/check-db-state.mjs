import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
  try {
    // 1. Fetch live sessions
    const { data: sessions, error: sessionErr } = await supabase
      .from('live_sessions')
      .select('id, title, meet_url, external_event_id, start_time')
      .order('start_time', { ascending: false })
      .limit(5)

    if (sessionErr) {
      console.error('Error fetching live sessions:', sessionErr)
    } else {
      console.log('--- Last 5 Live Sessions ---')
      console.log(JSON.stringify(sessions, null, 2))
    }

    // 2. Fetch users
    const { data: users, error: userErr } = await supabase
      .from('users')
      .select('id, email, name, role, is_vip, vip_expires_at')
      .order('id')
      .limit(10)

    if (userErr) {
      console.error('Error fetching users:', userErr)
    } else {
      console.log('--- First 10 Users ---')
      console.log(JSON.stringify(users, null, 2))
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

check()
