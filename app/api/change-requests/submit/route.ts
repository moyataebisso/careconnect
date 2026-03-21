import { NextRequest, NextResponse } from 'next/server'
import { getArsiSupabase } from '@/lib/arsi-supabase'

export async function POST(request: NextRequest) {
  try {
    const { request_type, priority, description } = await request.json()

    if (!request_type || !priority || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const arsiSupabase = getArsiSupabase()
    const { data, error } = await arsiSupabase
      .from('change_requests')
      .insert({
        client_email: 'admin@careconnectlive.org',
        business_name: 'CareConnect Live',
        request_type,
        priority,
        description,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error submitting change request:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Change request submit error:', error)
    return NextResponse.json(
      { error: 'Failed to submit change request' },
      { status: 500 }
    )
  }
}
