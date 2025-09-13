'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SERVICE_TYPE_LABELS, WAIVER_TYPE_SHORT } from '@/lib/types/careconnect'

interface CareSeeker {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  relationship_to_patient: string
  patient_name?: string
  care_needs: string
  preferred_city?: string
  preferred_zip?: string
  urgency: string
  created_at: string
  user_id?: string
}

interface SavedProvider {
  id: string
  provider_id: string
  created_at: string
  providers: {
    id: string
    business_name: string
    city: string
    state: string
    service_types: string[]
    accepted_waivers: string[]
    total_capacity: number
    current_capacity: number
  }
}

interface Booking {
  id: string
  provider_id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  date?: string
  time?: string
  status: string
  created_at: string
  providers?: {
    business_name: string
    city: string
    state: string
  }
}

export default function CareSeekerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [profile, setProfile] = useState<CareSeeker | null>(null)
  const [savedProviders, setSavedProviders] = useState<SavedProvider[]>([])
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState({
    savedCount: 0,
    bookingsCount: 0,
    confirmedBookings: 0,
    pendingBookings: 0
  })
  
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  // Real-time subscription for booking updates
  useEffect(() => {
    if (!profile?.email) return
    
    const subscription = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `customer_email=eq.${profile.email}`
        },
        (payload) => {
          // Reload dashboard data when bookings change
          loadDashboardData(profile.user_id || null, profile.email)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [profile?.email, profile?.user_id])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if user is a care seeker
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (userRole?.role !== 'care_seeker') {
        // Not a care seeker, redirect appropriately
        if (userRole?.role === 'provider') {
          router.push('/dashboard')
        } else if (userRole?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/')
        }
        return
      }

      await loadDashboardData(user.id, user.email)
    } catch (error) {
      console.error('Auth check error:', error)
      // Don't redirect on error, try to load data anyway
      await loadDashboardData(null, null)
    }
  }

  const loadDashboardData = async (userId: string | null, userEmail: string | null | undefined) => {
    try {
      // First try to load care seeker profile if userId exists
      let profileData = null
      if (userId) {
        const { data } = await supabase
          .from('care_seekers')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        profileData = data
      }

      // If no profile found and we have userEmail, create a basic profile
      if (!profileData && userEmail) {
        profileData = {
          id: userId || 'temp-' + Date.now(),
          first_name: userEmail.split('@')[0],
          last_name: '',
          email: userEmail,
          relationship_to_patient: 'self',
          care_needs: 'Not specified yet',
          urgency: 'within_week',
          created_at: new Date().toISOString(),
          user_id: userId
        }
      }

      if (!profileData) {
        profileData = {
          id: 'temp',
          first_name: 'User',
          last_name: '',
          email: '',
          relationship_to_patient: 'self',
          care_needs: 'Not specified yet',
          urgency: 'planning_ahead',
          created_at: new Date().toISOString()
        }
      }

      setProfile(profileData)

      // Load saved providers if we have a real profile ID
      if (profileData.id && !profileData.id.startsWith('temp')) {
        const { data: savedData } = await supabase
          .from('saved_providers')
          .select(`
            *,
            providers (
              id,
              business_name,
              city,
              state,
              service_types,
              accepted_waivers,
              total_capacity,
              current_capacity
            )
          `)
          .eq('care_seeker_id', profileData.id)
          .order('created_at', { ascending: false })
          .limit(5)

        setSavedProviders(savedData || [])
        
        // Get saved count
        const { count: savedCount } = await supabase
          .from('saved_providers')
          .select('*', { count: 'exact', head: true })
          .eq('care_seeker_id', profileData.id)

        setStats(prev => ({
          ...prev,
          savedCount: savedCount || 0
        }))
      }

      // Load ALL bookings and stats
      if (userEmail) {
        // Load recent bookings with provider info
        const { data: bookingsData, error } = await supabase
          .from('bookings')
          .select(`
            *,
            provider:providers!provider_id(
              business_name,
              city,
              state
            )
          `)
          .eq('customer_email', userEmail)
          .order('created_at', { ascending: false })
          .limit(5)

        if (!error) {
          // Transform the data to match expected structure
          const transformedBookings = (bookingsData || []).map(booking => ({
            ...booking,
            providers: booking.provider
          }))
          setRecentBookings(transformedBookings)
        }

        // Get accurate counts
        const { count: totalCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('customer_email', userEmail)

        // Count confirmed bookings
        const { count: confirmedCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('customer_email', userEmail)
          .eq('status', 'confirmed')

        // Count pending bookings
        const { count: pendingCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('customer_email', userEmail)
          .eq('status', 'pending')

        setStats(prev => ({
          ...prev,
          bookingsCount: totalCount || 0,
          confirmedBookings: confirmedCount || 0,
          pendingBookings: pendingCount || 0
        }))
      }

    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData(profile?.user_id || null, profile?.email || null)
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'text-red-600 bg-red-50'
      case 'within_week': return 'text-orange-600 bg-orange-50'
      case 'within_month': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-green-600 bg-green-50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'cancelled':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'confirmed': return 'Confirmed'
      case 'cancelled': return 'Cancelled'
      default: return status || 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {profile.first_name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Your care seeker dashboard
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <svg 
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <Link 
                href="/my-bookings"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                My Bookings
              </Link>
              <Link 
                href="/browse"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Browse Providers
              </Link>
              <Link 
                href="/care-seeker/profile"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.savedCount}</div>
            <div className="text-sm text-gray-600">Saved Providers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.bookingsCount}</div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{stats.confirmedBookings}</div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </div>
          <div className={`rounded-lg shadow p-6 ${getUrgencyColor(profile.urgency)}`}>
            <div className="text-lg font-bold capitalize">{profile.urgency.replace(/_/g, ' ')}</div>
            <div className="text-sm">Care Timeline</div>
          </div>
        </div>

        {/* Care Profile Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Your Care Profile</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Looking for care for: </span>
              <span className="text-gray-900">
                {profile.relationship_to_patient === 'self' ? 'Yourself' : profile.patient_name || 'Family member'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Preferred Location: </span>
              <span className="text-gray-900">
                {profile.preferred_city || profile.preferred_zip || 'Not specified'}
              </span>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-700">Care Needs: </span>
              <p className="text-gray-900 mt-1">{profile.care_needs}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <Link href="/care-seeker/profile" className="text-green-600 hover:text-green-700 text-sm font-medium">
              Update Care Preferences →
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Recent Bookings</h2>
                <Link href="/my-bookings" className="text-green-600 hover:text-green-700 text-sm font-medium">
                  View All ({stats.bookingsCount}) →
                </Link>
              </div>
            </div>
            <div className="divide-y">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {booking.providers?.business_name || 'Provider'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {booking.date && booking.time ? 
                            `${new Date(booking.date).toLocaleDateString()} at ${booking.time}` :
                            `Submitted: ${new Date(booking.created_at).toLocaleDateString()}`
                          }
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/booking-confirmation/${booking.id}`}
                        className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <p>No bookings yet</p>
                  <Link href="/browse" className="text-green-600 hover:text-green-700 text-sm font-medium mt-2 inline-block">
                    Browse Providers →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Saved Providers */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Recently Saved Providers</h2>
                <Link href="/care-seeker/saved" className="text-green-600 hover:text-green-700 text-sm font-medium">
                  View All →
                </Link>
              </div>
            </div>
            <div className="divide-y">
              {savedProviders.length > 0 ? (
                savedProviders.map((saved) => (
                  <div key={saved.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Link 
                          href={`/providers/${saved.provider_id}`}
                          className="font-medium text-gray-900 hover:text-green-600"
                        >
                          {saved.providers.business_name}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          {saved.providers.city}, {saved.providers.state}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            saved.providers.current_capacity < saved.providers.total_capacity
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {saved.providers.total_capacity - saved.providers.current_capacity} spots
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/booking?provider=${saved.provider_id}`}
                        className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <p>No saved providers yet</p>
                  <Link href="/browse" className="text-green-600 hover:text-green-700 text-sm font-medium mt-2 inline-block">
                    Browse Providers →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-green-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <Link 
              href="/browse"
              className="bg-white p-4 rounded-lg text-center hover:shadow-md transition-shadow"
            >
              <div className="text-green-600 mb-2">🔍</div>
              <p className="font-medium">Find Providers</p>
              <p className="text-sm text-gray-600 mt-1">Search for care facilities</p>
            </Link>
            <Link 
              href="/my-bookings"
              className="bg-white p-4 rounded-lg text-center hover:shadow-md transition-shadow"
            >
              <div className="text-green-600 mb-2">📅</div>
              <p className="font-medium">My Bookings</p>
              <p className="text-sm text-gray-600 mt-1">View all appointments</p>
            </Link>
            <Link 
              href="/care-seeker/saved"
              className="bg-white p-4 rounded-lg text-center hover:shadow-md transition-shadow"
            >
              <div className="text-green-600 mb-2">⭐</div>
              <p className="font-medium">Saved Providers</p>
              <p className="text-sm text-gray-600 mt-1">Your favorites list</p>
            </Link>
            <Link 
              href="/contact"
              className="bg-white p-4 rounded-lg text-center hover:shadow-md transition-shadow"
            >
              <div className="text-green-600 mb-2">💬</div>
              <p className="font-medium">Get Help</p>
              <p className="text-sm text-gray-600 mt-1">Contact support</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}