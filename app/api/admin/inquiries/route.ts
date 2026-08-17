import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'

export const runtime = 'nodejs'

const ALLOWED_STATUSES = new Set(['new', 'contacted', 'resolved'])

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('referral_requests')
    .select(
      'id, client_name, client_email, client_phone, provider_id, urgency, service_types_needed, special_requirements, status, created_at, updated_at, providers(business_name)',
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('admin.inquiries.list: fetch failed', error)
    return NextResponse.json(
      { error: 'Failed to load inquiries' },
      { status: 500 },
    )
  }

  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { id?: unknown; status?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const id = typeof body.id === 'string' ? body.id : ''
  const status = typeof body.status === 'string' ? body.status : ''

  if (!id || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json(
      { error: 'id and a valid status are required' },
      { status: 400 },
    )
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('referral_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('admin.inquiries.patch: update failed', error)
    return NextResponse.json(
      { error: 'Failed to update inquiry' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
