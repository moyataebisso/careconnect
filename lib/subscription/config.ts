// lib/subscription/config.ts
// Centralized configuration for PROVIDER subscriptions

export const SUBSCRIPTION_CONFIG = {
  plans: {
    basic: {
      id: 'basic',
      name: 'Basic Provider Plan',
      price: process.env.NEXT_PUBLIC_BASE_PRICE || 99.99,
      priceDisplay: '$99.99',
      interval: 'month',
      features: [
        'List your facility',
        'Receive unlimited referral requests',
        'Upload up to 10 photos',
        'Manage availability and capacity',
        '245D verified badge',
        'Messaging with care seekers',
        'Email support'
      ],
      stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || null
    },
    premium: {
      id: 'premium', 
      name: 'Premium Provider Plan',
      price: process.env.NEXT_PUBLIC_PREMIUM_PRICE || 139.99,
      priceDisplay: '$139.99',
      interval: 'month',
      features: [
        'Everything in Basic',
        'Priority placement in search results',
        'Featured provider badge',
        'Upload up to 50 photos',
        'Advanced analytics dashboard',
        'Priority support',
        'Dedicated account manager'
      ],
      stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || null
    }
  },
  
  // Trial removed - payment required immediately after registration
  
  // Provider dashboard pages that require subscription
  protectedProviderPaths: [
    '/dashboard',
    '/dashboard/profile',
    '/dashboard/photos',
    '/dashboard/messages',
    '/dashboard/bookings',
    '/dashboard/analytics'
  ],
  
  // Care seeker pages (always free)
  careSeekerpaths: [
    '/providers',
    '/providers/[id]',
    '/booking',
    '/messages'
  ],
  
  // Public pages (always free for everyone)
  publicPaths: [
    '/',
    '/about',
    '/contact',
    '/auth/login',
    '/auth/register',
    '/auth/register-care-seeker',
    '/auth/register-provider',
    '/subscribe',
    '/pricing'
  ]
}

export type PlanId = keyof typeof SUBSCRIPTION_CONFIG.plans
export type SubscriptionStatus = 'pending' | 'active' | 'cancelled' | 'expired' | 'past_due' | 'no_account'