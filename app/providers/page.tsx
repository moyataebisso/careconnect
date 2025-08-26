'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Provider, ServiceType, WaiverType, SERVICE_TYPE_LABELS, WAIVER_TYPE_SHORT } from '@/lib/types/careconnect'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
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

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filters
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([])
  const [selectedWaivers, setSelectedWaivers] = useState<WaiverType[]>([])
  const [selectedCity, setSelectedCity] = useState('')
  const [maxDistance, setMaxDistance] = useState(50)
  const [showAvailableOnly, setShowAvailableOnly] = useState(true)

  const supabase = createClient()
  const router = useRouter()

  // Define fetchProviders function
  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setProviders(data)
        setFilteredProviders(data)
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    } finally {
      setLoading(false)
    }
  }

  // Only fetch providers once on mount
  useEffect(() => {
    fetchProviders()
    getUserLocation().then(location => {
      if (location) {
        setUserLocation(location)
      }
    })
  }, [])

  // Apply filters function
  const applyFilters = () => {
    let filtered = [...providers]

    // Filter by search query
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

    // Filter by availability
    if (showAvailableOnly) {
      filtered = filtered.filter(p => {
        const hasAvailability = p.current_capacity < p.total_capacity
        return hasAvailability && !p.is_at_capacity && !p.is_ghosted
      })
    }

    // Filter by services
    if (selectedServices.length > 0) {
      filtered = filtered.filter(p => 
        p.service_types && Array.isArray(p.service_types) && 
        selectedServices.some(service => p.service_types.includes(service))
      )
    }

    // Filter by waivers
    if (selectedWaivers.length > 0) {
      filtered = filtered.filter(p => 
        p.accepted_waivers && Array.isArray(p.accepted_waivers) && 
        selectedWaivers.some(waiver => p.accepted_waivers.includes(waiver))
      )
    }

    // Filter by city
    if (selectedCity && selectedCity.trim() !== '') {
      const cityQuery = selectedCity.toLowerCase().trim()
      filtered = filtered.filter(p => 
        p.city?.toLowerCase().includes(cityQuery)
      )
    }

    // Filter by distance if user location is available
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

  // Apply filters when filter criteria change
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

  const handleProviderClick = (provider: Provider) => {
    router.push(`/providers/${provider.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <h1 className="text-2xl font-bold text-gray-900">Find Care</h1>
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
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
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
                <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Map
              </button>
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

              {/* Service Types */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Service Types</h3>
                <div className="space-y-2">
                  {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(key as ServiceType)}
                        onChange={() => toggleService(key as ServiceType)}
                        className="mr-2"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Waiver Types */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Accepted Waivers</h3>
                <div className="space-y-2">
                  {Object.entries(WAIVER_TYPE_SHORT).map(([key, label]) => (
                    <label key={key} className="flex items-center text-sm">
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
                  setShowAvailableOnly(true)
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
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading providers...</p>
              </div>
            ) : filteredProviders.length === 0 ? (
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
              <div className="grid md:grid-cols-2 gap-6">
                {filteredProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer ${
                      provider.is_at_capacity ? 'opacity-60' : ''
                    }`}
                    onClick={() => handleProviderClick(provider)}
                  >
                    {/* Provider Image */}
                    <div className="h-48 bg-gray-200 rounded-t-lg relative">
                      {provider.primary_photo_url ? (
                        <img
                          src={provider.primary_photo_url}
                          alt={provider.business_name}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                          </svg>
                        </div>
                      )}
                      {provider.is_at_capacity && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-lg">
                          <span className="text-white font-semibold text-lg">At Capacity</span>
                        </div>
                      )}
                      {provider.verified_245d && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                          ✓ Verified 245D
                        </div>
                      )}
                      {userLocation && provider.latitude && provider.longitude && (
                        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-medium">
                          {calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            provider.latitude,
                            provider.longitude
                          )} miles away
                        </div>
                      )}
                    </div>

                    {/* Provider Info */}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{provider.business_name}</h3>
                      <p className="text-gray-600 mb-3">{provider.city}, MN {provider.zip_code}</p>

                      {/* Services */}
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {provider.service_types.slice(0, 3).map(service => (
                            <span key={service} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {service}
                            </span>
                          ))}
                          {provider.service_types.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{provider.service_types.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Waivers */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {provider.accepted_waivers.slice(0, 3).map(waiver => (
                            <span key={waiver} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                              {waiver}
                            </span>
                          ))}
                          {provider.accepted_waivers.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{provider.accepted_waivers.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Capacity */}
                      <div className="mb-4">
                        <div className="text-sm text-gray-600">
                          Capacity: {provider.total_capacity - provider.current_capacity} of {provider.total_capacity} available
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${((provider.total_capacity - provider.current_capacity) / provider.total_capacity) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Contact Button */}
                      <button
                        disabled={provider.is_at_capacity}
                        className={`w-full py-2 rounded-md font-medium transition-colors ${
                          provider.is_at_capacity
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {provider.is_at_capacity ? 'Currently Full' : 'View Details & Contact'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}