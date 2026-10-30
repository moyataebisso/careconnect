// /app/api/email/send-custom/route.ts
//
// Locked behind EMAIL_ROUTE_SECRET. Recipient resolved server-side from provider_id;
// subject/body are HTML-escaped before being rendered into the template.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  dispatchEmail,
  escapeHtml,
  isValidEmail,
  textToEscapedHtml,
  verifyEmailRouteSecret,
} from '@/lib/email/dispatcher'

export const runtime = 'nodejs'

const UNIFORM_UNAUTHORIZED = NextResponse.json(
  { success: false, error: 'Unauthorized' },
  { status: 401 },
)

const baseStyles = `body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f5f5f5}.container{max-width:600px;margin:0 auto;background:#fff}.header{background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:30px;text-align:center}.header h1{color:#fff;margin:0;font-size:28px;font-weight:600}.header p{color:#e0e7ff;margin:10px 0 0;font-size:14px}.content{padding:40px 30px}.content h2{color:#1e40af;margin-top:0}.footer{background:#f8fafc;padding:30px;text-align:center;border-top:1px solid #e2e8f0}.footer p{margin:5px 0;color:#64748b;font-size:14px}.footer a{color:#3b82f6;text-decoration:none}.divider{height:1px;background:#e2e8f0;margin:25px 0}`

function wrap(providerName: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>${baseStyles}</style></head><body><div class="container"><div class="header"><h1>CareConnect</h1><p>Minnesota's Trusted 245D Provider Network</p></div><div class="content"><p>Dear ${providerName},</p>${bodyHtml}<div class="divider"></div><p>Best regards,<br><strong>The CareConnect Team</strong></p></div><div class="footer"><p><strong>CareConnect</strong></p><p>📞 763-321-4542 | 763-355-0711</p><p>📧 <a href="mailto:careconnectmkting@gmail.com">careconnectmkting@gmail.com</a></p><p><a href="https://careconnections.live">careconnections.live</a></p></div></div></body></html>`
}

type Body = {
  provider_id?: unknown
  subject?: unknown
  body?: unknown
}

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
  const subjectRaw = typeof payload.subject === 'string' ? payload.subject.trim() : ''
  const bodyRaw = typeof payload.body === 'string' ? payload.body.trim() : ''

  if (!providerId || !subjectRaw || !bodyRaw) {
    return NextResponse.json(
      { success: false, error: 'provider_id, subject, body required' },
      { status: 400 },
    )
  }

  const supabase = createAdminClient()
  const { data: provider, error } = await supabase
    .from('providers')
    .select('contact_email, contact_person, business_name, business_email')
    .eq('id', providerId)
    .maybeSingle()

  if (error || !provider) {
    return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })
  }

  const to = provider.contact_email || provider.business_email
  if (!to || !isValidEmail(to)) {
    return NextResponse.json(
      { success: false, error: 'Provider has no valid contact email' },
      { status: 400 },
    )
  }

  const providerName = escapeHtml(provider.contact_person ?? 'Provider')
  const html = wrap(providerName, textToEscapedHtml(bodyRaw))
  // Subject header is not HTML — pass trimmed raw; nodemailer handles MIME encoding.
  const r = await dispatchEmail({ to, subject: subjectRaw, html })

  if (!r.ok) {
    return NextResponse.json(
      { success: false, error: r.reason === 'no_transport' ? 'Email not configured' : 'Send failed' },
      { status: 500 },
    )
  }
  return NextResponse.json({ success: true, messageId: r.messageId })
}
