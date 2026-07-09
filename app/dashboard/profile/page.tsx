'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { geocodeAddress } from '@/lib/geocoding'

// Same labels as /auth/register
const SERVICE_TYPES_245D = {
  ICS: 'Integrated Community Services',
  FRS: 'Family Residential Services',
  CRS: 'Community Residential Services',
  DC_DM: 'Adult Day Services',
  ADL_SUPPORT: 'Respite Support',
  ASSISTED_LIVING: 'Assisted Living (24/7 Care)'
} as const

const WAIVER_TYPES = {
  CADI: 'CADI - Community Access for Disability Inclusion (18+)',
  DD: 'DD - Developmental Disabilities (All Ages)',
  BI: 'BI - Brain Injury (All Ages)',
  Elderly: 'Elderly Waiver (65+)',
  private_pay: 'Private Pay - Self-funded care'
} as const

interface ProviderData {
  id: string
  business_name?: string | null
  business_email?: string | null
  license_number?: string | null
  contact_name?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  latitude?: number | null
  longitude?: number | null
  service_types?: string[] | null
  accepted_waivers?: string[] | null
  total_capacity?: number | null
  current_capacity?: number | null
  description?: string | null
  amenities?: string[] | null
  languages_spoken?: string[] | null
  years_in_business?: number | null
  primary_photo_url?: string | null
  status?: string | null
}

export default function EditProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get('welcome') === 'true'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [provider, setProvider] = useState<ProviderData | null>(null)

  const [formData, setFormData] = useState({
    // Business (step 1)
    business_name: '',
    license_number: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    // Location (step 2)
    address: '',
    city: '',
    zip_code: '',
    latitude: null as number | null,
    longitude: null as number | null,
    // Services (step 3)
    service_types: [] as string[],
    accepted_waivers: [] as string[],
    total_capacity: '',
    current_capacity: '',
    // Review (step 4)
    description: '',
    amenities: '',
    languages_spoken: '',
    years_in_business: '',
    primary_photo_url: ''
  })

  const supabase = createClient()

  useEffect(() => {
    const loadProvider = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: providerData, error: loadError } = await supabase
          .from('providers')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (loadError) {
          console.error('Error loading provider:', loadError)
          if (loadError.code === 'PGRST116') {
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
          business_name: providerData.business_name && providerData.business_name !== 'Pending Setup' ? providerData.business_name : '',
          license_number: providerData.license_number || '',
          contact_name: providerData.contact_name || providerData.contact_person || '',
          contact_phone: providerData.contact_phone || '',
          contact_email: providerData.contact_email || providerData.business_email || user.email || '',
          address: providerData.address && providerData.address !== 'TBD' ? providerData.address : '',
          city: providerData.city && providerData.city !== 'TBD' ? providerData.city : '',
          zip_code: providerData.zip_code && providerData.zip_code !== '00000' ? providerData.zip_code : '',
          latitude: providerData.latitude ?? null,
          longitude: providerData.longitude ?? null,
          service_types: providerData.service_types || [],
          accepted_waivers: providerData.accepted_waivers || [],
          total_capacity: providerData.total_capacity != null ? String(providerData.total_capacity) : '',
          current_capacity: providerData.current_capacity != null ? String(providerData.current_capacity) : '',
          description: providerData.description || '',
          amenities: Array.isArray(providerData.amenities) ? providerData.amenities.join(', ') : '',
          languages_spoken: Array.isArray(providerData.languages_spoken) ? providerData.languages_spoken.join(', ') : '',
          years_in_business: providerData.years_in_business != null ? String(providerData.years_in_business) : '',
          primary_photo_url: providerData.primary_photo_url || ''
        })

        if (providerData.status === 'incomplete' && isWelcome && typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      } catch (err) {
        console.error('Error loading provider:', err)
        alert('Error loading provider data')
      } finally {
        setLoading(false)
      }
    }

    loadProvider()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleServiceTypeChange = (service: string) => {
    setFormData(prev => ({
      ...prev,
      service_types: prev.service_types.includes(service)
        ? prev.service_types.filter(s => s !== service)
        : [...prev.service_types, service]
    }))
  }

  const handleWaiverChange = (waiver: string) => {
    setFormData(prev => ({
      ...prev,
      accepted_waivers: prev.accepted_waivers.includes(waiver)
        ? prev.accepted_waivers.filter(w => w !== waiver)
        : [...prev.accepted_waivers, waiver]
    }))
  }

  const geocodeIfAddressComplete = async () => {
    if (formData.address && formData.city && formData.zip_code) {
      setGeocoding(true)
      try {
        const result = await geocodeAddress(formData.address, formData.city, 'MN', formData.zip_code)
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
      } catch (err) {
        console.error('Geocoding error:', err)
      } finally {
        setGeocoding(false)
      }
    }
  }

  const handleAddressBlur = () => {
    geocodeIfAddressComplete()
  }

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.business_name || !formData.license_number || !formData.contact_name || !formData.contact_phone) {
          setError('Please fill in all business information')
          return false
        }
        if (!formData.contact_email || !formData.contact_email.includes('@')) {
          setError('Please enter a valid email')
          return false
        }
        break
      case 2:
        if (!formData.address || !formData.city || !formData.zip_code) {
          setError('Please fill in all location fields')
          return false
        }
        break
      case 3:
        if (!formData.total_capacity || parseInt(formData.total_capacity) <= 0) {
          setError('Please enter total capacity')
          return false
        }
        break
      case 4:
        break
    }
    setError(null)
    return true
  }

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    setError(null)
    setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep()) return

    if (!provider) {
      setError('No provider data found')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // One more geocode attempt if we never got coordinates
      let latitude = formData.latitude
      let longitude = formData.longitude
      if (!latitude || !longitude) {
        const result = await geocodeAddress(formData.address, formData.city, 'MN', formData.zip_code)
        if (result) {
          latitude = result.latitude
          longitude = result.longitude
        }
      }

      const wasIncomplete = provider.status === 'incomplete'

      const updateData: Record<string, unknown> = {
        business_name: formData.business_name,
        business_email: formData.contact_email,
        license_number: formData.license_number,
        contact_name: formData.contact_name,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        address: formData.address,
        city: formData.city,
        state: 'MN',
        zip_code: formData.zip_code,
        latitude,
        longitude,
        service_types: formData.service_types,
        accepted_waivers: formData.accepted_waivers,
        total_capacity: parseInt(formData.total_capacity) || 0,
        current_capacity: parseInt(formData.current_capacity) || 0,
        description: formData.description || null,
        amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()).filter(Boolean) : [],
        languages_spoken: formData.languages_spoken ? formData.languages_spoken.split(',').map(l => l.trim()).filter(Boolean) : [],
        years_in_business: formData.years_in_business ? parseInt(formData.years_in_business) : null,
        primary_photo_url: formData.primary_photo_url || null,
        last_updated: new Date().toISOString()
      }

      if (wasIncomplete) {
        updateData.status = 'active'
        updateData.verified_245d = true
      }

      console.log('Updating provider:', { id: provider.id, wasIncomplete, latitude, longitude })

      const { data, error: updateError } = await supabase
        .from('providers')
        .update(updateData)
        .eq('id', provider.id)
        .select()

      if (updateError) {
        console.error('Update error:', updateError)
        throw updateError
      }

      console.log('Update successful:', data)

      if (isWelcome) {
        setSuccessMessage('🎉 Profile saved! Redirecting to your dashboard...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      const message = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(`Failed to update profile: ${message}`)
      alert(`Failed to update profile: ${message}`)
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {provider.status === 'incomplete' ? 'Complete Your Provider Profile' : 'Edit Provider Profile'}
          </h1>
          <p className="text-gray-600">Update your facility information and services</p>
        </div>

        {/* Welcome banner */}
        {isWelcome && (
          <div className="mb-6 rounded-lg p-4 bg-green-50 border-2 border-green-300 text-green-800">
            <p className="font-semibold">🎉 Welcome! Your payment is confirmed.</p>
            <p className="text-sm mt-1">Let&apos;s finish setting up your profile so you can start receiving referrals.</p>
          </div>
        )}

        {provider.status === 'pending' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            Your profile is pending approval. Updates will be reviewed by an admin.
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}

        {/* Progress Bar - 4 steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1">
                <div className="relative">
                  <div className={`h-2 ${i < step ? 'bg-blue-600' : i === step ? 'bg-blue-400' : 'bg-gray-300'} ${i < 4 ? 'mr-1' : ''}`} />
                  {i < 4 && <div className="absolute right-0 top-0 h-2 w-1 bg-white" />}
                </div>
                <p className="text-xs mt-1 text-center">
                  {i === 1 && 'Business'}
                  {i === 2 && 'Location'}
                  {i === 3 && 'Services'}
                  {i === 4 && 'Review'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && step < 4) e.preventDefault() }}>
            {/* Step 1: Business Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">245D Business Information</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your Licensed Facility Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    245D License Number *
                  </label>
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="245D-XXXX-XXX"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your Minnesota 245D license number for verification</p>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(XXX) XXX-XXXX"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="business@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used for both your business and contact email</p>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">
                  Facility Location
                  {geocoding && <span className="ml-2 text-sm text-blue-600">(Getting coordinates...)</span>}
                  {!geocoding && formData.latitude && formData.longitude && (
                    <span className="ml-2 text-sm text-green-600">✓ Location mapped</span>
                  )}
                </h2>

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Minneapolis"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="55401"
                    />
                  </div>
                </div>

                {!formData.latitude && !formData.longitude && formData.address && (
                  <p className="text-sm text-amber-600">
                    ⚠️ Your location won&apos;t appear on the map until we can verify the address. Make sure it&apos;s complete and correct.
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Services & Payment Types */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">245D Services & Payment Types</h2>

                {/* 245D Service Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    245D Service Types (Optional)
                  </label>

                  {/* Basic Services */}
                  <div className="mb-4">
                    <h4 className="font-medium text-blue-600 mb-2">Basic Services</h4>
                    <div className="space-y-2 ml-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.service_types.includes('ICS')}
                          onChange={() => handleServiceTypeChange('ICS')}
                          className="mr-3"
                        />
                        <span><strong>ICS</strong> - {SERVICE_TYPES_245D.ICS}</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.service_types.includes('FRS')}
                          onChange={() => handleServiceTypeChange('FRS')}
                          className="mr-3"
                        />
                        <span><strong>FRS</strong> - {SERVICE_TYPES_245D.FRS}</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.service_types.includes('CRS')}
                          onChange={() => handleServiceTypeChange('CRS')}
                          className="mr-3"
                        />
                        <span><strong>CRS</strong> - {SERVICE_TYPES_245D.CRS}</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.service_types.includes('DC_DM')}
                          onChange={() => handleServiceTypeChange('DC_DM')}
                          className="mr-3"
                        />
                        <span><strong>DC/DM</strong> - {SERVICE_TYPES_245D.DC_DM}</span>
                      </label>
                    </div>
                  </div>

                  {/* Comprehensive Services */}
                  <div>
                    <h4 className="font-medium text-green-600 mb-2">Comprehensive Services</h4>
                    <div className="space-y-2 ml-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.service_types.includes('ADL_SUPPORT')}
                          onChange={() => handleServiceTypeChange('ADL_SUPPORT')}
                          className="mr-3"
                        />
                        <span><strong>Respite Support</strong> - Temporary relief care services</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.service_types.includes('ASSISTED_LIVING')}
                          onChange={() => handleServiceTypeChange('ASSISTED_LIVING')}
                          className="mr-3"
                        />
                        <span><strong>Assisted Living</strong> - 24/7 Care with full support</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Accepted Payment Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Accepted Payment Types (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Select all payment methods you accept</p>
                  <div className="space-y-2">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.accepted_waivers.includes('CADI')}
                        onChange={() => handleWaiverChange('CADI')}
                        className="mr-3 mt-1"
                      />
                      <span><strong>CADI</strong> - {WAIVER_TYPES.CADI.replace('CADI - ', '')}</span>
                    </label>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.accepted_waivers.includes('DD')}
                        onChange={() => handleWaiverChange('DD')}
                        className="mr-3 mt-1"
                      />
                      <span><strong>DD</strong> - {WAIVER_TYPES.DD.replace('DD - ', '')}</span>
                    </label>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.accepted_waivers.includes('BI')}
                        onChange={() => handleWaiverChange('BI')}
                        className="mr-3 mt-1"
                      />
                      <span><strong>BI</strong> - {WAIVER_TYPES.BI.replace('BI - ', '')}</span>
                    </label>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.accepted_waivers.includes('Elderly')}
                        onChange={() => handleWaiverChange('Elderly')}
                        className="mr-3 mt-1"
                      />
                      <span><strong>Elderly</strong> - {WAIVER_TYPES.Elderly}</span>
                    </label>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.accepted_waivers.includes('private_pay')}
                        onChange={() => handleWaiverChange('private_pay')}
                        className="mr-3 mt-1"
                      />
                      <span><strong>Private Pay</strong> - Self-funded care</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Capacity *
                    </label>
                    <input
                      type="number"
                      name="total_capacity"
                      value={formData.total_capacity}
                      onChange={handleInputChange}
                        min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 4"
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
                      placeholder="e.g., 2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review / Additional Information */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Additional Information</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your 245D facility and services..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amenities (Optional, comma-separated)
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
                    Languages Spoken (Optional, comma-separated)
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
                    Years in Business (Optional)
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Photo URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="primary_photo_url"
                    value={formData.primary_photo_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              ) : (
                <Link
                  href="/dashboard"
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-block text-center"
                >
                  Cancel
                </Link>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
