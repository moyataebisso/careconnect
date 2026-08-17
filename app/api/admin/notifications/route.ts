import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  dispatchEmail,
  escapeHtml,
  isValidEmail,
  textToEscapedHtml,
} from '@/lib/email/dispatcher'
import {
  providerApprovedEmail,
  providerSubscriptionReminderEmail,
} from '@/lib/email/template'

export const runtime = 'nodejs'

type Action = 'approve' | 'subscription_reminder' | 'custom' | 'payment_link'
type Body = {
  action?: unknown
  provider_id?: unknown
  subject?: unknown
  body?: unknown
}

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!adminUser?.role) return null
  return { user }
}

// Custom-email template built with fully-escaped body/subject content.
function buildCustomEmailHtml(providerName: string, escapedBody: string): string {
  const styles = `body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f5f5f5}.container{max-width:600px;margin:0 auto;background:#fff}.header{background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:30px;text-align:center}.header h1{color:#fff;margin:0;font-size:28px}.header p{color:#e0e7ff;margin:10px 0 0;font-size:14px}.content{padding:40px 30px}.divider{height:1px;background:#e2e8f0;margin:25px 0}.footer{background:#f8fafc;padding:30px;text-align:center;border-top:1px solid #e2e8f0}.footer p{margin:5px 0;color:#64748b;font-size:14px}.footer a{color:#3b82f6;text-decoration:none}`
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>${styles}</style></head><body><div class="container"><div class="header"><h1>CareConnect</h1><p>Minnesota's Trusted 245D Provider Network</p></div><div class="content"><p>Dear ${providerName},</p>${escapedBody}<div class="divider"></div><p>Best regards,<br><strong>The CareConnect Team</strong></p></div><div class="footer"><p><strong>CareConnect</strong></p><p>📞 763-321-4542</p><p><a href="https://www.careconnectlive.org">www.careconnectlive.org</a></p></div></div></body></html>`
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
  }

  const action = body.action as Action
  const providerId = typeof body.provider_id === 'string' ? body.provider_id : ''
  if (!providerId) {
    return NextResponse.json({ success: false, error: 'provider_id required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: provider, error: providerErr } = await admin
    .from('providers')
    .select('id, business_name, contact_person, contact_email, subscription_status')
    .eq('id', providerId)
    .single()

  if (providerErr || !provider) {
    return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 })
  }
  if (!provider.contact_email || !isValidEmail(provider.contact_email)) {
    return NextResponse.json(
      { success: false, error: 'Provider has no valid contact email' },
      { status: 400 },
    )
  }

  const providerName = escapeHtml(provider.contact_person ?? 'Provider')
  const businessName = escapeHtml(provider.business_name ?? '')
  const to = provider.contact_email

  if (action === 'approve') {
    const { subject, html } = providerApprovedEmail(providerName, businessName)
    const r = await dispatchEmail({ to, subject, html })
    return NextResponse.json({ success: r.ok })
  }

  if (action === 'subscription_reminder' || action === 'payment_link') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.careconnectlive.org'
    const paymentLink = `${appUrl}/subscribe?provider_id=${encodeURIComponent(provider.id)}&email=${encodeURIComponent(to)}`
    const { subject, html } = providerSubscriptionReminderEmail(
      providerName,
      businessName,
      paymentLink,
    )
    const r = await dispatchEmail({ to, subject, html })
    return NextResponse.json({ success: r.ok })
  }

  if (action === 'custom') {
    const subjectRaw = typeof body.subject === 'string' ? body.subject.trim() : ''
    const bodyRaw = typeof body.body === 'string' ? body.body.trim() : ''
    if (!subjectRaw || !bodyRaw) {
      return NextResponse.json(
        { success: false, error: 'subject and body required' },
        { status: 400 },
      )
    }

    const escapedSubject = escapeHtml(subjectRaw)
    const escapedBodyHtml = textToEscapedHtml(bodyRaw)
    const html = buildCustomEmailHtml(providerName, escapedBodyHtml)

    // Escaped subject is used in headers as text (nodemailer handles encoding);
    // pass the trimmed raw value since email subject headers are not HTML.
    const r = await dispatchEmail({ to, subject: subjectRaw, html })
    // escapedSubject is used inside the template body if we ever inline it.
    void escapedSubject
    return NextResponse.json({ success: r.ok })
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
}
