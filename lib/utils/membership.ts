// lib/utils/membership.ts

import { createClient } from '@/lib/supabase/server'
import { MembershipTier, MembershipLimits } from '@/lib/types/membership'

export async function getUserMembership(userId: string) {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  const { data: limits } = await supabase
    .from('membership_limits')
    .select('*')
    .eq('tier', profile?.membership_tier || 'free')
    .single()

  return {
    profile,
    limits
  }
}

export async function canCreateListing(userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .rpc('can_create_listing', { check_user_id: userId })
  
  return data || false
}

export async function getListingCount(userId: string): Promise<number> {
  const supabase = await createClient()
  
  const { count } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active')

  return count || 0
}

export async function getRemainingInquiries(userId: string): Promise<number> {
  const { profile, limits } = await getUserMembership(userId)
  
  if (!limits || limits.max_monthly_inquiries === -1) {
    return 999999 // Unlimited
  }
  
  return Math.max(0, limits.max_monthly_inquiries - (profile?.monthly_inquiries_used || 0))
}

export function getMembershipBadgeColor(tier: MembershipTier): string {
  switch (tier) {
    case 'premium':
      return 'bg-purple-100 text-purple-800'
    case 'basic':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getMembershipDisplayName(tier: MembershipTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}