import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const { id: bookingId } = await params
  if (!bookingId) {
    return NextResponse.json({ error: 'Missing booking id' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: booking, error: bookingErr } = await admin
    .from('bookings')
    .select(
      'id, provider_id, customer_name, customer_email, customer_phone, service_id, date, time, status, notes',
    )
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingErr) {
    console.error('bookings.get: fetch failed', bookingErr)
    return NextResponse.json({ error: 'Failed to load booking' }, { status: 500 })
  }
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const { data: provider, error: providerErr } = await admin
    .from('providers')
    .select('id, user_id, business_name, address, city, zip_code')
    .eq('id', booking.provider_id)
    .maybeSingle()

  if (providerErr) {
    console.error('bookings.get: provider fetch failed', providerErr)
    return NextResponse.json({ error: 'Failed to load booking' }, { status: 500 })
  }

  const callerEmail = (user.email || '').toLowerCase()
  const bookingEmail = (booking.customer_email || '').toLowerCase()
  const isCustomer = !!callerEmail && callerEmail === bookingEmail
  const isProvider = !!provider && provider.user_id === user.id

  if (!isCustomer && !isProvider) {
    // Do not leak whether the booking exists — 404 for non-owners.
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  return NextResponse.json({
    booking: {
      id: booking.id,
      provider_id: booking.provider_id,
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      customer_phone: booking.customer_phone,
      service_id: booking.service_id,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      notes: booking.notes,
      provider: provider
        ? {
            id: provider.id,
            business_name: provider.business_name,
            address: provider.address,
            city: provider.city,
            zip_code: provider.zip_code,
          }
        : null,
    },
    viewer: {
      user_id: user.id,
      type: isProvider ? 'provider' : 'customer',
    },
  })
}
