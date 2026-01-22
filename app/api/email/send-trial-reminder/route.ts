// /app/api/email/send-trial-reminder/route.ts
// Repurposed as subscription reminder API

import { NextRequest, NextResponse } from 'next/server'
import { providerSubscriptionReminderEmail } from '@/lib/email/template'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

// Stripe payment link base URL
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/bJe5kw6Hof5na0d1NzbfO00'

export async function POST(request: NextRequest) {
  try {
    const { to, providerName, businessName, providerEmail } = await request.json()

    if (!to || !businessName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, businessName' },
        { status: 400 }
      )
    }

    // Build payment link with prefilled email
    const emailToUse = providerEmail || to
    const paymentLink = `${STRIPE_PAYMENT_LINK}?prefilled_email=${encodeURIComponent(emailToUse)}`

    // Use the subscription reminder email template
    const emailContent = providerSubscriptionReminderEmail(
      providerName || 'Provider',
      businessName,
      paymentLink
    )

    console.log(`Sending subscription reminder to: ${to}`)
    console.log(`Subject: ${emailContent.subject}`)

    const info = await transporter.sendMail({
      from: `"CareConnect" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    })

    console.log(`Subscription reminder sent successfully to ${to}:`, info.messageId)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: `Subscription reminder sent to ${to}`
    })

  } catch (error) {
    console.error('Error sending subscription reminder:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}
