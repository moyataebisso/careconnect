import { NextResponse } from 'next/server'
import { getArsiSupabase } from '@/lib/arsi-supabase'
import { requireAdmin } from '@/lib/auth/require-admin'

export const runtime = 'nodejs'

const CLIENT_EMAIL =
  process.env.CHANGE_REQUEST_CLIENT_EMAIL || 'admin@careconnectlive.org'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const arsiSupabase = getArsiSupabase()
    const { data, error } = await arsiSupabase
      .from('change_requests')
      .select('*')
      .eq('client_email', CLIENT_EMAIL)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('change-requests.list: fetch failed', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('change-requests.list: unexpected error', error)
    return NextResponse.json(
      { error: 'Failed to fetch change requests' },
      { status: 500 },
    )
  }
}
