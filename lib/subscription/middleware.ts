// lib/subscription/middleware.ts
import { createClient } from '@/lib/supabase/client'
import { SUBSCRIPTION_CONFIG, SubscriptionStatus } from './config'

export interface SubscriptionCheck {
  hasAccess: boolean
  status: SubscriptionStatus
  planId?: string
  planName?: string
  trialDaysLeft?: number
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
        trial_ends_at,
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
    
    // Check trial period
    if (provider.subscription_status === 'trial' && provider.trial_ends_at) {
      const trialEnd = new Date(provider.trial_ends_at)
      
      if (trialEnd > now) {
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return { 
          hasAccess: true, 
          status: 'trial',
          trialDaysLeft: daysLeft,
          requiresPayment: false,
          message: `Trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`
        }
      } else {
        // Trial expired
        return {
          hasAccess: false,
          status: 'expired',
          requiresPayment: true,
          message: 'Your trial has expired. Please subscribe to continue.'
        }
      }
    }
    
    // Check if this is an existing provider without subscription data
    if (!provider.subscription_status || provider.subscription_status === '') {
      // Set them up with a trial starting now
      await supabase
        .from('providers')
        .update({
          subscription_status: 'trial',
          trial_ends_at: new Date(Date.now() + SUBSCRIPTION_CONFIG.trial.days * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('user_id', userId)
      
      return {
        hasAccess: true,
        status: 'trial',
        trialDaysLeft: SUBSCRIPTION_CONFIG.trial.days,
        requiresPayment: false,
        message: `Free trial activated - ${SUBSCRIPTION_CONFIG.trial.days} days remaining`
      }
    }
    
    // Default - subscription required
    return {
      hasAccess: false,
      status: 'expired',
      requiresPayment: true,
      message: 'Please subscribe to list your facility'
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