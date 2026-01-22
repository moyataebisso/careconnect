// /app/api/cron/trial-reminders/route.ts
// Repurposed as subscription reminders for providers with pending payment status

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { providerSubscriptionReminderEmail } from '@/lib/email/template'
import nodemailer from 'nodemailer'

// Use service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Match exactly how send-custom works
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

// Stripe payment link base URL
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/bJe5kw6Hof5na0d1NzbfO00'

async function sendEmail(to: string, subject: string, html: string) {
  try {
    console.log(`Attempting to send email to: ${to}`)
    const info = await transporter.sendMail({
      from: `"CareConnect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    })
    console.log(`Email sent successfully to ${to}:`, info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request)
}

export async function POST(request: NextRequest) {
  return handleRequest(request)
}

async function handleRequest(request: NextRequest) {
  try {
    const results = {
      checked: 0,
      emailsSent: 0,
      errors: [] as string[],
      details: [] as { provider: string; email: string; status: string }[]
    }

    // Find ALL providers with pending subscription status who need to pay
    const { data: providers, error } = await supabase
      .from('providers')
      .select('id, business_name, contact_person, contact_email, subscription_status, status')
      .eq('status', 'active') // Only approved providers
      .or('subscription_status.eq.pending,subscription_status.is.null') // Pending or no subscription

    if (error) {
      console.error('Error fetching providers:', error)
      return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 })
    }

    console.log(`Found ${providers?.length || 0} providers needing subscription reminders`)

    results.checked = providers?.length || 0

    // Send reminder emails to each provider
    for (const provider of providers || []) {
      // Make sure we have a valid email
      const email = provider.contact_email
      if (!email || !email.includes('@')) {
        console.log(`Skipping ${provider.business_name} - no valid email: ${email}`)
        results.errors.push(`${provider.business_name}: No valid email address`)
        results.details.push({
          provider: provider.business_name,
          email: email || 'none',
          status: 'skipped - no valid email'
        })
        continue
      }

      console.log(`Sending subscription reminder to ${provider.business_name} (${email})`)

      // Build payment link with prefilled email
      const paymentLink = `${STRIPE_PAYMENT_LINK}?prefilled_email=${encodeURIComponent(email)}`

      const emailContent = providerSubscriptionReminderEmail(
        provider.contact_person || 'Provider',
        provider.business_name,
        paymentLink
      )

      const result = await sendEmail(email, emailContent.subject, emailContent.html)

      if (result.success) {
        results.emailsSent++
        results.details.push({
          provider: provider.business_name,
          email: email,
          status: 'sent'
        })
        console.log(`✅ Subscription reminder sent to ${provider.business_name}`)
      } else {
        results.errors.push(`${provider.business_name}: ${result.error}`)
        results.details.push({
          provider: provider.business_name,
          email: email,
          status: `failed: ${result.error}`
        })
        console.log(`❌ Failed to send to ${provider.business_name}: ${result.error}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${results.checked} providers, sent ${results.emailsSent} reminder emails`,
      ...results
    })

  } catch (error) {
    console.error('Subscription reminder cron error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
