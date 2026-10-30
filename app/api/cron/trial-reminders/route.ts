// /app/api/cron/trial-reminders/route.ts
//
// Subscription reminders for providers with pending payment.
// Locked behind BOTH the Vercel cron header AND a bearer CRON_SECRET
// (constant-time compared, fail-closed on missing/short env). GET-only.

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { providerSubscriptionReminderEmail } from '@/lib/email/template'
import { dispatchEmail, escapeHtml, isValidEmail } from '@/lib/email/dispatcher'

export const runtime = 'nodejs'

const MIN_SECRET_LEN = 32

// Uniform failure response so the caller can't distinguish which check tripped.
const UNAUTHORIZED = NextResponse.json(
  { success: false, error: 'Unauthorized' },
  { status: 401 },
)

function authorized(request: NextRequest): boolean {
  // Require the Vercel cron header — set by Vercel when invoking a cron.
  if (!request.headers.get('x-vercel-cron')) return false

  const expected = process.env.CRON_SECRET
  if (!expected || expected.length < MIN_SECRET_LEN) return false

  const authHeader = request.headers.get('authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(authHeader)
  if (!match) return false
  const provided = match[1]

  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(provided, 'utf8')
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/bJe5kw6Hof5na0d1NzbfO00'

export async function GET(request: NextRequest) {
  if (!authorized(request)) return UNAUTHORIZED

  const supabase = createAdminClient()
  const results = {
    checked: 0,
    emailsSent: 0,
    errors: [] as string[],
  }

  const { data: providers, error } = await supabase
    .from('providers')
    .select('id, business_name, contact_person, contact_email, subscription_status, status')
    .eq('status', 'active')
    .or('subscription_status.eq.pending,subscription_status.is.null')

  if (error) {
    console.error('cron.trial-reminders: DB error', error)
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 })
  }

  results.checked = providers?.length || 0

  for (const provider of providers || []) {
    const email = provider.contact_email
    if (!email || !isValidEmail(email)) {
      results.errors.push(`${provider.business_name}: no valid email`)
      continue
    }

    const paymentLink = `${STRIPE_PAYMENT_LINK}?prefilled_email=${encodeURIComponent(email)}`
    const content = providerSubscriptionReminderEmail(
      escapeHtml(provider.contact_person || 'Provider'),
      escapeHtml(provider.business_name),
      escapeHtml(paymentLink),
    )

    const r = await dispatchEmail({ to: email, subject: content.subject, html: content.html })
    if (r.ok) {
      results.emailsSent++
    } else {
      results.errors.push(`${provider.business_name}: ${r.reason}`)
    }
  }

  return NextResponse.json({
    success: true,
    message: `Checked ${results.checked} providers, sent ${results.emailsSent} reminders`,
    ...results,
  })
}
