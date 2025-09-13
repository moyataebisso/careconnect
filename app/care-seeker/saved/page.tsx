// app/care-seeker/saved/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SERVICE_TYPE_LABELS, WAIVER_TYPE_SHORT } from '@/lib/types/careconnect'

interface SavedProvider {
  id: string
  provider_id: string
  notes?: string
  created_at: string
  providers: {
    id: string
    business_name: string
    address?: string
    city: string
    state: string
    zip_code?: string
    service_types: string[]
    accepted_waivers: string[]
    total_capacity: number
    current_capacity: number
    description?: string
    contact_phone?: string
    languages_spoken?: string[]
    years_in_business?: number
    verified_245d: boolean
  }
}

export default function SavedProvidersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [savedProviders, setSavedProviders] = useState<SavedProvider[]>([])
  const [filterCity, setFilterCity] = useState('')
  const [filterAvailable, setFilterAvailable] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'availability'>('date')
  
  const supabase = createClient()

  useEffect(() => {
    loadSavedProviders()
  }, [])

  const loadSavedProviders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get care seeker profile
      const { data: careSeeker } = await supabase
        .from('care_seekers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!careSeeker) {
        router.push('/care-seeker/dashboard')
        return
      }

      // Load saved providers with full provider details
      const { data, error } = await supabase
        .from('saved_providers')
        .select(`
          *,
          providers (
            id,
            business_name,
            address,
            city,
            state,
            zip_code,
            service_types,
            accepted_waivers,
            total_capacity,
            current_capacity,
            description,
            contact_phone,
            languages_spoken,
            years_in_business,
            verified_245d
          )
        `)
        .eq('care_seeker_id', careSeeker.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setSavedProviders(data || [])
    } catch (error) {
      console.error('Error loading saved providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSaved = async (savedId: string) => {
    if (!confirm('Are you sure you want to remove this provider from your saved list?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('saved_providers')
        .delete()
        .eq('id', savedId)

      if (error) throw error

      setSavedProviders(prev => prev.filter(sp => sp.id !== savedId))
    } catch (error) {
      console.error('Error removing saved provider:', error)
      alert('Failed to remove provider. Please try again.')
    }
  }

  const handleUpdateNotes = async (savedId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('saved_providers')
        .update({ notes })
        .eq('id', savedId)

      if (error) throw error

      setSavedProviders(prev => 
        prev.map(sp => 
          sp.id === savedId ? { ...sp, notes } : sp
        )
      )
    } catch (error) {
      console.error('Error updating notes:', error)
    }
  }

  const getAvailableSpots = (provider: SavedProvider['providers']) => {
    return provider.total_capacity - provider.current_capacity
  }

  // Filter and sort providers
  const filteredProviders = savedProviders.filter(saved => {
    if (filterCity && !saved.providers.city.toLowerCase().includes(filterCity.toLowerCase())) {
      return false
    }
    if (filterAvailable && getAvailableSpots(saved.providers) <= 0) {
      return false
    }
    return true
  })

  const sortedProviders = [...filteredProviders].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.providers.business_name.localeCompare(b.providers.business_name)
      case 'availability':
        return getAvailableSpots(b.providers) - getAvailableSpots(a.providers)
      case 'date':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Saved Providers</h1>
              <p className="text-gray-600 mt-1">
                {savedProviders.length} provider{savedProviders.length !== 1 ? 's' : ''} saved
              </p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/browse"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Browse More Providers
              </Link>
              <Link 
                href="/care-seeker/dashboard"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="bg-white border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="Filter by city..."
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filterAvailable}
                onChange={(e) => setFilterAvailable(e.target.checked)}
                className="mr-2"
              />
              <span>Available spots only</span>
            </label>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'availability')}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="date">Date Saved</option>
                <option value="name">Provider Name</option>
                <option value="availability">Available Spots</option>
              </select>
            </div>

            {(filterCity || filterAvailable) && (
              <button
                onClick={() => {
                  setFilterCity('')
                  setFilterAvailable(false)
                }}
                className="text-green-600 hover:text-green-800 text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Saved Providers List */}
      <div className="container mx-auto px-4 py-8">
        {sortedProviders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">
              {savedProviders.length === 0 
                ? "You haven't saved any providers yet." 
                : "No providers match your current filters."}
            </p>
            <Link 
              href="/browse"
              className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Providers
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {sortedProviders.map((saved) => {
              const availableSpots = getAvailableSpots(saved.providers)
              
              return (
                <div key={saved.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Provider Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">
                          {saved.providers.business_name}
                        </h2>
                        <p className="text-gray-600">
                          {saved.providers.address && `${saved.providers.address}, `}
                          {saved.providers.city}, {saved.providers.state} {saved.providers.zip_code}
                        </p>
                        {saved.providers.contact_phone && (
                          <p className="text-gray-600 mt-1">
                            Phone: <a href={`tel:${saved.providers.contact_phone}`} className="text-green-600 hover:text-green-700">
                              {saved.providers.contact_phone}
                            </a>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {saved.providers.verified_245d && (
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
                        <span className="text-xs text-gray-500">
                          Saved {new Date(saved.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {saved.providers.description && (
                      <p className="text-gray-700 mb-4">
                        {saved.providers.description}
                      </p>
                    )}

                    {/* Services and Waivers */}
                    <div className="mb-4 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium text-gray-600">Services:</span>
                        {saved.providers.service_types.map((service) => (
                          <span key={service} className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {SERVICE_TYPE_LABELS[service as keyof typeof SERVICE_TYPE_LABELS] || service}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium text-gray-600">Accepts:</span>
                        {saved.providers.accepted_waivers.map((waiver) => (
                          <span key={waiver} className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            {WAIVER_TYPE_SHORT[waiver as keyof typeof WAIVER_TYPE_SHORT] || waiver}
                          </span>
                        ))}
                      </div>

                      {saved.providers.languages_spoken && saved.providers.languages_spoken.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm font-medium text-gray-600">Languages:</span>
                          <span className="text-sm text-gray-700">
                            {saved.providers.languages_spoken.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes Section */}
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <label className="text-sm font-medium text-gray-700">Your Notes:</label>
                      <textarea
                        value={saved.notes || ''}
                        onChange={(e) => handleUpdateNotes(saved.id, e.target.value)}
                        onBlur={(e) => handleUpdateNotes(saved.id, e.target.value)}
                        placeholder="Add personal notes about this provider..."
                        className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        rows={2}
                      />
                    </div>

                    {/* Action Buttons - UPDATED THIS SECTION */}
                    <div className="flex gap-3">
                      <Link
                        href={`/providers/${saved.provider_id}`}
                        className="flex-1 text-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Full Details
                      </Link>
                      <Link
                        href={`/booking?provider=${saved.provider_id}`}
                        className="flex-1 text-center py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Book Service
                      </Link>
                      <button
                        onClick={() => handleRemoveSaved(saved.id)}
                        className="py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Remove
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