// app/admin/providers/[id]/edit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ServiceType, WaiverType, SERVICE_TYPE_LABELS, WAIVER_TYPE_LABELS } from '@/lib/types/careconnect'
import { geocodeAddress } from '@/lib/geocoding'
import AdminPhotoUploadSection from '@/app/components/AdminPhotoUploadSection'

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
  photo_urls?: string[]
  status?: string
  verified_245d?: boolean
  contact_person?: string
}

export default function AdminEditProviderPage() {
  const router = useRouter()
  const params = useParams()
  const providerId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [provider, setProvider] = useState<ProviderData | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
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
    primary_photo_url: '',
    photo_urls: [] as string[],
    status: 'pending',
    verified_245d: false
  })

  const supabase = createClient()

  useEffect(() => {
    checkAdminAndLoadProvider()
  }, [providerId])

  const checkAdminAndLoadProvider = async () => {
    try {
      // Check admin access
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!adminUser) {
        alert('Access denied. Admin privileges required.')
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)

      // Load provider data
      const { data: providerData, error } = await supabase
        .from('providers')
        .select('*')
        .eq('id', providerId)
        .single()

      if (error || !providerData) {
        alert('Provider not found')
        router.push('/admin/providers')
        return
      }

      setProvider(providerData)
      
      // Populate form with existing data
      setFormData({
        business_name: providerData.business_name || '',
        license_number: providerData.license_number || '',
        contact_name: providerData.contact_name || providerData.contact_person || '',
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
        primary_photo_url: providerData.primary_photo_url || '',
        photo_urls: providerData.photo_urls || [],
        status: providerData.status || 'pending',
        verified_245d: providerData.verified_245d || false
      })
    } catch (error) {
      console.error('Error:', error)
      alert('Error loading provider data')
      router.push('/admin/providers')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

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
          setFormData(prev => ({
            ...prev,
            latitude: result.latitude,
            longitude: result.longitude
          }))
        }
      } catch (error) {
        console.error('Geocoding error:', error)
      } finally {
        setGeocoding(false)
      }
    }
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

  const handlePhotosUpdate = (photos: string[], primaryPhoto: string | null) => {
    setFormData(prev => ({
      ...prev,
      photo_urls: photos,
      primary_photo_url: primaryPhoto || ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Geocode if needed
      let latitude = formData.latitude
      let longitude = formData.longitude
      
      if (!latitude || !longitude && formData.address) {
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
        contact_person: formData.contact_name, // Keep both fields in sync
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        address: formData.address,
        city: formData.city,
        state: 'MN',
        zip_code: formData.zip_code,
        latitude: latitude,
        longitude: longitude,
        service_types: formData.service_types.length > 0 ? formData.service_types : [],
        accepted_waivers: formData.accepted_waivers.length > 0 ? formData.accepted_waivers : [],
        total_capacity: parseInt(formData.total_capacity) || 0,
        current_capacity: parseInt(formData.current_capacity) || 0,
        description: formData.description || null,
        amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()) : [],
        languages_spoken: formData.languages_spoken ? formData.languages_spoken.split(',').map(l => l.trim()) : [],
        years_in_business: formData.years_in_business ? parseInt(formData.years_in_business) : null,
        primary_photo_url: formData.primary_photo_url || null,
        photo_urls: formData.photo_urls || [],
        status: formData.status,
        verified_245d: formData.verified_245d,
        last_updated: new Date().toISOString()
      }

      const { error } = await supabase
        .from('providers')
        .update(updateData)
        .eq('id', providerId)

      if (error) throw error

      alert('Provider updated successfully!')
      router.push('/admin/providers')
    } catch (error) {
      console.error('Error updating provider:', error)
      alert('Failed to update provider')
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

  if (!isAdmin || !provider) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/providers" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Providers List
          </Link>
          <h1 className="text-3xl font-bold">Edit Provider (Admin)</h1>
          <p className="text-gray-600 mt-2">Editing: {provider.business_name}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Admin Controls */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3 text-yellow-900">Admin Controls</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    name="verified_245d"
                    checked={formData.verified_245d}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">245D Verified</span>
                </label>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
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
                  Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  onBlur={geocodeIfAddressComplete}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    onBlur={geocodeIfAddressComplete}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleInputChange}
                    onBlur={geocodeIfAddressComplete}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Services & Capacity */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Services & Capacity</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Types (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">Leave unchecked if no services selected</p>
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
                Accepted Waivers (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">Leave unchecked if no waivers accepted</p>
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
                  Total Capacity
                </label>
                <input
                  type="number"
                  name="total_capacity"
                  value={formData.total_capacity}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Occupancy
                </label>
                <input
                  type="number"
                  name="current_capacity"
                  value={formData.current_capacity}
                  onChange={handleInputChange}
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
                  placeholder="Describe the facility..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amenities (comma-separated, optional)
                </label>
                <input
                  type="text"
                  name="amenities"
                  value={formData.amenities}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 24/7 Staff, Home-Cooked Meals"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Languages Spoken (comma-separated, optional)
                </label>
                <input
                  type="text"
                  name="languages_spoken"
                  value={formData.languages_spoken}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., English, Spanish"
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

          {/* Photo Management */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Photos</h2>
            <AdminPhotoUploadSection
              providerId={providerId}
              photos={formData.photo_urls}
              primaryPhoto={formData.primary_photo_url || null}
              onPhotosUpdate={handlePhotosUpdate}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Link
              href="/admin/providers"
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