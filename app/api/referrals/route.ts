import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ADMIN_INBOX_EMAIL,
  dispatchEmail,
  escapeHtml,
  isValidEmail,
} from '@/lib/email/dispatcher'
import { adminNewInquiryNotification } from '@/lib/email/template'

export const runtime = 'nodejs'

// Minimum time between form mount and submission. Faster than this = bot.
const MIN_MOUNT_MS = 3000

// Reject silently for honeypot / timing failures so bots can't distinguish
// bot-detection from real success.
function botSuccess() {
  return NextResponse.json({ success: true })
}

type ReferralBody = {
  provider_id?: unknown
  client_name?: unknown
  client_email?: unknown
  client_phone?: unknown
  waiver_type?: unknown
  service_needed?: unknown
  preferred_city?: unknown
  move_in_date?: unknown
  urgency?: unknown
  special_requirements?: unknown
  website?: unknown
  mounted_at?: unknown
}

function stringOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function stringOrNull(value: unknown): string | null {
  const s = stringOrEmpty(value)
  return s === '' ? null : s
}

export async function POST(req: NextRequest) {
  let body: ReferralBody
  try {
    body = (await req.json()) as ReferralBody
  } catch {
    return botSuccess()
  }

  // Honeypot: 'website' must be empty.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return botSuccess()
  }

  // Timing: must have sat on the page at least MIN_MOUNT_MS.
  const mountedAt = Number(body.mounted_at)
  if (!Number.isFinite(mountedAt) || Date.now() - mountedAt < MIN_MOUNT_MS) {
    return botSuccess()
  }

  const providerId = stringOrEmpty(body.provider_id)
  const clientName = stringOrEmpty(body.client_name)
  const clientEmail = stringOrEmpty(body.client_email)
  const clientPhone = stringOrEmpty(body.client_phone)

  if (
    !providerId ||
    !clientName ||
    !clientPhone ||
    !isValidEmail(clientEmail)
  ) {
    return NextResponse.json(
      { success: false, error: 'Invalid submission' },
      { status: 400 },
    )
  }

  const waiverType = stringOrNull(body.waiver_type)
  const serviceNeeded = stringOrEmpty(body.service_needed)
  const preferredCity = stringOrNull(body.preferred_city)
  const moveInDate = stringOrNull(body.move_in_date)
  const urgency = stringOrEmpty(body.urgency) || 'flexible'
  const specialRequirements = stringOrNull(body.special_requirements)

  const supabase = createAdminClient()

  const { data: provider, error: providerErr } = await supabase
    .from('providers')
    .select('id, business_name')
    .eq('id', providerId)
    .single()

  if (providerErr || !provider) {
    return NextResponse.json(
      { success: false, error: 'Provider not found' },
      { status: 404 },
    )
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('referral_requests')
    .insert({
      provider_id: provider.id,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      waiver_type: waiverType,
      service_types_needed: serviceNeeded ? [serviceNeeded] : null,
      preferred_city: preferredCity,
      move_in_date: moveInDate,
      urgency,
      special_requirements: specialRequirements,
      status: 'new',
    })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    console.error('referrals.insert failed', insertErr)
    return NextResponse.json(
      { success: false, error: 'Could not save inquiry' },
      { status: 500 },
    )
  }

  const { subject, html } = adminNewInquiryNotification(
    escapeHtml(clientName),
    escapeHtml(clientEmail),
    escapeHtml(clientPhone),
    escapeHtml(provider.business_name),
    escapeHtml(urgency),
    escapeHtml(specialRequirements ?? 'Not specified'),
  )
  const dispatchResult = await dispatchEmail({
    to: ADMIN_INBOX_EMAIL,
    subject,
    html,
  })
  if (!dispatchResult.ok) {
    console.error('referrals.notify failed', dispatchResult)
  }

  return NextResponse.json({ success: true, id: inserted.id })
}
