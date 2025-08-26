'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ServiceType, WaiverType, SERVICE_TYPE_LABELS, WAIVER_TYPE_LABELS } from '@/lib/types/careconnect'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1) // Multi-step form
  
  const supabase = createClient()

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Account Info
    email: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Business Info
    business_name: '',
    license_number: '',
    contact_person: '',
    contact_phone: '',
    
    // Step 3: Location
    address: '',
    city: '',
    zip_code: '',
    
    // Step 4: Services
    service_types: [] as ServiceType[],
    accepted_waivers: [] as WaiverType[],
    total_capacity: '',
    current_capacity: '0',
    
    // Step 5: Additional Info
    description: '',
    amenities: '',
    languages_spoken: '',
    years_in_business: '',
    primary_photo_url: '',
    
    // Agreement
    agree_to_terms: false,
    agree_to_commission: false
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
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

  const validateStep = () => {
    switch(step) {
      case 1:
        if (!formData.email || !formData.password || !formData.confirmPassword) {
          setError('Please fill in all fields')
          return false
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          return false
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters')
          return false
        }
        break
      case 2:
        if (!formData.business_name || !formData.license_number || !formData.contact_person || !formData.contact_phone) {
          setError('Please fill in all business information')
          return false
        }
        break
      case 3:
        if (!formData.address || !formData.city || !formData.zip_code) {
          setError('Please fill in all location information')
          return false
        }
        break
      case 4:
        if (formData.service_types.length === 0) {
          setError('Please select at least one service type')
          return false
        }
        if (formData.accepted_waivers.length === 0) {
          setError('Please select at least one waiver type')
          return false
        }
        if (!formData.total_capacity) {
          setError('Please enter total capacity')
          return false
        }
        break
      case 5:
        if (!formData.agree_to_terms || !formData.agree_to_commission) {
          setError('Please agree to all terms to continue')
          return false
        }
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
    
    setLoading(true)
    setError(null)

    try {
      // 1. Create auth user
      console.log('Creating auth user with email:', formData.email)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        console.error('Auth error details:', authError)
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('No user returned from signup')
      }

      console.log('User created successfully:', authData.user.id)

      // 2. Create provider record
      console.log('Creating provider record...')
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .insert({
          user_id: authData.user.id,
          business_name: formData.business_name,
          license_number: formData.license_number,
          contact_person: formData.contact_person,
          contact_email: formData.email,
          contact_phone: formData.contact_phone,
          address: formData.address,
          city: formData.city,
          state: 'MN',
          zip_code: formData.zip_code,
          service_types: formData.service_types,
          accepted_waivers: formData.accepted_waivers,
          total_capacity: parseInt(formData.total_capacity),
          current_capacity: parseInt(formData.current_capacity),
          description: formData.description || null,
          amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()) : [],
          languages_spoken: formData.languages_spoken ? formData.languages_spoken.split(',').map(l => l.trim()) : [],
          years_in_business: formData.years_in_business ? parseInt(formData.years_in_business) : null,
          primary_photo_url: formData.primary_photo_url || null,
          referral_agreement_signed: formData.agree_to_terms,
          commission_percentage: 10.00,
          status: 'pending',
          verified_245d: false
        })
        .select()

      if (providerError) {
        console.error('Provider error details:', providerError)
        throw new Error(`Provider creation failed: ${providerError.message}`)
      }

      console.log('Provider created:', providerData)

      // 3. Update user profile if profiles table exists
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_provider: true,
          full_name: formData.contact_person
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.log('Profile update skipped (table may not exist):', profileError)
        // Don't throw - profile table might not exist yet
      }

      // Success!
      alert('Registration successful! Please check your email to verify your account. An admin will review your application within 24-48 hours.')
      router.push('/login')
      
    } catch (error) {
      console.error('Full registration error:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else if (typeof error === 'string') {
        setError(error)
      } else {
        setError('Registration failed. Please check the console for details.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Registration</h1>
          <p className="text-gray-600">Join CareConnect network of quality 245D care providers</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-1">
                <div className="relative">
                  <div className={`h-2 ${i < step ? 'bg-blue-600' : i === step ? 'bg-blue-400' : 'bg-gray-300'} ${i < 5 ? 'mr-1' : ''}`} />
                  {i < 5 && <div className="absolute right-0 top-0 h-2 w-1 bg-white" />}
                </div>
                <p className="text-xs mt-1 text-center">
                  {i === 1 && 'Account'}
                  {i === 2 && 'Business'}
                  {i === 3 && 'Location'}
                  {i === 4 && 'Services'}
                  {i === 5 && 'Review'}
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

          <form onSubmit={handleSubmit}>
            {/* Step 1: Account Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Create Your Account</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Business Information */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Business Information</h2>
                
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
                    placeholder="Your Care Home Name"
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
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="245D-XXXX-XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleInputChange}
                    required
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
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(XXX) XXX-XXXX"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Facility Location</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
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
                      required
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
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="55401"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Services & Capacity */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Services & Capacity</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Types Offered * (Select all that apply)
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
                        <span>
                          <strong>{service}</strong> - {SERVICE_TYPE_LABELS[service]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accepted Waivers * (Select all that apply)
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
                        <span>
                          <strong>{waiver}</strong> - {WAIVER_TYPE_LABELS[waiver]}
                        </span>
                      </label>
                    ))}
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
                      required
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

            {/* Step 5: Additional Info & Agreement */}
            {step === 5 && (
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
                    placeholder="Tell potential residents about your facility..."
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

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Agreement Terms</h3>
                  
                  <label className="flex items-start mb-3">
                    <input
                      type="checkbox"
                      name="agree_to_terms"
                      checked={formData.agree_to_terms}
                      onChange={handleInputChange}
                      className="mr-3 mt-1"
                    />
                    <span className="text-sm">
                      I agree to CareConnect Terms of Service and authorize CareConnect to market my facility to qualified referral sources. *
                    </span>
                  </label>

                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="agree_to_commission"
                      checked={formData.agree_to_commission}
                      onChange={handleInputChange}
                      className="mr-3 mt-1"
                    />
                    <span className="text-sm">
                      I understand that CareConnect charges a 10% commission on successful placements made through the platform. *
                    </span>
                  </label>
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
                  href="/login"
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-block text-center"
                >
                  Cancel
                </Link>
              )}

              {step < 5 ? (
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
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              )}
            </div>
          </form>

          {/* Already have account */}
          <div className="text-center mt-6 pt-6 border-t">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}