// /app/api/email/send-payment-link/route.ts
//
// Locked behind EMAIL_ROUTE_SECRET. Recipient is always the on-file
// contact_email for the provider looked up server-side by provider_id.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  dispatchEmail,
  escapeHtml,
  isValidEmail,
  verifyEmailRouteSecret,
} from '@/lib/email/dispatcher'

export const runtime = 'nodejs'

const UNIFORM_UNAUTHORIZED = NextResponse.json(
  { success: false, error: 'Unauthorized' },
  { status: 401 },
)

const baseStyles = `body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f5f5f5}.container{max-width:600px;margin:0 auto;background:#fff}.header{background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:30px;text-align:center}.header h1{color:#fff;margin:0;font-size:28px;font-weight:600}.header p{color:#e0e7ff;margin:10px 0 0;font-size:14px}.content{padding:40px 30px}.content h2{color:#1e40af;margin-top:0}.footer{background:#f8fafc;padding:30px;text-align:center;border-top:1px solid #e2e8f0}.footer p{margin:5px 0;color:#64748b;font-size:14px}.footer a{color:#3b82f6;text-decoration:none}.divider{height:1px;background:#e2e8f0;margin:25px 0}.button{display:inline-block;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);color:#fff!important;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:600;font-size:16px}.fallback-url{word-break:break-all;background:#f1f5f9;padding:12px;border-radius:6px;font-family:monospace;font-size:13px;color:#475569}`

type Body = { provider_id?: unknown }

export async function POST(request: NextRequest) {
  if (!verifyEmailRouteSecret(request)) {
    return UNIFORM_UNAUTHORIZED
  }

  let payload: Body
  try {
    payload = (await request.json()) as Body
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
  }

  const providerId = typeof payload.provider_id === 'string' ? payload.provider_id : ''
  if (!providerId) {
    return NextResponse.json({ success: false, error: 'provider_id required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: provider, error } = await supabase
    .from('providers')
    .select('id, business_name, contact_person, contact_email, subscription_status')
    .eq('id', providerId)
    .maybeSingle()

  if (error || !provider) {
    return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })
  }

  if (!provider.contact_email || !isValidEmail(provider.contact_email)) {
    return NextResponse.json(
      { success: false, error: 'Provider has no valid contact email' },
      { status: 400 },
    )
  }

  if (provider.subscription_status === 'active') {
    return NextResponse.json(
      { success: false, error: 'Provider already has an active subscription' },
      { status: 400 },
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://careconnections.live'
  const paymentLink = `${appUrl}/subscribe?provider_id=${encodeURIComponent(provider.id)}&email=${encodeURIComponent(provider.contact_email)}`

  const greetingName = escapeHtml(provider.contact_person ?? 'Provider')
  const businessName = escapeHtml(provider.business_name ?? '')
  const businessLine = businessName
    ? `<p>We noticed your registration for <strong>${businessName}</strong> on CareConnect is almost complete, but payment hasn't been finalized yet.</p>`
    : `<p>We noticed your CareConnect registration is almost complete, but payment hasn't been finalized yet.</p>`

  const escapedLink = escapeHtml(paymentLink)
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>${baseStyles}</style></head><body><div class="container"><div class="header"><h1>CareConnect</h1><p>Minnesota's Trusted 245D Provider Network</p></div><div class="content"><h2>Complete Your CareConnect Registration</h2><p>Dear ${greetingName},</p>${businessLine}<p>To activate your provider listing and start receiving referral requests, click the secure button below to head to checkout and complete your subscription.</p><div style="text-align:center;margin:32px 0"><a href="${escapedLink}" class="button">Complete Payment &amp; Continue</a></div><p style="font-size:14px;color:#64748b">If the button doesn't work, copy and paste this link into your browser:</p><p class="fallback-url">${escapedLink}</p><div class="divider"></div><p>If you have any questions or need assistance, just reply to this email or contact us at the numbers below.</p><p>Best regards,<br><strong>The CareConnect Team</strong></p></div><div class="footer"><p><strong>CareConnect</strong></p><p>📞 763-321-4542</p><p><a href="https://careconnections.live">careconnections.live</a></p></div></div></body></html>`

  const r = await dispatchEmail({
    to: provider.contact_email,
    subject: 'Complete Your CareConnect Registration',
    html,
  })

  if (!r.ok) {
    return NextResponse.json(
      { success: false, error: r.reason === 'no_transport' ? 'Email not configured' : 'Send failed' },
      { status: 500 },
    )
  }
  return NextResponse.json({ success: true, messageId: r.messageId })
}
