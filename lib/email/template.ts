// lib/email/templates.ts

const baseStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
  .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; }
  .header img { max-width: 180px; }
  .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
  .header p { color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px; }
  .content { padding: 40px 30px; }
  .content h2 { color: #1e40af; margin-top: 0; }
  .highlight-box { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
  .highlight-box.green { background-color: #f0fdf4; border-left-color: #22c55e; }
  .highlight-box.yellow { background-color: #fefce8; border-left-color: #eab308; }
  .steps { margin: 20px 0; }
  .step { display: flex; align-items: flex-start; margin-bottom: 15px; }
  .step-number { background-color: #3b82f6; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; }
  .step-content { flex: 1; }
  .step-content strong { color: #1e40af; }
  .button { display: inline-block; background-color: #3b82f6; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
  .button:hover { background-color: #2563eb; }
  .button.green { background-color: #22c55e; }
  .footer { background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
  .footer p { margin: 5px 0; color: #64748b; font-size: 14px; }
  .footer a { color: #3b82f6; text-decoration: none; }
  .social-links { margin: 15px 0; }
  .divider { height: 1px; background-color: #e2e8f0; margin: 25px 0; }
  ul { padding-left: 20px; }
  li { margin-bottom: 8px; }
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
    You received this email because you registered on CareConnect.<br>
    © ${new Date().getFullYear()} CareConnect. All rights reserved.
  </p>
</div>
`

// ============================================
// PROVIDER EMAIL TEMPLATES
// ============================================

export const providerWelcomeEmail = (providerName: string, businessName: string): { subject: string; html: string } => ({
  subject: `Welcome to CareConnect, ${providerName}! 🎉`,
  html: wrapTemplate(`
    ${header}
    <div class="content">
      <h2>Welcome to CareConnect!</h2>
      <p>Dear ${providerName},</p>
      <p>Thank you for registering <strong>${businessName}</strong> with CareConnect! We're excited to have you join Minnesota's growing network of licensed 245D care providers.</p>
      
      <div class="highlight-box yellow">
        <strong>⏳ What Happens Next?</strong>
        <p style="margin-bottom: 0;">Your application is now under review. Our team will verify your 245D license and review your facility information within <strong>24-48 hours</strong>.</p>
      </div>

      <h3>The CareConnect Process:</h3>
      <div class="steps">
        <div class="step">
          <span class="step-number">1</span>
          <div class="step-content">
            <strong>Application Review</strong><br>
            We verify your 245D license and facility details (24-48 hours)
          </div>
        </div>
        <div class="step">
          <span class="step-number">2</span>
          <div class="step-content">
            <strong>Approval & Free Trial</strong><br>
            Once approved, you get 7 days of full access — no credit card required
          </div>
        </div>
        <div class="step">
          <span class="step-number">3</span>
          <div class="step-content">
            <strong>Start Receiving Referrals</strong><br>
            Connect with case managers, social workers, and families seeking care
          </div>
        </div>
      </div>

      <div class="highlight-box green">
        <strong>💰 Subscription Details</strong>
        <p style="margin-bottom: 0;">After your 7-day free trial, continue your listing for just <strong>$99.99/month</strong>. Cancel anytime with no long-term commitment.</p>
      </div>

      <h3>What's Included:</h3>
      <ul>
        <li>✅ Professional facility listing visible to referral sources</li>
        <li>✅ Direct messaging with case managers and families</li>
        <li>✅ Booking and inquiry management tools</li>
        <li>✅ Access to our referral network across Minnesota</li>
        <li>✅ Priority support from our team</li>
      </ul>

      <p>While you wait for approval, you can verify your email address by clicking the link Supabase sent you (check your spam folder if you don't see it).</p>

      <p>Have questions? We're here to help!</p>
      <p>
        📞 Call or text: <a href="tel:763-321-4542">763-321-4542</a><br>
        📧 Email: <a href="mailto:careconnectmkting@gmail.com">careconnectmkting@gmail.com</a>
      </p>

      <p>Welcome aboard!</p>
      <p><strong>The CareConnect Team</strong></p>
    </div>
    ${footer}
  `)
})

export const providerApprovedEmail = (providerName: string, businessName: string, trialEndDate: string): { subject: string; html: string } => ({
  subject: `🎉 You're Approved! ${businessName} is Now Live on CareConnect`,
  html: wrapTemplate(`
    ${header}
    <div class="content">
      <h2>Congratulations, ${providerName}! 🎉</h2>
      <p>Great news! Your facility <strong>${businessName}</strong> has been approved and is now live on CareConnect!</p>
      
      <div class="highlight-box green">
        <strong>🎁 Your 7-Day Free Trial Has Started!</strong>
        <p style="margin-bottom: 0;">You have full access to all features until <strong>${trialEndDate}</strong>. No credit card required during the trial.</p>
      </div>

      <h3>Get Started Now:</h3>
      <div class="steps">
        <div class="step">
          <span class="step-number">1</span>
          <div class="step-content">
            <strong>Complete Your Profile</strong><br>
            Add photos, detailed descriptions, and amenities to attract more referrals
          </div>
        </div>
        <div class="step">
          <span class="step-number">2</span>
          <div class="step-content">
            <strong>Set Your Availability</strong><br>
            Update your current capacity so case managers know you have openings
          </div>
        </div>
        <div class="step">
          <span class="step-number">3</span>
          <div class="step-content">
            <strong>Respond to Inquiries</strong><br>
            Check your messages regularly and respond within 24 hours
          </div>
        </div>
      </div>

      <center>
        <a href="https://www.careconnectlive.org/dashboard" class="button">Go to Your Dashboard</a>
      </center>

      <div class="divider"></div>

      <p><strong>Pro Tips for Success:</strong></p>
      <ul>
        <li>📸 Facilities with photos get 3x more inquiries</li>
        <li>⚡ Fast response times improve your ranking</li>
        <li>📝 Detailed descriptions help families find the right fit</li>
      </ul>

      <p>Questions? We're always here to help!</p>
      <p><strong>The CareConnect Team</strong></p>
    </div>
    ${footer}
  `)
})

export const providerTrialEndingEmail = (providerName: string, businessName: string, daysLeft: number): { subject: string; html: string } => ({
  subject: `⏰ ${daysLeft} Days Left in Your CareConnect Trial`,
  html: wrapTemplate(`
    ${header}
    <div class="content">
      <h2>Your Trial is Ending Soon</h2>
      <p>Dear ${providerName},</p>
      <p>Your free trial for <strong>${businessName}</strong> ends in <strong>${daysLeft} days</strong>.</p>
      
      <div class="highlight-box yellow">
        <strong>⏰ Don't Lose Your Listing!</strong>
        <p style="margin-bottom: 0;">Subscribe now to keep receiving referrals and maintain your visibility to case managers and families.</p>
      </div>

      <h3>Continue for Just $99.99/month:</h3>
      <ul>
        <li>✅ Keep your facility listing active</li>
        <li>✅ Continue receiving referrals and inquiries</li>
        <li>✅ Maintain messaging with case managers</li>
        <li>✅ Cancel anytime — no long-term contracts</li>
      </ul>

      <center>
        <a href="https://www.careconnectlive.org/subscribe" class="button">Subscribe Now</a>
      </center>

      <div class="divider"></div>

      <p>If you have any questions about your subscription or need assistance, please don't hesitate to reach out.</p>
      <p><strong>The CareConnect Team</strong></p>
    </div>
    ${footer}
  `)
})

export const providerSubscriptionConfirmedEmail = (providerName: string, businessName: string): { subject: string; html: string } => ({
  subject: `✅ Subscription Confirmed - ${businessName}`,
  html: wrapTemplate(`
    ${header}
    <div class="content">
      <h2>Thank You for Subscribing! 🎉</h2>
      <p>Dear ${providerName},</p>
      <p>Your subscription for <strong>${businessName}</strong> is now active. Thank you for being part of the CareConnect network!</p>
      
      <div class="highlight-box green">
        <strong>✅ Subscription Active</strong>
        <p style="margin-bottom: 0;"><strong>Plan:</strong> Basic Provider Plan<br><strong>Amount:</strong> $99.99/month</p>
      </div>

      <h3>What's Next:</h3>
      <ul>
        <li>Your listing will remain visible to all referral sources</li>
        <li>Continue receiving inquiries from case managers and families</li>
        <li>Access your billing portal anytime to manage your subscription</li>
      </ul>

      <center>
        <a href="https://www.careconnectlive.org/billing" class="button">Manage Billing</a>
      </center>

      <p>Thank you for choosing CareConnect!</p>
      <p><strong>The CareConnect Team</strong></p>
    </div>
    ${footer}
  `)
})


// ============================================
// CARE SEEKER EMAIL TEMPLATES
// ============================================

export const careSeekerWelcomeEmail = (firstName: string, lastName: string): { subject: string; html: string } => ({
  subject: `Welcome to CareConnect, ${firstName}! 🏠`,
  html: wrapTemplate(`
    ${header}
    <div class="content">
      <h2>Welcome to CareConnect!</h2>
      <p>Dear ${firstName} ${lastName},</p>
      <p>Thank you for joining CareConnect! We're here to help you find the right care for you or your loved one.</p>
      
      <div class="highlight-box green">
        <strong>🎉 Your Account is Ready!</strong>
        <p style="margin-bottom: 0;">You can now browse our network of licensed 245D care providers across Minnesota — completely free!</p>
      </div>

      <h3>How to Find the Right Care:</h3>
      <div class="steps">
        <div class="step">
          <span class="step-number">1</span>
          <div class="step-content">
            <strong>Browse Providers</strong><br>
            Search by location, services, and waiver types accepted
          </div>
        </div>
        <div class="step">
          <span class="step-number">2</span>
          <div class="step-content">
            <strong>View Detailed Profiles</strong><br>
            See photos, amenities, capacity, and descriptions
          </div>
        </div>
        <div class="step">
          <span class="step-number">3</span>
          <div class="step-content">
            <strong>Contact Providers</strong><br>
            Send messages directly to providers you're interested in
          </div>
        </div>
        <div class="step">
          <span class="step-number">4</span>
          <div class="step-content">
            <strong>Schedule Tours</strong><br>
            Request tours or placements through our booking system
          </div>
        </div>
      </div>

      <center>
        <a href="https://www.careconnectlive.org/providers" class="button green">Browse Providers Now</a>
      </center>

      <div class="divider"></div>

      <h3>Need Help?</h3>
      <p>Finding the right care can feel overwhelming. We're here to help!</p>
      <ul>
        <li>📞 Call us: <a href="tel:763-321-4542">763-321-4542</a></li>
        <li>📧 Email us: <a href="mailto:careconnectmkting@gmail.com">careconnectmkting@gmail.com</a></li>
        <li>💬 Use the contact form on our website</li>
      </ul>

      <div class="highlight-box">
        <strong>💡 Pro Tip</strong>
        <p style="margin-bottom: 0;">Check your email inbox for a verification link from our system. Verifying your email ensures you receive important messages from providers.</p>
      </div>

      <p>We're honored to help you on this journey.</p>
      <p><strong>The CareConnect Team</strong></p>
    </div>
    ${footer}
  `)
})

export const careSeekerBookingConfirmationEmail = (
  firstName: string,
  providerName: string,
  bookingDate: string,
  bookingType: string
): { subject: string; html: string } => ({
  subject: `Booking Request Sent to ${providerName}`,
  html: wrapTemplate(`
    ${header}
    <div class="content">
      <h2>Booking Request Submitted! ✅</h2>
      <p>Dear ${firstName},</p>
      <p>Your ${bookingType.toLowerCase()} request has been sent to <strong>${providerName}</strong>.</p>
      
      <div class="highlight-box">
        <strong>📅 Request Details</strong>
        <p style="margin-bottom: 0;">
          <strong>Provider:</strong> ${providerName}<br>
          <strong>Type:</strong> ${bookingType}<br>
          <strong>Requested Date:</strong> ${bookingDate}
        </p>
      </div>

      <h3>What Happens Next:</h3>
      <ul>
        <li>The provider will review your request within 24-48 hours</li>
        <li>You'll receive an email when they respond</li>
        <li>Check your dashboard for updates</li>
      </ul>

      <center>
        <a href="https://www.careconnectlive.org/dashboard" class="button">View Your Dashboard</a>
      </center>

      <p>Thank you for using CareConnect!</p>
      <p><strong>The CareConnect Team</strong></p>
    </div>
    ${footer}
  `)
})


// ============================================
// ADMIN NOTIFICATION TEMPLATES
// ============================================

export const adminNewProviderNotification = (
  providerName: string,
  businessName: string,
  email: string,
  phone: string,
  licenseNumber: string
): { subject: string; html: string } => ({
  subject: `🆕 New Provider Registration: ${businessName}`,
  html: wrapTemplate(`
    ${header}
    <div class="content">
      <h2>New Provider Registration</h2>
      <p>A new provider has registered on CareConnect and is awaiting approval.</p>
      
      <div class="highlight-box">
        <strong>Provider Details:</strong>
        <p style="margin-bottom: 0;">
          <strong>Business Name:</strong> ${businessName}<br>
          <strong>Contact Person:</strong> ${providerName}<br>
          <strong>Email:</strong> ${email}<br>
          <strong>Phone:</strong> ${phone}<br>
          <strong>License Number:</strong> ${licenseNumber}
        </p>
      </div>

      <center>
        <a href="https://www.careconnectlive.org/admin/providers" class="button">Review in Admin Panel</a>
      </center>

      <p>Please verify the 245D license and approve or reject this application.</p>
    </div>
    ${footer}
  `)
})

export const adminNewCareSeekerNotification = (
  name: string,
  email: string,
  careNeeds: string,
  urgency: string
): { subject: string; html: string } => ({
  subject: `🆕 New Care Seeker Registration: ${name}`,
  html: wrapTemplate(`
    ${header}
    <div class="content">
      <h2>New Care Seeker Registration</h2>
      <p>A new care seeker has registered on CareConnect.</p>
      
      <div class="highlight-box">
        <strong>Care Seeker Details:</strong>
        <p style="margin-bottom: 0;">
          <strong>Name:</strong> ${name}<br>
          <strong>Email:</strong> ${email}<br>
          <strong>Urgency:</strong> ${urgency}<br>
          <strong>Care Needs:</strong> ${careNeeds}
        </p>
      </div>

      <center>
        <a href="https://www.careconnectlive.org/admin" class="button">View in Admin Panel</a>
      </center>
    </div>
    ${footer}
  `)
})