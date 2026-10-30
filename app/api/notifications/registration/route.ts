import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  ADMIN_INBOX_EMAIL,
  dispatchEmail,
  escapeHtml,
  isValidEmail,
} from '@/lib/email/dispatcher'
import {
  providerWelcomeEmail,
  adminNewProviderNotification,
  careSeekerWelcomeEmail,
  adminNewCareSeekerNotification,
} from '@/lib/email/template'

export const runtime = 'nodejs'

type Body = { kind?: unknown }

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  if (body.kind === 'provider') {
    const { data: provider, error } = await supabase
      .from('providers')
      .select(
        'contact_email, contact_person, business_name, business_email, contact_phone, license_number',
      )
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !provider) {
      return NextResponse.json(
        { success: false, error: 'Provider profile not found' },
        { status: 404 },
      )
    }

    const recipient = provider.contact_email || provider.business_email || user.email
    if (!recipient || !isValidEmail(recipient)) {
      return NextResponse.json(
        { success: false, error: 'No valid contact email on file' },
        { status: 400 },
      )
    }

    const providerName = escapeHtml(provider.contact_person ?? 'Provider')
    const businessName = escapeHtml(provider.business_name ?? '')

    const welcome = providerWelcomeEmail(providerName, businessName)
    await dispatchEmail({ to: recipient, subject: welcome.subject, html: welcome.html })

    const notif = adminNewProviderNotification(
      providerName,
      businessName,
      escapeHtml(recipient),
      escapeHtml(provider.contact_phone ?? ''),
      escapeHtml(provider.license_number ?? ''),
    )
    await dispatchEmail({ to: ADMIN_INBOX_EMAIL, subject: notif.subject, html: notif.html })

    return NextResponse.json({ success: true })
  }

  if (body.kind === 'care_seeker') {
    const { data: seeker, error } = await supabase
      .from('care_seekers')
      .select('first_name, last_name, email, care_needs, urgency')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !seeker) {
      return NextResponse.json(
        { success: false, error: 'Care seeker profile not found' },
        { status: 404 },
      )
    }

    const recipient = seeker.email || user.email
    if (!recipient || !isValidEmail(recipient)) {
      return NextResponse.json(
        { success: false, error: 'No valid email on file' },
        { status: 400 },
      )
    }

    const firstName = escapeHtml(seeker.first_name ?? '')
    const lastName = escapeHtml(seeker.last_name ?? '')

    const welcome = careSeekerWelcomeEmail(firstName, lastName)
    await dispatchEmail({ to: recipient, subject: welcome.subject, html: welcome.html })

    const notif = adminNewCareSeekerNotification(
      `${firstName} ${lastName}`.trim(),
      escapeHtml(recipient),
      escapeHtml(seeker.care_needs ?? ''),
      escapeHtml(seeker.urgency ?? ''),
    )
    await dispatchEmail({ to: ADMIN_INBOX_EMAIL, subject: notif.subject, html: notif.html })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false, error: 'Unknown kind' }, { status: 400 })
}
