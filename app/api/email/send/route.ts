// /app/api/email/send/route.ts

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import {
  providerWelcomeEmail,
  providerApprovedEmail,
  providerTrialEndingEmail,
  providerSubscriptionConfirmedEmail,
  careSeekerWelcomeEmail,
  careSeekerBookingConfirmationEmail,
  adminNewProviderNotification,
  adminNewCareSeekerNotification
} from '@/lib/email/template'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

// Admin email for notifications
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'careconnectmkting@gmail.com'

interface EmailRequest {
  type: string
  to: string
  data: Record<string, string | number | boolean>
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email credentials not configured')
      return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
    }

    const { type, to, data }: EmailRequest = await request.json()

    let emailContent: { subject: string; html: string }

    // Generate email content based on type
    switch (type) {
      case 'provider_welcome':
        emailContent = providerWelcomeEmail(
          data.providerName as string,
          data.businessName as string
        )
        break

      case 'provider_approved':
        emailContent = providerApprovedEmail(
          data.providerName as string,
          data.businessName as string,
          data.trialEndDate as string
        )
        break

      case 'provider_trial_ending':
        emailContent = providerTrialEndingEmail(
          data.providerName as string,
          data.businessName as string,
          data.daysLeft as number
        )
        break

      case 'provider_subscription_confirmed':
        emailContent = providerSubscriptionConfirmedEmail(
          data.providerName as string,
          data.businessName as string
        )
        break

      case 'care_seeker_welcome':
        emailContent = careSeekerWelcomeEmail(
          data.firstName as string,
          data.lastName as string
        )
        break

      case 'care_seeker_booking':
        emailContent = careSeekerBookingConfirmationEmail(
          data.firstName as string,
          data.providerName as string,
          data.bookingDate as string,
          data.bookingType as string
        )
        break

      case 'admin_new_provider':
        emailContent = adminNewProviderNotification(
          data.providerName as string,
          data.businessName as string,
          data.email as string,
          data.phone as string,
          data.licenseNumber as string
        )
        break

      case 'admin_new_care_seeker':
        emailContent = adminNewCareSeekerNotification(
          data.name as string,
          data.email as string,
          data.careNeeds as string,
          data.urgency as string
        )
        break

      default:
        return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
    }

    // Send the email
    await transporter.sendMail({
      from: `"CareConnect" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    })

    console.log(`Email sent successfully: ${type} to ${to}`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}