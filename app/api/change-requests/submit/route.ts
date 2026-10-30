import { NextRequest, NextResponse } from 'next/server'
import { getArsiSupabase } from '@/lib/arsi-supabase'
import { requireAdmin } from '@/lib/auth/require-admin'

export const runtime = 'nodejs'

const CLIENT_EMAIL =
  process.env.CHANGE_REQUEST_CLIENT_EMAIL || 'admin@careconnectlive.org'
const BUSINESS_NAME = 'CareConnect Live'

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { request_type, priority, description } = await request.json()

    if (!request_type || !priority || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const arsiSupabase = getArsiSupabase()
    const { data, error } = await arsiSupabase
      .from('change_requests')
      .insert({
        client_email: CLIENT_EMAIL,
        business_name: BUSINESS_NAME,
        request_type,
        priority,
        description,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('change-requests.submit: insert failed', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('change-requests.submit: unexpected error', error)
    return NextResponse.json(
      { error: 'Failed to submit change request' },
      { status: 500 },
    )
  }
}
