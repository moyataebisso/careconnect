// app/(public)/browse/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ServiceType, WaiverType, SERVICE_TYPE_LABELS, WAIVER_TYPE_SHORT } from '@/lib/types/careconnect'

interface Provider {
  id: string
  business_name: string
  city: string
  state: string
  service_types: ServiceType[]
  accepted_waivers: WaiverType[]
  total_capacity: number
  current_capacity: number
  description?: string
  primary_photo_url?: string
  languages_spoken?: string[]
  years_in_business?: number
  verified_245d: boolean
  address?: string
  zip_code?: string
}

interface User {
  id: string
  email?: string
}

export default function BrowseProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    city: '',
    serviceType: '',
    waiverType: '',
    hasAvailability: false,
  })
  const [user, setUser] = useState<User | null>(null)
  const [savedProviders, setSavedProviders] = useState<string[]>([])
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    loadProviders()
  }, [])

  useEffect(() => {
    if (user) {
      loadSavedProviders()
    }
  }, [user])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadProviders = async () => {
    try {
      const query = supabase
        .from('providers')
        .select('*')
        .eq('status', 'active')
        .eq('verified_245d', true)

      const { data, error } = await query

      if (error) throw error
      setProviders(data || [])
    } catch (error) {
      console.error('Error loading providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSavedProviders = async () => {
    if (!user) return
    
    try {
      // Get care seeker id
      const { data: careSeeker } = await supabase
        .from('care_seekers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (careSeeker) {
        const { data } = await supabase
          .from('saved_providers')
          .select('provider_id')
          .eq('care_seeker_id', careSeeker.id)
        
        setSavedProviders(data?.map(sp => sp.provider_id) || [])
      }
    } catch (error) {
      console.error('Error loading saved providers:', error)
    }
  }

  const handleSaveProvider = async (providerId: string) => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      // Get care seeker id
      const { data: careSeeker } = await supabase
        .from('care_seekers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!careSeeker) {
        alert('Please complete your care seeker profile first')
        router.push('/care-seeker/profile')
        return
      }

      if (savedProviders.includes(providerId)) {
        // Remove from saved
        await supabase
          .from('saved_providers')
          .delete()
          .eq('care_seeker_id', careSeeker.id)
          .eq('provider_id', providerId)
        
        setSavedProviders(prev => prev.filter(id => id !== providerId))
      } else {
        // Add to saved
        await supabase
          .from('saved_providers')
          .insert({
            care_seeker_id: careSeeker.id,
            provider_id: providerId
          })
        
        setSavedProviders(prev => [...prev, providerId])
      }
    } catch (error) {
      console.error('Error saving provider:', error)
    }
  }

  const handleContact = (providerId: string) => {
    if (!user) {
      router.push('/login')
      return
    }
    router.push(`/care-seeker/contact/${providerId}`)
  }

  const filteredProviders = providers.filter(provider => {
    if (filters.city && !provider.city.toLowerCase().includes(filters.city.toLowerCase())) {
      return false
    }
    if (filters.serviceType && !provider.service_types.includes(filters.serviceType as ServiceType)) {
      return false
    }
    if (filters.waiverType && !provider.accepted_waivers.includes(filters.waiverType as WaiverType)) {
      return false
    }
    if (filters.hasAvailability && provider.current_capacity >= provider.total_capacity) {
      return false
    }
    return true
  })

  const getAvailableSpots = (provider: Provider) => {
    return provider.total_capacity - provider.current_capacity
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              CareConnect
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link href="/care-seeker/dashboard" className="text-gray-700 hover:text-blue-600">
                    Dashboard
                  </Link>
                  <Link href="/care-seeker/saved" className="text-gray-700 hover:text-blue-600">
                    Saved ({savedProviders.length})
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-700 hover:text-blue-600">
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/register-care-seeker" 
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="City"
              value={filters.city}
              onChange={(e) => setFilters({...filters, city: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={filters.serviceType}
              onChange={(e) => setFilters({...filters, serviceType: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Services</option>
              <option value="ICS">Integrated Community Services</option>
              <option value="FRS">Family Residential Services</option>
              <option value="CRS">Community Residential Services</option>
              <option value="DC_DM">Day Care/Day Services</option>
              <option value="ADL_SUPPORT">ADLs Support</option>
              <option value="ASSISTED_LIVING">Assisted Living</option>
            </select>

            <select
              value={filters.waiverType}
              onChange={(e) => setFilters({...filters, waiverType: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Waivers</option>
              <option value="CADI">CADI Waiver</option>
              <option value="DD">DD Waiver</option>
              <option value="BI">BI Waiver</option>
              <option value="ELDERLY">Elderly Waiver</option>
            </select>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.hasAvailability}
                onChange={(e) => setFilters({...filters, hasAvailability: e.target.checked})}
                className="mr-2"
              />
              <span>Available spots only</span>
            </label>

            <button
              onClick={() => setFilters({ city: '', serviceType: '', waiverType: '', hasAvailability: false })}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Browse Care Providers
          </h1>
          <p className="text-gray-600">
            {filteredProviders.length} verified 245D providers found
          </p>
        </div>

        {filteredProviders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No providers found matching your criteria</p>
            <button
              onClick={() => setFilters({ city: '', serviceType: '', waiverType: '', hasAvailability: false })}
              className="mt-4 text-blue-600 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredProviders.map((provider) => {
              const availableSpots = getAvailableSpots(provider)
              const isSaved = savedProviders.includes(provider.id)
              
              return (
                <div key={provider.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">
                          {provider.business_name}
                        </h2>
                        <p className="text-gray-600">
                          {provider.city}, {provider.state} {provider.zip_code}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {provider.verified_245d && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            ✓ 245D Verified
                          </span>
                        )}
                        {availableSpots > 0 ? (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {availableSpots} spots available
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            Full
                          </span>
                        )}
                      </div>
                    </div>

                    {provider.description && (
                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {provider.description}
                      </p>
                    )}

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-600">Services:</span>
                        {provider.service_types.map((service) => (
                          <span key={service} className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {SERVICE_TYPE_LABELS[service]}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium text-gray-600">Accepts:</span>
                        {provider.accepted_waivers.map((waiver) => (
                          <span key={waiver} className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            {WAIVER_TYPE_SHORT[waiver]}
                          </span>
                        ))}
                      </div>
                    </div>

                    {provider.languages_spoken && provider.languages_spoken.length > 0 && (
                      <div className="mb-4">
                        <span className="text-sm font-medium text-gray-600">Languages: </span>
                        <span className="text-sm text-gray-700">{provider.languages_spoken.join(', ')}</span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Link
                        href={`/providers/${provider.id}`}
                        className="flex-1 text-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleSaveProvider(provider.id)}
                        className={`py-2 px-4 rounded-lg transition-colors ${
                          isSaved 
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {isSaved ? '★ Saved' : '☆ Save'}
                      </button>
                      <button
                        onClick={() => handleContact(provider.id)}
                        className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}