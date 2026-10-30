// app/api/provider/activate-profile/route.ts
//
// Sets status = 'active' for the calling user's provider row, but ONLY when
// subscription_status is already 'active' (confirmed by the Stripe webhook).
// Called by the registration and profile-edit flows after they save business
// details.  Using createAdminClient() for the write so the future RLS trigger
// can't interfere — the user's identity is still verified via the cookie client.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST() {
  // Verify caller identity using the cookie session
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Load the provider row via admin client — bypasses RLS, filtered to own row
  const admin = createAdminClient()
  const { data: provider, error } = await admin
    .from('providers')
    .select('id, status, subscription_status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('activate-profile: db error', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!provider) {
    return NextResponse.json({ error: 'No provider record found' }, { status: 404 })
  }

  // Already active — nothing to do, tell the caller so they can skip the redirect
  if (provider.status === 'active') {
    return NextResponse.json({ activated: true, alreadyActive: true })
  }

  // Stripe hasn't confirmed payment yet — tell the caller to wait
  if (provider.subscription_status !== 'active') {
    return NextResponse.json(
      { activated: false, reason: 'payment_pending' },
      { status: 202 },
    )
  }

  // subscription_status is 'active' but provider.status is still incomplete or pending.
  // Both map to the normal post-payment activation path:
  //   • 'incomplete' = payment arrived before profile was saved (Race B)
  //   • 'pending'    = webhook ran first and set incomplete→pending (Race A resolved)
  if (provider.status !== 'incomplete' && provider.status !== 'pending') {
    // suspended, expired, etc. — admin action required
    return NextResponse.json(
      { activated: false, reason: 'ineligible', currentStatus: provider.status },
      { status: 409 },
    )
  }

  const { error: updateError } = await admin
    .from('providers')
    .update({ status: 'active' })
    .eq('id', provider.id)

  if (updateError) {
    console.error('activate-profile: status update failed', updateError)
    return NextResponse.json({ error: 'Activation failed' }, { status: 500 })
  }

  return NextResponse.json({ activated: true })
}
