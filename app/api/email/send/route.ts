// /app/api/email/send/route.ts
//
// Locked behind EMAIL_ROUTE_SECRET (x-email-route-secret header, timingSafeEqual).
// Recipient is resolved server-side from target_id / env — never taken from the body.
// All user-supplied string data is HTML-escaped before rendering into a template.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ADMIN_INBOX_EMAIL,
  dispatchEmail,
  escapeHtml,
  escapeRecord,
  isValidEmail,
  verifyEmailRouteSecret,
} from '@/lib/email/dispatcher'
import {
  providerWelcomeEmail,
  providerApprovedEmail,
  providerTrialEndingEmail,
  providerSubscriptionReminderEmail,
  providerSubscriptionConfirmedEmail,
  careSeekerWelcomeEmail,
  careSeekerBookingConfirmationEmail,
  adminNewProviderNotification,
  adminNewCareSeekerNotification,
  adminNewInquiryNotification,
} from '@/lib/email/template'

export const runtime = 'nodejs'

const UNIFORM_UNAUTHORIZED = NextResponse.json(
  { success: false, error: 'Unauthorized' },
  { status: 401 },
)

type EmailRequest = {
  type?: unknown
  target_id?: unknown
  data?: unknown
}

type Data = Record<string, string | number | boolean>

async function resolveProviderRecipient(providerId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('providers')
    .select('contact_email, business_email')
    .eq('id', providerId)
    .maybeSingle()
  if (error || !data) return null
  const email = data.contact_email || data.business_email
  return email && isValidEmail(email) ? email : null
}

async function resolveCareSeekerRecipient(userId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('care_seekers')
    .select('email')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data?.email) return null
  return isValidEmail(data.email) ? data.email : null
}

export async function POST(request: NextRequest) {
  if (!verifyEmailRouteSecret(request)) {
    return UNIFORM_UNAUTHORIZED
  }

  let body: EmailRequest
  try {
    body = (await request.json()) as EmailRequest
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
  }

  const type = typeof body.type === 'string' ? body.type : ''
  const targetId = typeof body.target_id === 'string' ? body.target_id : ''
  const rawData: Data =
    body.data && typeof body.data === 'object' ? (body.data as Data) : {}
  const data = escapeRecord(rawData)

  const s = (k: string, fallback = ''): string => {
    const v = data[k]
    return typeof v === 'string' ? v : v == null ? fallback : String(v)
  }
  const n = (k: string, fallback = 0): number => {
    const v = data[k]
    return typeof v === 'number' ? v : Number(v ?? fallback)
  }

  let to: string
  let content: { subject: string; html: string }

  switch (type) {
    case 'provider_welcome': {
      if (!targetId) return NextResponse.json({ success: false, error: 'target_id required' }, { status: 400 })
      const resolved = await resolveProviderRecipient(targetId)
      if (!resolved) return NextResponse.json({ success: false, error: 'Provider recipient not found' }, { status: 404 })
      to = resolved
      content = providerWelcomeEmail(s('providerName'), s('businessName'))
      break
    }
    case 'provider_approved': {
      if (!targetId) return NextResponse.json({ success: false, error: 'target_id required' }, { status: 400 })
      const resolved = await resolveProviderRecipient(targetId)
      if (!resolved) return NextResponse.json({ success: false, error: 'Provider recipient not found' }, { status: 404 })
      to = resolved
      content = providerApprovedEmail(s('providerName'), s('businessName'), s('trialEndDate'))
      break
    }
    case 'provider_trial_ending': {
      if (!targetId) return NextResponse.json({ success: false, error: 'target_id required' }, { status: 400 })
      const resolved = await resolveProviderRecipient(targetId)
      if (!resolved) return NextResponse.json({ success: false, error: 'Provider recipient not found' }, { status: 404 })
      to = resolved
      content = providerTrialEndingEmail(s('providerName'), s('businessName'), n('daysLeft'))
      break
    }
    case 'subscription_reminder': {
      if (!targetId) return NextResponse.json({ success: false, error: 'target_id required' }, { status: 400 })
      const resolved = await resolveProviderRecipient(targetId)
      if (!resolved) return NextResponse.json({ success: false, error: 'Provider recipient not found' }, { status: 404 })
      to = resolved
      // paymentLink is a URL — must be an http(s) URL, not html-escaped.
      const rawLink = typeof rawData.paymentLink === 'string' ? rawData.paymentLink : ''
      if (!/^https?:\/\//.test(rawLink)) {
        return NextResponse.json({ success: false, error: 'Invalid paymentLink' }, { status: 400 })
      }
      content = providerSubscriptionReminderEmail(s('providerName'), s('businessName'), escapeHtml(rawLink))
      break
    }
    case 'provider_subscription_confirmed': {
      if (!targetId) return NextResponse.json({ success: false, error: 'target_id required' }, { status: 400 })
      const resolved = await resolveProviderRecipient(targetId)
      if (!resolved) return NextResponse.json({ success: false, error: 'Provider recipient not found' }, { status: 404 })
      to = resolved
      content = providerSubscriptionConfirmedEmail(s('providerName'), s('businessName'))
      break
    }
    case 'care_seeker_welcome': {
      if (!targetId) return NextResponse.json({ success: false, error: 'target_id required' }, { status: 400 })
      const resolved = await resolveCareSeekerRecipient(targetId)
      if (!resolved) return NextResponse.json({ success: false, error: 'Care seeker recipient not found' }, { status: 404 })
      to = resolved
      content = careSeekerWelcomeEmail(s('firstName'), s('lastName'))
      break
    }
    case 'care_seeker_booking': {
      if (!targetId) return NextResponse.json({ success: false, error: 'target_id required' }, { status: 400 })
      const resolved = await resolveCareSeekerRecipient(targetId)
      if (!resolved) return NextResponse.json({ success: false, error: 'Care seeker recipient not found' }, { status: 404 })
      to = resolved
      content = careSeekerBookingConfirmationEmail(
        s('firstName'),
        s('providerName'),
        s('bookingDate'),
        s('bookingType'),
      )
      break
    }
    case 'admin_new_provider': {
      to = ADMIN_INBOX_EMAIL
      content = adminNewProviderNotification(
        s('providerName'),
        s('businessName'),
        s('email'),
        s('phone'),
        s('licenseNumber'),
      )
      break
    }
    case 'admin_new_care_seeker': {
      to = ADMIN_INBOX_EMAIL
      content = adminNewCareSeekerNotification(
        s('name'),
        s('email'),
        s('careNeeds'),
        s('urgency'),
      )
      break
    }
    case 'admin_new_inquiry': {
      to = ADMIN_INBOX_EMAIL
      content = adminNewInquiryNotification(
        s('clientName'),
        s('clientEmail'),
        s('clientPhone'),
        s('providerName'),
        s('urgency'),
        s('careNeeds'),
      )
      break
    }
    default:
      return NextResponse.json({ success: false, error: 'Unknown email type' }, { status: 400 })
  }

  const r = await dispatchEmail({ to, subject: content.subject, html: content.html })
  if (!r.ok) {
    return NextResponse.json(
      { success: false, error: r.reason === 'no_transport' ? 'Email not configured' : 'Send failed' },
      { status: 500 },
    )
  }
  return NextResponse.json({ success: true })
}
