import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase/admin'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

const baseStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
  .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
  .header p { color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px; }
  .content { padding: 40px 30px; }
  .content h2 { color: #1e40af; margin-top: 0; }
  .footer { background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
  .footer p { margin: 5px 0; color: #64748b; font-size: 14px; }
  .footer a { color: #3b82f6; text-decoration: none; }
  .divider { height: 1px; background-color: #e2e8f0; margin: 25px 0; }
  .button { display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; }
  .fallback-url { word-break: break-all; background-color: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; color: #475569; }
`

const wrapTemplate = (content: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CareConnect</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
`

const header = `
<div class="header">
  <h1>CareConnect</h1>
  <p>Minnesota's Trusted 245D Provider Network</p>
</div>
`

const footer = `
<div class="footer">
  <p><strong>CareConnect</strong></p>
  <p>Connecting Families with Quality Care</p>
  <div class="divider"></div>
  <p>📞 763-321-4542 | 763-355-0711</p>
  <p>📧 <a href="mailto:careconnectmkting@gmail.com">careconnectmkting@gmail.com</a></p>
  <p><a href="https://www.careconnectlive.org">www.careconnectlive.org</a></p>
  <div class="divider"></div>
  <p style="font-size: 12px; color: #94a3b8;">
    © ${new Date().getFullYear()} CareConnect. All rights reserved.
  </p>
</div>
`

interface SendPaymentLinkBody {
  provider_id?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SendPaymentLinkBody
    const providerId = body.provider_id

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Missing provider_id' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { data: provider, error } = await supabase
      .from('providers')
      .select('id, business_name, contact_person, contact_email, subscription_status')
      .eq('id', providerId)
      .single()

    if (error || !provider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      )
    }

    if (!provider.contact_email) {
      return NextResponse.json(
        { success: false, error: 'Provider has no contact email on file' },
        { status: 400 }
      )
    }

    if (provider.subscription_status === 'active') {
      return NextResponse.json(
        { success: false, error: 'Provider already has an active subscription' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.careconnectlive.org'
    const plainLink = `${appUrl}/subscribe?provider_id=${encodeURIComponent(provider.id)}&email=${encodeURIComponent(provider.contact_email)}`

    const greetingName = provider.contact_person || 'Provider'
    const businessLine = provider.business_name
      ? `<p>We noticed your registration for <strong>${provider.business_name}</strong> on CareConnect is almost complete, but payment hasn't been finalized yet.</p>`
      : `<p>We noticed your CareConnect registration is almost complete, but payment hasn't been finalized yet.</p>`

    const ctaBlock = `
        <p>To activate your provider listing and start receiving referral requests, click the secure button below to head to checkout and complete your subscription.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${plainLink}" class="button">Complete Payment &amp; Continue</a>
        </div>
        <p style="font-size: 14px; color: #64748b;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p class="fallback-url">${plainLink}</p>
      `

    const emailHtml = wrapTemplate(`
      ${header}
      <div class="content">
        <h2>Complete Your CareConnect Registration</h2>
        <p>Dear ${greetingName},</p>
        ${businessLine}
        ${ctaBlock}
        <div class="divider"></div>
        <p>If you have any questions or need assistance, just reply to this email or contact us at the numbers below.</p>
        <p>Best regards,<br><strong>The CareConnect Team</strong></p>
      </div>
      ${footer}
    `)

    const info = await transporter.sendMail({
      from: `"CareConnect" <${process.env.EMAIL_USER}>`,
      to: provider.contact_email,
      subject: 'Complete Your CareConnect Registration',
      html: emailHtml
    })

    return NextResponse.json({
      success: true,
      messageId: info.messageId
    })
  } catch (error) {
    console.error('Error sending payment link email:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}
