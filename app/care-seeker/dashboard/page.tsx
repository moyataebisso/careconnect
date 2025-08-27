// app/care-seeker/dashboard/page.tsx
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

interface Inquiry {
  id: string
  provider_id: string
  subject: string
  message: string
  status: string
  provider_response?: string
  created_at: string
  providers: {
    business_name: string
  }
}

export default function CareSeekerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<CareSeeker | null>(null)
  const [savedProviders, setSavedProviders] = useState<SavedProvider[]>([])
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([])
  const [stats, setStats] = useState({
    savedCount: 0,
    inquiriesCount: 0,
    newResponses: 0
  })
  
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

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

      await loadDashboardData(user.id)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/login')
    }
  }

  const loadDashboardData = async (userId: string) => {
    try {
      // Load care seeker profile
      const { data: profileData, error: profileError } = await supabase
        .from('care_seekers')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileError || !profileData) {
        console.error('Profile error:', profileError)
        // No profile yet, redirect to create one
        router.push('/care-seeker/complete-profile')
        return
      }

      setProfile(profileData)

      // Load saved providers
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

      // Load recent inquiries
      const { data: inquiriesData } = await supabase
        .from('provider_inquiries')
        .select(`
          *,
          providers (
            business_name
          )
        `)
        .eq('care_seeker_id', profileData.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentInquiries(inquiriesData || [])

      // Calculate stats
      const { count: savedCount } = await supabase
        .from('saved_providers')
        .select('*', { count: 'exact', head: true })
        .eq('care_seeker_id', profileData.id)

      const { count: inquiriesCount } = await supabase
        .from('provider_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('care_seeker_id', profileData.id)

      const { count: newResponses } = await supabase
        .from('provider_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('care_seeker_id', profileData.id)
        .eq('status', 'responded')
        .not('provider_response', 'is', null)

      setStats({
        savedCount: savedCount || 0,
        inquiriesCount: inquiriesCount || 0,
        newResponses: newResponses || 0
      })

    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
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
      case 'responded': return 'text-green-600 bg-green-50'
      case 'read': return 'text-blue-600 bg-blue-50'
      case 'pending': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.savedCount}</div>
            <div className="text-sm text-gray-600">Saved Providers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.inquiriesCount}</div>
            <div className="text-sm text-gray-600">Inquiries Sent</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{stats.newResponses}</div>
            <div className="text-sm text-gray-600">New Responses</div>
          </div>
          <div className={`rounded-lg shadow p-6 ${getUrgencyColor(profile.urgency)}`}>
            <div className="text-lg font-bold capitalize">{profile.urgency.replace('_', ' ')}</div>
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
                        href={`/care-seeker/contact/${saved.provider_id}`}
                        className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Contact
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

          {/* Recent Inquiries */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Recent Inquiries</h2>
                <Link href="/care-seeker/inquiries" className="text-green-600 hover:text-green-700 text-sm font-medium">
                  View All →
                </Link>
              </div>
            </div>
            <div className="divide-y">
              {recentInquiries.length > 0 ? (
                recentInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {inquiry.providers.business_name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {inquiry.subject}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(inquiry.status)}`}>
                            {inquiry.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(inquiry.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {inquiry.status === 'responded' && (
                        <Link
                          href={`/care-seeker/inquiries/${inquiry.id}`}
                          className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          View Reply
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <p>No inquiries sent yet</p>
                  <Link href="/browse" className="text-green-600 hover:text-green-700 text-sm font-medium mt-2 inline-block">
                    Contact Providers →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-green-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Need Help?</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link 
              href="/resources"
              className="bg-white p-4 rounded-lg text-center hover:shadow-md transition-shadow"
            >
              <div className="text-green-600 mb-2">📚</div>
              <p className="font-medium">Care Resources</p>
              <p className="text-sm text-gray-600 mt-1">Learn about waiver programs</p>
            </Link>
            <Link 
              href="/contact"
              className="bg-white p-4 rounded-lg text-center hover:shadow-md transition-shadow"
            >
              <div className="text-green-600 mb-2">💬</div>
              <p className="font-medium">Contact Support</p>
              <p className="text-sm text-gray-600 mt-1">Get help finding care</p>
            </Link>
            <Link 
              href="/faq"
              className="bg-white p-4 rounded-lg text-center hover:shadow-md transition-shadow"
            >
              <div className="text-green-600 mb-2">❓</div>
              <p className="font-medium">FAQs</p>
              <p className="text-sm text-gray-600 mt-1">Common questions answered</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}