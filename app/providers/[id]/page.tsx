'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Provider, SERVICE_TYPE_LABELS, WAIVER_TYPE_SHORT } from '@/lib/types/careconnect'
import PhotoUploadSection from '@/app/components/PhotoUploadSection'
import { User } from '@supabase/supabase-js'

export default function ProviderDetailPage() {
  const params = useParams()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [loading, setLoading] = useState(true)
  const [showContactForm, setShowContactForm] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  
  // Contact form state
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    waiver_type: '',
    service_needed: '',
    preferred_city: '',
    move_in_date: '',
    urgency: '',
    special_requirements: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchProviderAndCheckOwnership()
  }, [params.id])

  const fetchProviderAndCheckOwnership = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Fetch provider
      const { data: providerData, error } = await supabase
        .from('providers')
        .select('*')
        .eq('id', params.id)
        .single()

      if (providerData) {
        setProvider(providerData)
        
        // Check ownership: user must be logged in AND own this provider
        if (user && providerData.user_id === user.id) {
          console.log('User owns this provider')
          setIsOwner(true)
        } else {
          console.log('User does not own this provider')
          setIsOwner(false)
        }
      }
    } catch (error) {
      console.error('Error fetching provider:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProvider = async () => {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', params.id)
      .single()

    if (data) {
      setProvider(data)
      
      // Re-check ownership when provider data is refreshed
      if (user && data.user_id === user.id) {
        setIsOwner(true)
      } else {
        setIsOwner(false)
      }
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data, error } = await supabase
      .from('referral_requests')
      .insert({
        provider_id: provider?.id,
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone,
        waiver_type: formData.waiver_type,
        service_types_needed: formData.service_needed ? [formData.service_needed] : null,
        preferred_city: formData.preferred_city || provider?.city,
        move_in_date: formData.move_in_date || null,
        urgency: formData.urgency || 'flexible',
        special_requirements: formData.special_requirements || null,
        status: 'new'
      })
      .select()

    if (error) {
      console.error('Detailed error:', error)
      alert(`Error: ${error.message}. Check console for details.`)
    } else {
      console.log('Success! Submitted:', data)
      alert('Thank you for your inquiry! CareConnect will contact you within 24 hours to assist with placement.')
      setShowContactForm(false)
      setFormData({
        client_name: '',
        client_email: '',
        client_phone: '',
        waiver_type: '',
        service_needed: '',
        preferred_city: '',
        move_in_date: '',
        urgency: '',
        special_requirements: ''
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Helper function to categorize services
  const categorizeServices = (services: string[]) => {
    const basicServices = ['ICS', 'FRS', 'CRS', 'DC_DM']
    const comprehensiveServices = ['ADL_SUPPORT', 'ASSISTED_LIVING']
    
    return {
      basic: services.filter(s => basicServices.includes(s)),
      comprehensive: services.filter(s => comprehensiveServices.includes(s))
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
          <h1 className="text-2xl font-bold mb-4">Provider Not Found</h1>
          <Link href="/providers" className="text-blue-600 hover:underline">
            Back to Providers
          </Link>
        </div>
      </div>
    )
  }

  const serviceCategories = categorizeServices(provider.service_types)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/providers" className="text-gray-500 hover:text-gray-700">Providers</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900">{provider.business_name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            
            {/* Photo Gallery with Upload - Only editable by owner */}
            <PhotoUploadSection
              providerId={provider.id}
              photos={provider.photo_urls || []}
              primaryPhoto={provider.primary_photo_url}
              onPhotosUpdate={fetchProvider}
              isOwner={isOwner}
            />
            
            {/* Show edit link only for owner */}
            {isOwner && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  You own this provider profile. 
                  <Link href="/dashboard/profile" className="ml-2 text-yellow-900 font-semibold underline">
                    Edit Profile Details →
                  </Link>
                </p>
              </div>
            )}

            {/* Provider Details */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-3xl font-bold">{provider.business_name}</h1>
                {provider.verified_245d && (
                  <div className="bg-green-500 text-white px-3 py-1 rounded">
                    ✓ Verified 245D
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 mb-6">
                <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {provider.address}, {provider.city}, MN {provider.zip_code}
              </p>

              {provider.description && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">About This Facility</h2>
                  <p className="text-gray-700 leading-relaxed">{provider.description}</p>
                </div>
              )}

              {/* Contact Information - Protected unless owner */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
                {isOwner ? (
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Contact:</span> {provider.contact_person || 'Not specified'}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Phone:</span> {provider.contact_phone || 'Not specified'}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Email:</span> {provider.contact_email || 'Not specified'}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-sm">
                      Contact information is protected. Book a service to communicate securely with this provider.
                    </p>
                  </div>
                )}
              </div>

              {/* 245D Services Offered */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">245D Services Offered</h2>
                
                {/* Basic Services */}
                {serviceCategories.basic.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-blue-600 mb-2">Basic Services</h3>
                    <div className="flex flex-wrap gap-2">
                      {serviceCategories.basic.map(service => (
                        <div key={service} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                          <span className="font-medium">{service}</span>
                          <span className="text-sm ml-2">- {SERVICE_TYPE_LABELS[service as keyof typeof SERVICE_TYPE_LABELS]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comprehensive Services */}
                {serviceCategories.comprehensive.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-green-600 mb-2">Comprehensive Services</h3>
                    <div className="flex flex-wrap gap-2">
                      {serviceCategories.comprehensive.map(service => (
                        <div key={service} className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                          <span className="font-medium">
                            {service === 'ADL_SUPPORT' ? 'ADLs Support' : 'Assisted Living'}
                          </span>
                          <span className="text-sm ml-2">- {SERVICE_TYPE_LABELS[service as keyof typeof SERVICE_TYPE_LABELS]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Accepted Waivers */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Accepted Waiver Programs</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.accepted_waivers.map(waiver => (
                    <div key={waiver} className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg">
                      {WAIVER_TYPE_SHORT[waiver as keyof typeof WAIVER_TYPE_SHORT]}
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              {provider.amenities && provider.amenities.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Amenities & Features</h2>
                  <div className="grid md:grid-cols-2 gap-2">
                    {provider.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="grid md:grid-cols-2 gap-6">
                {provider.years_in_business && (
                  <div>
                    <h3 className="font-semibold mb-1">Years in Business</h3>
                    <p className="text-gray-700">{provider.years_in_business} years</p>
                  </div>
                )}
                {provider.languages_spoken && provider.languages_spoken.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-1">Languages Spoken</h3>
                    <p className="text-gray-700">{provider.languages_spoken.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            
            {/* Capacity Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Availability</h3>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Capacity</span>
                  <span className="font-medium">
                    {provider.total_capacity - provider.current_capacity} of {provider.total_capacity} available
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      provider.is_at_capacity ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${((provider.total_capacity - provider.current_capacity) / provider.total_capacity) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>

              {provider.is_at_capacity ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 text-sm">
                    This facility is currently at full capacity. You can still submit an inquiry to be added to their waitlist.
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 text-sm">
                    Accepting new residents
                  </p>
                </div>
              )}

              <Link
                href={`/booking?provider=${provider.id}`}
                className={`block text-center w-full py-3 rounded-lg font-semibold transition-colors ${
                  provider.is_at_capacity
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {provider.is_at_capacity ? 'Join Waitlist' : 'Connect With Provider'}
              </Link>

              <p className="text-xs text-gray-500 mt-3 text-center">
                All communications are secured through CareConnect
              </p>
            </div>

            {/* Quick Info Card */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold mb-3 text-blue-900">Why Choose CareConnect?</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Verified 245D licensed providers</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>All waiver programs accepted</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Protected contact information</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>24-hour response time</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}