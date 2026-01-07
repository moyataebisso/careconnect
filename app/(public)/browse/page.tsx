'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ServiceType, WaiverType, SERVICE_TYPE_LABELS, WAIVER_TYPE_SHORT, Provider } from '@/lib/types/careconnect'
import { getUserLocation, calculateDistance } from '@/lib/geocoding'

// Dynamic import for map to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  )
})

// Add this helper function after the imports
function getWaiverLabel(waiver: string): string {
  if (waiver === 'CAC' || waiver === 'private_pay') {
    return 'Private Pay';
  }
  // Use the WAIVER_TYPE_SHORT from imports
  return WAIVER_TYPE_SHORT[waiver as WaiverType] || waiver;
}

interface User {
  id: string
  email?: string
}

export default function BrowseProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [savedProviders, setSavedProviders] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filters - KEEPING WAIVER FILTERS
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([])
  const [selectedWaivers, setSelectedWaivers] = useState<WaiverType[]>([])
  const [selectedCity, setSelectedCity] = useState('')
  const [maxDistance, setMaxDistance] = useState(50)
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    loadProviders()
    getUserLocation().then(location => {
      if (location) {
        setUserLocation(location)
      }
    })
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
      // UPDATED QUERY: Only show providers who are:
      // 1. Admin approved (status = 'active' AND verified_245d = true)
      // 2. AND have ACTIVE subscription (paid) - no more free trials shown
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('status', 'active')
        .eq('verified_245d', true)
        .eq('subscription_status', 'active') // ONLY paid active subscriptions
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      const processedData = (data || []).map(provider => {
        const processedProvider: Provider = {
          ...provider,
          service_types: provider.service_types || [],
          accepted_waivers: provider.accepted_waivers || [],
          status: provider.status || 'active',
          is_at_capacity: provider.is_at_capacity || false,
          is_ghosted: provider.is_ghosted || false,
          referral_agreement_signed: provider.referral_agreement_signed || false,
          verified_245d: provider.verified_245d || false,
          total_capacity: provider.total_capacity || 0,
          current_capacity: provider.current_capacity || 0,
          created_at: provider.created_at || new Date().toISOString(),
          updated_at: provider.updated_at || new Date().toISOString()
        }

        if (!user) {
          delete processedProvider.contact_phone
          delete processedProvider.contact_email
          delete processedProvider.contact_person
        }

        return processedProvider
      })

      setProviders(processedData)
      setFilteredProviders(processedData)
    } catch (error) {
      console.error('Error loading providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSavedProviders = async () => {
    if (!user) return
    
    try {
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

  const applyFilters = () => {
    let filtered = [...providers]

    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(p => {
        const nameMatch = p.business_name?.toLowerCase().includes(query)
        const cityMatch = p.city?.toLowerCase().includes(query)
        const zipMatch = p.zip_code?.includes(query)
        const addressMatch = p.address?.toLowerCase().includes(query)
        return nameMatch || cityMatch || zipMatch || addressMatch
      })
    }

    if (showAvailableOnly) {
      filtered = filtered.filter(p => {
        const hasAvailability = p.current_capacity < p.total_capacity
        return hasAvailability && !p.is_at_capacity && !p.is_ghosted
      })
    }

    if (selectedServices.length > 0) {
      filtered = filtered.filter(p => 
        p.service_types && Array.isArray(p.service_types) && 
        selectedServices.some(service => p.service_types.includes(service))
      )
    }

    // KEEPING WAIVER FILTER - handle both CAC and private_pay
    if (selectedWaivers.length > 0) {
      filtered = filtered.filter(p => {
        if (!p.accepted_waivers || !Array.isArray(p.accepted_waivers)) return false
        
        return selectedWaivers.some(selectedWaiver => {
          // If user selects private_pay, match both CAC and private_pay in the database
          if (selectedWaiver === 'private_pay') {
            return p.accepted_waivers.some(w => w === 'private_pay')
          }
          return p.accepted_waivers.includes(selectedWaiver)
        })
      })
    }

    if (selectedCity && selectedCity.trim() !== '') {
      const cityQuery = selectedCity.toLowerCase().trim()
      filtered = filtered.filter(p => 
        p.city?.toLowerCase().includes(cityQuery)
      )
    }

    if (userLocation && maxDistance < 200 && providers.some(p => p.latitude && p.longitude)) {
      filtered = filtered.filter(p => {
        if (p.latitude && p.longitude) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            p.latitude,
            p.longitude
          )
          return distance <= maxDistance
        }
        return true
      })
    }

    setFilteredProviders(filtered)
  }

  useEffect(() => {
    if (providers.length > 0) {
      applyFilters()
    }
  }, [selectedServices, selectedWaivers, selectedCity, maxDistance, showAvailableOnly, searchQuery, userLocation, providers])

  const toggleService = (service: ServiceType) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }

  const toggleWaiver = (waiver: WaiverType) => {
    setSelectedWaivers(prev =>
      prev.includes(waiver)
        ? prev.filter(w => w !== waiver)
        : [...prev, waiver]
    )
  }

  const handleSaveProvider = async (providerId: string) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
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
        await supabase
          .from('saved_providers')
          .delete()
          .eq('care_seeker_id', careSeeker.id)
          .eq('provider_id', providerId)
        
        setSavedProviders(prev => prev.filter(id => id !== providerId))
      } else {
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
      router.push('/auth/login')
      return
    }
    router.push(`/booking?provider=${providerId}`)
  }

  const handleProviderClick = (provider: Provider) => {
    router.push(`/providers/${provider.id}`)
  }

  const getAvailableSpots = (provider: Provider) => {
    return provider.total_capacity - provider.current_capacity
  }

  const getProviderPhoto = (provider: Provider) => {
    if (provider.primary_photo_url) {
      return provider.primary_photo_url
    }
    if (provider.photo_urls && provider.photo_urls.length > 0) {
      return provider.photo_urls[0]
    }
    return null
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
      {/* Header Search */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <h1 className="text-2xl font-bold text-gray-900">Browse 245D Care Providers</h1>
              <span className="text-gray-500">
                {filteredProviders.length} providers found
              </span>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, city, or ZIP code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg 
                  className="absolute right-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'map' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Map
                </button>
              </div>
              
              {/* Auth Actions */}
              {user ? (
                <Link href="/care-seeker/saved" className="text-gray-700 hover:text-blue-600 font-medium">
                  Saved ({savedProviders.length})
                </Link>
              ) : (
                <div className="flex gap-2">
                  <Link href="/auth/login" className="text-gray-700 hover:text-blue-600">
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/register-care-seeker" 
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>

              {/* Availability Filter */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showAvailableOnly}
                    onChange={(e) => setShowAvailableOnly(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Show available only</span>
                </label>
              </div>

              {/* 245D Service Types */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">245D Service Types</h3>
                
                {/* Basic Services */}
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-blue-600 mb-2">Basic Services</h4>
                  <div className="space-y-2 ml-2">
                    {['ICS', 'FRS', 'CRS', 'DC_DM'].map(key => (
                      <label key={key} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(key as ServiceType)}
                          onChange={() => toggleService(key as ServiceType)}
                          className="mr-2"
                        />
                        <span className="text-xs">{SERVICE_TYPE_LABELS[key as keyof typeof SERVICE_TYPE_LABELS]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Comprehensive Services */}
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-2">Comprehensive Services</h4>
                  <div className="space-y-2 ml-2">
                    {['ADL_SUPPORT', 'ASSISTED_LIVING'].map(key => (
                      <label key={key} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(key as ServiceType)}
                          onChange={() => toggleService(key as ServiceType)}
                          className="mr-2"
                        />
                        <span className="text-xs">{SERVICE_TYPE_LABELS[key as keyof typeof SERVICE_TYPE_LABELS]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Types - Updated to show Private Pay */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Accepted Payment Types</h3>
                <div className="space-y-2">
                  {Object.entries(WAIVER_TYPE_SHORT).map(([key, label], index) => (
                    <label key={`${key}-${index}`} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={selectedWaivers.includes(key as WaiverType)}
                        onChange={() => toggleWaiver(key as WaiverType)}
                        className="mr-2"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Location</h3>
                <input
                  type="text"
                  placeholder="City name..."
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                {userLocation && (
                  <div className="mt-3">
                    <label className="text-sm text-gray-600">
                      Within {maxDistance} miles
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="10"
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(Number(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSelectedServices([])
                  setSelectedWaivers([])
                  setSelectedCity('')
                  setMaxDistance(50)
                  setShowAvailableOnly(false)
                  setSearchQuery('')
                }}
                className="w-full py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:w-3/4">
            {filteredProviders.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600">No providers found matching your criteria.</p>
                <button
                  onClick={() => {
                    setSelectedServices([])
                    setSelectedWaivers([])
                    setSelectedCity('')
                    setShowAvailableOnly(false)
                    setSearchQuery('')
                  }}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Clear filters and try again
                </button>
              </div>
            ) : viewMode === 'map' ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <MapComponent 
                  providers={filteredProviders}
                  height="700px"
                  onProviderClick={handleProviderClick}
                  showSearch={false}
                />
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredProviders.map((provider, index) => {
                  const availableSpots = getAvailableSpots(provider)
                  const isSaved = savedProviders.includes(provider.id)
                  const providerPhoto = getProviderPhoto(provider)
                  
                  return (
                    <div key={`${provider.id}-${index}`} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                      <div className="flex flex-col md:flex-row">
                        {/* Photo Section */}
                        {providerPhoto && (
                          <div className="md:w-48 h-48 md:h-auto flex-shrink-0">
                            <img
                              src={providerPhoto}
                              alt={provider.business_name}
                              className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Content Section */}
                        <div className="flex-1 p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                                {provider.business_name}
                              </h2>
                              <p className="text-gray-600">
                                {provider.city}, {provider.state} {provider.zip_code}
                              </p>
                              {user && provider.contact_phone && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Contact: {provider.contact_person}
                                </p>
                              )}
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
                              {provider.service_types.map((service, serviceIndex) => (
                                <span key={`${provider.id}-service-${service}-${serviceIndex}`} className="text-sm bg-gray-100 px-2 py-1 rounded">
                                  {SERVICE_TYPE_LABELS[service] || service}
                                </span>
                              ))}
                            </div>
                            
                            {/* Updated waiver display using helper function */}
                            <div className="flex flex-wrap gap-2">
                              <span className="text-sm font-medium text-gray-600">Accepts:</span>
                              {provider.accepted_waivers.map((waiver, waiverIndex) => (
                                <span key={`${provider.id}-waiver-${waiver}-${waiverIndex}`} className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                  {getWaiverLabel(waiver)}
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
                            
                            {user ? (
                              <>
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
                                  Book Service
                                </button>
                              </>
                            ) : (
                              <Link
                                href="/auth/login"
                                className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Sign in to Book
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}