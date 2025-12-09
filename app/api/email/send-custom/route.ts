// /app/api/email/send-custom/route.ts

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

// Base styles for email template
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

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body, providerName, businessName } = await request.json()

    if (!to || !subject || !body) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      )
    }

    // Convert line breaks to HTML paragraphs
    const htmlBody = body
      .split('\n\n')
      .map((paragraph: string) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('')

    const emailHtml = wrapTemplate(`
      ${header}
      <div class="content">
        <p>Dear ${providerName || 'Provider'},</p>
        ${htmlBody}
        <div class="divider"></div>
        <p>Best regards,<br><strong>The CareConnect Team</strong></p>
      </div>
      ${footer}
    `)

    console.log(`Sending custom email to: ${to}`)
    console.log(`Subject: ${subject}`)

    const info = await transporter.sendMail({
      from: `"CareConnect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: emailHtml
    })

    console.log(`Custom email sent successfully to ${to}:`, info.messageId)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: `Email sent to ${to}`
    })

  } catch (error) {
    console.error('Error sending custom email:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}