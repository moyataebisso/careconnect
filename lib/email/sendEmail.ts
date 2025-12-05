// lib/email/sendEmail.ts

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email credentials not configured')
      return { success: false, error: 'Email credentials not configured' }
    }

    await transporter.sendMail({
      from: `"CareConnect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    })

    console.log(`Email sent successfully to ${to}: ${subject}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Send to multiple recipients
export async function sendEmailToMultiple(
  recipients: string[], 
  subject: string, 
  html: string
): Promise<{ success: boolean; sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const to of recipients) {
    const result = await sendEmail({ to, subject, html })
    if (result.success) {
      sent++
    } else {
      failed++
    }
  }

  return { success: failed === 0, sent, failed }
}

// Admin email address
export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'careconnectmkting@gmail.com'