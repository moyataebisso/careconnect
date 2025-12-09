// /app/api/cron/trial-reminders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { providerTrialEndingEmail } from '@/lib/email/template'
import nodemailer from 'nodemailer'

// Use service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

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
    const now = new Date()
    const results = {
      checked: 0,
      emailsSent: 0,
      errors: [] as string[],
      details: [] as { provider: string; email: string; status: string; daysLeft: number }[]
    }

    // Find ALL providers with trials ending in 1-3 days who haven't subscribed
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    threeDaysFromNow.setHours(23, 59, 59, 999)

    // Get providers whose trial ends between now and 3 days from now
    const { data: providers, error } = await supabase
      .from('providers')
      .select('id, business_name, contact_person, contact_email, trial_ends_at, subscription_status, status')
      .gt('trial_ends_at', now.toISOString())
      .lte('trial_ends_at', threeDaysFromNow.toISOString())
      .eq('status', 'active')
      .in('subscription_status', ['trial', 'pending'])

    if (error) {
      console.error('Error fetching providers:', error)
      return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 })
    }

    console.log(`Found ${providers?.length || 0} providers with expiring trials`)

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
          status: 'skipped - no valid email',
          daysLeft: 0
        })
        continue
      }

      // Calculate days left
      const trialEnd = new Date(provider.trial_ends_at)
      const daysLeft = Math.max(1, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

      console.log(`Sending trial reminder to ${provider.business_name} (${email}) - ${daysLeft} days left`)

      const emailContent = providerTrialEndingEmail(
        provider.contact_person || 'Provider',
        provider.business_name,
        daysLeft
      )

      const result = await sendEmail(email, emailContent.subject, emailContent.html)
      
      if (result.success) {
        results.emailsSent++
        results.details.push({
          provider: provider.business_name,
          email: email,
          status: 'sent',
          daysLeft: daysLeft
        })
        console.log(`✅ Trial reminder sent to ${provider.business_name}`)
      } else {
        results.errors.push(`${provider.business_name}: ${result.error}`)
        results.details.push({
          provider: provider.business_name,
          email: email,
          status: `failed: ${result.error}`,
          daysLeft: daysLeft
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
    console.error('Trial reminder cron error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}