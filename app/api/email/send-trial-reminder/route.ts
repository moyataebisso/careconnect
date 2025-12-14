// /app/api/email/send-trial-reminder/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { providerTrialEndingEmail } from '@/lib/email/template'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

export async function POST(request: NextRequest) {
  try {
    const { to, providerName, businessName, daysLeft } = await request.json()

    if (!to || !businessName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, businessName' },
        { status: 400 }
      )
    }

    // Use the same trial ending email template
    const emailContent = providerTrialEndingEmail(
      providerName || 'Provider',
      businessName,
      daysLeft || 0
    )

    console.log(`Sending trial reminder to: ${to}`)
    console.log(`Subject: ${emailContent.subject}`)

    const info = await transporter.sendMail({
      from: `"CareConnect" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    })

    console.log(`Trial reminder sent successfully to ${to}:`, info.messageId)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: `Trial reminder sent to ${to}`
    })

  } catch (error) {
    console.error('Error sending trial reminder:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}