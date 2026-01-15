// lib/subscription/middleware.ts
import { createClient } from '@/lib/supabase/client'
import { SubscriptionStatus } from './config'

export interface SubscriptionCheck {
  hasAccess: boolean
  status: SubscriptionStatus
  planId?: string
  planName?: string
  message?: string
  requiresPayment: boolean
}

// Main function to check provider subscription status
export async function checkProviderSubscription(userId: string): Promise<SubscriptionCheck> {
  try {
    const supabase = createClient()

    // Check if user is a provider
    const { data: provider, error } = await supabase
      .from('providers')
      .select(`
        subscription_status,
        subscription_plan_id,
        subscription_start_date,
        subscription_end_date
      `)
      .eq('user_id', userId)
      .single()

    if (error || !provider) {
      return {
        hasAccess: false,
        status: 'no_account',
        requiresPayment: true,
        message: 'No provider account found'
      }
    }

    const now = new Date()

    // Check for grandfathered/permanent access (subscription_end_date in 2099 or similar)
    if (provider.subscription_status === 'active') {
      if (provider.subscription_end_date) {
        const subEnd = new Date(provider.subscription_end_date)
        const yearDiff = subEnd.getFullYear() - now.getFullYear()

        // If end date is more than 50 years in the future, it's permanent
        if (yearDiff > 50) {
          return {
            hasAccess: true,
            status: 'active',
            requiresPayment: false,
            message: 'Grandfathered account - permanent access'
          }
        }

        // Normal subscription check
        if (subEnd > now) {
          return {
            hasAccess: true,
            status: 'active',
            requiresPayment: false,
            message: 'Subscription active'
          }
        }
      } else if (provider.subscription_status === 'active') {
        // Active with no end date = permanent
        return {
          hasAccess: true,
          status: 'active',
          requiresPayment: false,
          message: 'Subscription active'
        }
      }
    }

    // No trial - payment required immediately for all non-active providers
    // This includes: new providers, expired, cancelled, past_due, or empty status
    return {
      hasAccess: false,
      status: provider.subscription_status === 'past_due' ? 'past_due' : 'expired',
      requiresPayment: true,
      message: 'Please subscribe to activate your listing'
    }

  } catch (error) {
    console.error('Subscription check error:', error)
    return {
      hasAccess: false,
      status: 'no_account',
      requiresPayment: true,
      message: 'Error checking subscription status'
    }
  }
}

// Check if user is a care seeker (they have free access to browse)
export async function checkIfCareSeeker(userId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data } = await supabase
    .from('care_seekers')
    .select('id')
    .eq('user_id', userId)
    .single()
  
  return !!data
}

// Check if user is a provider
export async function checkIfProvider(userId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data } = await supabase
    .from('providers')
    .select('id')
    .eq('user_id', userId)
    .single()
  
  return !!data
}

// Universal subscription check - determines user type and applies appropriate rules
export async function checkUserAccess(userId: string): Promise<SubscriptionCheck> {
  // Check if care seeker first (they get free access)
  const isCareSeeker = await checkIfCareSeeker(userId)
  if (isCareSeeker) {
    return {
      hasAccess: true,
      status: 'active',
      requiresPayment: false,
      message: 'Care seekers have free access to browse providers'
    }
  }
  
  // Check if provider (they need subscriptions)
  const isProvider = await checkIfProvider(userId)
  if (isProvider) {
    return checkProviderSubscription(userId)
  }
  
  // User is neither - probably needs to complete registration
  return {
    hasAccess: false,
    status: 'no_account',
    requiresPayment: false,
    message: 'Please complete your registration'
  }
}

// Backwards compatibility aliases
export const isCareSeeker = checkIfCareSeeker
export const checkUserSubscription = checkUserAccess