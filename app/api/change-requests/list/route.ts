import { NextResponse } from 'next/server'
import { getArsiSupabase } from '@/lib/arsi-supabase'

export async function GET() {
  try {
    const arsiSupabase = getArsiSupabase()
    const { data, error } = await arsiSupabase
      .from('change_requests')
      .select('*')
      .eq('client_email', 'admin@careconnectlive.org')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching change requests:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Change request list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch change requests' },
      { status: 500 }
    )
  }
}
