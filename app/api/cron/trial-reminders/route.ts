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
    await transporter.sendMail({
      from: `"CareConnect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    })
    return { success: true }
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error)
    return { success: false, error }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // If CRON_SECRET is set, verify it (skip for manual triggers from admin)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow manual trigger without auth for now (you can tighten this later)
      const url = new URL(request.url)
      const manualTrigger = url.searchParams.get('manual') === 'true'
      
      if (!manualTrigger) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const now = new Date()
    const results = {
      checked: 0,
      emailsSent: 0,
      errors: [] as string[]
    }

    // Check for trials ending in 3 days
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    threeDaysFromNow.setHours(23, 59, 59, 999)

    const threeDaysFromNowStart = new Date(now)
    threeDaysFromNowStart.setDate(threeDaysFromNowStart.getDate() + 3)
    threeDaysFromNowStart.setHours(0, 0, 0, 0)

    // Find providers with trials ending in exactly 3 days
    // and who haven't subscribed yet
    const { data: providers, error } = await supabase
      .from('providers')
      .select('id, business_name, contact_person, contact_email, trial_ends_at, subscription_status')
      .gte('trial_ends_at', threeDaysFromNowStart.toISOString())
      .lte('trial_ends_at', threeDaysFromNow.toISOString())
      .eq('status', 'active')
      .or('subscription_status.is.null,subscription_status.eq.trial,subscription_status.eq.pending')

    if (error) {
      console.error('Error fetching providers:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    results.checked = providers?.length || 0

    // Send reminder emails
    for (const provider of providers || []) {
      const email = provider.contact_email || provider.business_name
      if (!email) continue

      const daysLeft = 3 // We're querying for 3 days specifically
      const emailContent = providerTrialEndingEmail(
        provider.contact_person || 'Provider',
        provider.business_name,
        daysLeft
      )

      const result = await sendEmail(email, emailContent.subject, emailContent.html)
      
      if (result.success) {
        results.emailsSent++
        console.log(`Trial reminder sent to ${provider.business_name} (${email})`)
      } else {
        results.errors.push(`Failed to send to ${provider.business_name}`)
      }
    }

    // Also check for trials ending in 1 day (final reminder)
    const oneDayFromNow = new Date(now)
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1)
    oneDayFromNow.setHours(23, 59, 59, 999)

    const oneDayFromNowStart = new Date(now)
    oneDayFromNowStart.setDate(oneDayFromNowStart.getDate() + 1)
    oneDayFromNowStart.setHours(0, 0, 0, 0)

    const { data: urgentProviders } = await supabase
      .from('providers')
      .select('id, business_name, contact_person, contact_email, trial_ends_at, subscription_status')
      .gte('trial_ends_at', oneDayFromNowStart.toISOString())
      .lte('trial_ends_at', oneDayFromNow.toISOString())
      .eq('status', 'active')
      .or('subscription_status.is.null,subscription_status.eq.trial,subscription_status.eq.pending')

    for (const provider of urgentProviders || []) {
      const email = provider.contact_email
      if (!email) continue

      const emailContent = providerTrialEndingEmail(
        provider.contact_person || 'Provider',
        provider.business_name,
        1
      )

      const result = await sendEmail(email, emailContent.subject, emailContent.html)
      
      if (result.success) {
        results.emailsSent++
        console.log(`URGENT trial reminder sent to ${provider.business_name} (${email})`)
      } else {
        results.errors.push(`Failed to send urgent to ${provider.business_name}`)
      }
    }

    results.checked += urgentProviders?.length || 0

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

// POST method for manual triggers from admin panel
export async function POST(request: NextRequest) {
  return GET(request)
}