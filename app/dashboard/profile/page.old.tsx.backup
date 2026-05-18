'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ServiceType, WaiverType, SERVICE_TYPE_LABELS, WAIVER_TYPE_LABELS } from '@/lib/types/careconnect'
import { geocodeAddress } from '@/lib/geocoding'

interface ProviderData {
  id: string
  business_name?: string
  business_email?: string
  license_number?: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  latitude?: number
  longitude?: number
  service_types?: ServiceType[]
  accepted_waivers?: WaiverType[]
  total_capacity?: number
  current_capacity?: number
  description?: string
  amenities?: string[]
  languages_spoken?: string[]
  years_in_business?: number
  primary_photo_url?: string
  status?: string
}

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [provider, setProvider] = useState<ProviderData | null>(null)
  const [formData, setFormData] = useState({
    business_name: '',
    license_number: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    city: '',
    zip_code: '',
    latitude: null as number | null,
    longitude: null as number | null,
    service_types: [] as ServiceType[],
    accepted_waivers: [] as WaiverType[],
    total_capacity: '',
    current_capacity: '',
    description: '',
    amenities: '',
    languages_spoken: '',
    years_in_business: '',
    primary_photo_url: ''
  })

  const supabase = createClient()

  useEffect(() => {
    loadProvider()
  }, [])

  const loadProvider = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: providerData, error } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error loading provider:', error)
        if (error.code === 'PGRST116') {
          router.push('/dashboard')
          return
        }
      }

      if (!providerData) {
        router.push('/dashboard')
        return
      }

      setProvider(providerData)
      
      setFormData({
        business_name: providerData.business_name || '',
        license_number: providerData.license_number || '',
        contact_name: providerData.contact_name || '',
        contact_phone: providerData.contact_phone || '',
        contact_email: providerData.contact_email || '',
        address: providerData.address || '',
        city: providerData.city || '',
        zip_code: providerData.zip_code || '',
        latitude: providerData.latitude || null,
        longitude: providerData.longitude || null,
        service_types: providerData.service_types || [],
        accepted_waivers: providerData.accepted_waivers || [],
        total_capacity: providerData.total_capacity?.toString() || '',
        current_capacity: providerData.current_capacity?.toString() || '',
        description: providerData.description || '',
        amenities: providerData.amenities?.join(', ') || '',
        languages_spoken: providerData.languages_spoken?.join(', ') || '',
        years_in_business: providerData.years_in_business?.toString() || '',
        primary_photo_url: providerData.primary_photo_url || ''
      })
    } catch (error) {
      console.error('Error loading provider:', error)
      alert('Error loading provider data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Geocode address when address fields change
  const geocodeIfAddressComplete = async () => {
    if (formData.address && formData.city && formData.zip_code) {
      setGeocoding(true)
      try {
        const result = await geocodeAddress(
          formData.address,
          formData.city,
          'MN',
          formData.zip_code
        )
        
        if (result) {
          console.log('Geocoding successful:', result)
          setFormData(prev => ({
            ...prev,
            latitude: result.latitude,
            longitude: result.longitude
          }))
        } else {
          console.warn('Geocoding returned no results')
        }
      } catch (error) {
        console.error('Geocoding error:', error)
      } finally {
        setGeocoding(false)
      }
    }
  }

  // Trigger geocoding when address fields lose focus
  const handleAddressBlur = () => {
    geocodeIfAddressComplete()
  }

  const handleServiceTypeChange = (service: ServiceType) => {
    setFormData(prev => ({
      ...prev,
      service_types: prev.service_types.includes(service)
        ? prev.service_types.filter(s => s !== service)
        : [...prev.service_types, service]
    }))
  }

  const handleWaiverChange = (waiver: WaiverType) => {
    setFormData(prev => ({
      ...prev,
      accepted_waivers: prev.accepted_waivers.includes(waiver)
        ? prev.accepted_waivers.filter(w => w !== waiver)
        : [...prev.accepted_waivers, waiver]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!provider) {
      alert('No provider data found')
      return
    }
    
    setSaving(true)

    try {
      // Geocode one more time if needed before saving
      let latitude = formData.latitude
      let longitude = formData.longitude
      
      if (!latitude || !longitude) {
        const result = await geocodeAddress(
          formData.address,
          formData.city,
          'MN',
          formData.zip_code
        )
        if (result) {
          latitude = result.latitude
          longitude = result.longitude
        }
      }

      const updateData = {
        business_name: formData.business_name,
        license_number: formData.license_number,
        contact_name: formData.contact_name,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        address: formData.address,
        city: formData.city,
        state: 'MN',
        zip_code: formData.zip_code,
        latitude: latitude,
        longitude: longitude,
        service_types: formData.service_types,
        accepted_waivers: formData.accepted_waivers,
        total_capacity: parseInt(formData.total_capacity) || 0,
        current_capacity: parseInt(formData.current_capacity) || 0,
        description: formData.description || null,
        amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()) : [],
        languages_spoken: formData.languages_spoken ? formData.languages_spoken.split(',').map(l => l.trim()) : [],
        years_in_business: formData.years_in_business ? parseInt(formData.years_in_business) : null,
        primary_photo_url: formData.primary_photo_url || null,
        last_updated: new Date().toISOString()
      }

      console.log('Updating provider with coordinates:', { latitude, longitude })

      const { data, error } = await supabase
        .from('providers')
        .update(updateData)
        .eq('id', provider.id)
        .select()

      if (error) {
        console.error('Update error details:', error)
        throw error
      }

      console.log('Update successful:', data)
      alert('Profile updated successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error updating profile:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to update profile: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No provider profile found</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Edit Provider Profile</h1>
          <p className="text-gray-600 mt-2">Update your facility information and services</p>
          {provider.status === 'pending' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">Your profile is pending approval. Updates will be reviewed by an admin.</p>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number *
                </label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person *
                </label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Location
              {geocoding && <span className="ml-2 text-sm text-blue-600">(Getting coordinates...)</span>}
              {formData.latitude && formData.longitude && (
                <span className="ml-2 text-sm text-green-600">✓ Location mapped</span>
              )}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  onBlur={handleAddressBlur}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    onBlur={handleAddressBlur}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleInputChange}
                    onBlur={handleAddressBlur}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {!formData.latitude && !formData.longitude && formData.address && (
                <p className="text-sm text-amber-600">
                  ⚠️ Your location will not appear on the map until we can verify your address. 
                  Please ensure your address is complete and correct.
                </p>
              )}
            </div>
          </div>

          {/* Services & Capacity */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Services & Capacity</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Types *
              </label>
              <div className="space-y-2">
                {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map(service => (
                  <label key={service} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.service_types.includes(service)}
                      onChange={() => handleServiceTypeChange(service)}
                      className="mr-3"
                    />
                    <span>{service} - {SERVICE_TYPE_LABELS[service]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accepted Waivers *
              </label>
              <div className="space-y-2">
                {(Object.keys(WAIVER_TYPE_LABELS) as WaiverType[]).map(waiver => (
                  <label key={waiver} className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.accepted_waivers.includes(waiver)}
                      onChange={() => handleWaiverChange(waiver)}
                      className="mr-3 mt-1"
                    />
                    <span>{waiver} - {WAIVER_TYPE_LABELS[waiver]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Capacity *
                </label>
                <input
                  type="number"
                  name="total_capacity"
                  value={formData.total_capacity}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Occupancy *
                </label>
                <input
                  type="number"
                  name="current_capacity"
                  value={formData.current_capacity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your facility and the care you provide..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amenities (comma-separated)
                </label>
                <input
                  type="text"
                  name="amenities"
                  value={formData.amenities}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 24/7 Staff, Home-Cooked Meals, Transportation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Languages Spoken (comma-separated)
                </label>
                <input
                  type="text"
                  name="languages_spoken"
                  value={formData.languages_spoken}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., English, Spanish, Somali"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years in Business
                </label>
                <input
                  type="number"
                  name="years_in_business"
                  value={formData.years_in_business}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Link
              href="/dashboard"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}