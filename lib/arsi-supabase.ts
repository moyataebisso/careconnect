import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getArsiSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.ARSI_SUPABASE_URL
    const key = process.env.ARSI_SUPABASE_SERVICE_KEY
    if (!url || !key) {
      throw new Error('ARSI_SUPABASE_URL and ARSI_SUPABASE_SERVICE_KEY must be set')
    }
    _client = createClient(url, key)
  }
  return _client
}
