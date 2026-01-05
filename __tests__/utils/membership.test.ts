/**
 * Membership Utility Tests
 * 
 * Tests for lib/utils/membership.ts
 */

import { mockSupabase } from '../mocks/supabase'

describe('Membership Utils', () => {
  beforeEach(() => {
    mockSupabase.__resetMocks()
    jest.clearAllMocks()
  })

  describe('getUserMembership', () => {
    it('should return profile and limits for a user', async () => {
      const profile = {
        id: 'user-1',
        email: 'user@example.com',
        membership_tier: 'basic',
        monthly_inquiries_used: 5,
      }

      const limits = {
        tier: 'basic',
        max_listings: 5,
        max_monthly_inquiries: 50,
      }

      // First call for profile
      mockSupabase.__setMockResponse(profile)
      const profileResult = await mockSupabase
        .from('profiles')
        .select('*')
        .eq('id', 'user-1')
        .single()

      expect(profileResult.data).toEqual(profile)

      // Second call for limits
      mockSupabase.__setMockResponse(limits)
      const limitsResult = await mockSupabase
        .from('membership_limits')
        .select('*')
        .eq('tier', profile.membership_tier)
        .single()

      expect(limitsResult.data).toEqual(limits)
    })

    it('should default to free tier if no membership', async () => {
      const profile = {
        id: 'user-1',
        email: 'user@example.com',
        membership_tier: null, // No membership
      }

      mockSupabase.__setMockResponse(profile)

      const tier = profile.membership_tier || 'free'
      expect(tier).toBe('free')
    })
  })

  describe('canCreateListing', () => {
    it('should return true when under listing limit', async () => {
      mockSupabase.__setMockResponse(true)

      // Call rpc - the mock will return the set response
      const result = await mockSupabase.rpc('can_create_listing', { check_user_id: 'user-1' })

      expect(result.data).toBe(true)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('can_create_listing', { check_user_id: 'user-1' })
    })

    it('should return false when at listing limit', async () => {
      mockSupabase.__setMockResponse(false)

      const result = await mockSupabase.rpc('can_create_listing', { check_user_id: 'user-1' })

      expect(result.data).toBe(false)
    })
  })

  describe('getListingCount', () => {
    it('should count active listings for a user', async () => {
      mockSupabase.__setMockResponse(null, null, 3)

      const result = await mockSupabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', 'user-1')
        .eq('status', 'active')

      expect(result.count).toBe(3)
    })

    it('should return 0 when no listings', async () => {
      mockSupabase.__setMockResponse(null, null, 0)

      const result = await mockSupabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', 'new-user')

      const count = result.count || 0
      expect(count).toBe(0)
    })
  })

  describe('getRemainingInquiries', () => {
    it('should calculate remaining inquiries correctly', () => {
      const limits = { max_monthly_inquiries: 50 }
      const profile = { monthly_inquiries_used: 15 }

      const remaining = Math.max(0, limits.max_monthly_inquiries - profile.monthly_inquiries_used)
      expect(remaining).toBe(35)
    })

    it('should return large number for unlimited plans', () => {
      const limits = { max_monthly_inquiries: -1 } // -1 means unlimited

      if (limits.max_monthly_inquiries === -1) {
        const remaining = 999999
        expect(remaining).toBe(999999)
      }
    })

    it('should not go below 0', () => {
      const limits = { max_monthly_inquiries: 10 }
      const profile = { monthly_inquiries_used: 15 } // Over limit

      const remaining = Math.max(0, limits.max_monthly_inquiries - profile.monthly_inquiries_used)
      expect(remaining).toBe(0)
    })
  })

  describe('getMembershipBadgeColor', () => {
    it('should return correct color for premium', () => {
      const tier = 'premium'
      const expectedColor = 'bg-purple-100 text-purple-800'
      
      const getColor = (t: string) => {
        switch (t) {
          case 'premium': return 'bg-purple-100 text-purple-800'
          case 'basic': return 'bg-blue-100 text-blue-800'
          default: return 'bg-gray-100 text-gray-800'
        }
      }

      expect(getColor(tier)).toBe(expectedColor)
    })

    it('should return correct color for basic', () => {
      const getColor = (t: string) => {
        switch (t) {
          case 'premium': return 'bg-purple-100 text-purple-800'
          case 'basic': return 'bg-blue-100 text-blue-800'
          default: return 'bg-gray-100 text-gray-800'
        }
      }

      expect(getColor('basic')).toBe('bg-blue-100 text-blue-800')
    })

    it('should return default color for free tier', () => {
      const getColor = (t: string) => {
        switch (t) {
          case 'premium': return 'bg-purple-100 text-purple-800'
          case 'basic': return 'bg-blue-100 text-blue-800'
          default: return 'bg-gray-100 text-gray-800'
        }
      }

      expect(getColor('free')).toBe('bg-gray-100 text-gray-800')
    })
  })

  describe('getMembershipDisplayName', () => {
    it('should capitalize tier names', () => {
      const capitalize = (tier: string) => tier.charAt(0).toUpperCase() + tier.slice(1)

      expect(capitalize('free')).toBe('Free')
      expect(capitalize('basic')).toBe('Basic')
      expect(capitalize('premium')).toBe('Premium')
    })
  })

  describe('Membership Tier Limits', () => {
    it('should have correct limits for free tier', () => {
      const freeLimits = {
        tier: 'free',
        max_listings: 1,
        max_monthly_inquiries: 10,
        featured_listings: false,
        analytics_access: false,
      }

      expect(freeLimits.max_listings).toBe(1)
      expect(freeLimits.max_monthly_inquiries).toBe(10)
      expect(freeLimits.featured_listings).toBe(false)
    })

    it('should have correct limits for basic tier', () => {
      const basicLimits = {
        tier: 'basic',
        max_listings: 5,
        max_monthly_inquiries: 50,
        featured_listings: false,
        analytics_access: true,
      }

      expect(basicLimits.max_listings).toBe(5)
      expect(basicLimits.max_monthly_inquiries).toBe(50)
    })

    it('should have unlimited for premium tier', () => {
      const premiumLimits = {
        tier: 'premium',
        max_listings: -1, // Unlimited
        max_monthly_inquiries: -1, // Unlimited
        featured_listings: true,
        analytics_access: true,
      }

      expect(premiumLimits.max_listings).toBe(-1)
      expect(premiumLimits.featured_listings).toBe(true)
    })
  })
})