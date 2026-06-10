import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
  const { data, error } = await supabase
    .from('live_sessions')
    .select('id, title, meet_url, external_event_id, start_time')
    .order('start_time', { ascending: false })
  
  if (error) {
    console.error('Error fetching sessions:', error)
    return
  }

  console.log('Sessions in DB:')
  console.log(JSON.stringify(data, null, 2))
}

check()
