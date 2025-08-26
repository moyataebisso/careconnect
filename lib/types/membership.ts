// lib/types/membership.ts

export type MembershipTier = 'free' | 'basic' | 'premium'

export interface MembershipLimits {
  tier: MembershipTier
  max_listings: number
  max_photos_per_listing: number
  max_monthly_inquiries: number
  can_boost_listings: boolean
  boost_duration_days: number
  analytics_access: boolean
  priority_support: boolean
  verified_badge: boolean
  price_monthly: number
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  phone?: string
  company?: string
  role: 'user' | 'provider' | 'admin'
  verified: boolean
  membership_tier: MembershipTier
  membership_expires_at?: string
  monthly_inquiries_used: number
  monthly_inquiries_reset_at: string
  created_at: string
  updated_at: string
}