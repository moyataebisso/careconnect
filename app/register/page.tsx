'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ServiceType, WaiverType, SERVICE_TYPE_LABELS, WAIVER_TYPE_LABELS } from '@/lib/types/careconnect'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  
  // Debug code - remove after testing
  useEffect(() => {
    console.log('Environment Check:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
    
    const testClient = createClient()
    console.log('Supabase client:', testClient)
  }, [])
  
  const supabase = createClient()

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Account Info
    email: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Business Info
    business_name: '',
    business_email: '',
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
    agree_to_terms: false
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
        // Validate business email if provided
        if (formData.business_email && !formData.business_email.includes('@')) {
          setError('Please enter a valid business email')
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
        // Services and waivers are now optional
        if (!formData.total_capacity) {
          setError('Please enter total capacity')
          return false
        }
        break
      case 5:
        if (!formData.agree_to_terms) {
          setError('Please agree to the terms to continue')
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
      console.log('Starting registration process...')
      
      // 1. Create auth user with the LOGIN email
      console.log('Creating auth user with email:', formData.email)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        console.error('Auth error details:', authError)
        
        // Check for duplicate user error
        if (authError.message?.includes('already registered') || 
            authError.message?.includes('duplicate') ||
            authError.message?.includes('already exists')) {
          throw new Error('This email is already registered. Please login or use a different email.')
        }
        
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('No user returned from signup')
      }

      console.log('User created successfully:', authData.user.id)

      // 2. Create provider record
      console.log('Creating provider record...')
      
      // Build provider data - matching your database schema exactly
      const providerData = {
        // DO NOT include id field - let Supabase auto-generate it
        user_id: authData.user.id,
        business_name: formData.business_name,
        business_email: formData.business_email || formData.email, // This MUST be unique and NOT NULL
        contact_email: formData.email, // Login email
        contact_phone: formData.contact_phone,
        address: formData.address,
        city: formData.city,
        state: 'MN',
        zip_code: formData.zip_code,
        service_types: formData.service_types.length > 0 ? formData.service_types : [],
        accepted_waivers: formData.accepted_waivers.length > 0 ? formData.accepted_waivers : [],
        total_capacity: parseInt(formData.total_capacity) || 0,
        current_capacity: parseInt(formData.current_capacity) || 0,
        status: 'pending',
        verified_245d: false,
        license_number: formData.license_number,
        contact_name: formData.contact_person, // This matches your DB column
        // Optional fields
        description: formData.description || null,
        amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()) : [],
        languages_spoken: formData.languages_spoken ? formData.languages_spoken.split(',').map(l => l.trim()) : [],
        years_in_business: formData.years_in_business ? parseInt(formData.years_in_business) : null,
        primary_photo_url: formData.primary_photo_url || null,
        // Subscription fields - new providers start without subscription (pending approval)
        subscription_status: 'pending',
        // These fields have defaults in DB, so we don't need to set them:
        // is_featured: false,
        // is_at_capacity: false,
        // is_ghosted: false,
        // accepts_emergency_placement: false,
        // created_at and last_updated are auto-set
      }
      
      console.log('Provider data to insert:', providerData)
      
      // First check if business_email already exists
      const { data: existingProvider, error: checkError } = await supabase
        .from('providers')
        .select('business_email')
        .eq('business_email', providerData.business_email)
        .maybeSingle()
      
      if (existingProvider) {
        // If we found a provider with this email, show error
        console.error('Business email already exists:', providerData.business_email)
        
        // Try to delete the auth user we just created
        // Note: This might not work immediately due to Supabase limitations
        try {
          await supabase.auth.admin.deleteUser(authData.user.id)
        } catch (deleteError) {
          console.error('Could not delete auth user after provider creation failed:', deleteError)
        }
        
        throw new Error('This business email is already registered. Please use a different email.')
      }
      
      // Now insert the provider
      const { data: providerResult, error: providerError } = await supabase
        .from('providers')
        .insert(providerData)
        .select()

      if (providerError) {
        console.error('Provider error full details:', {
          message: providerError.message,
          details: providerError.details,
          hint: providerError.hint,
          code: providerError.code
        })
        console.error('Provider data that failed:', providerData)
        
        // Better error messages for common issues
        if (providerError.code === '23505') { // Unique violation
          if (providerError.message.includes('business_email')) {
            throw new Error('This business email is already registered. Please use a different email.')
          }
          if (providerError.message.includes('user_id')) {
            throw new Error('A provider account already exists for this user.')
          }
          throw new Error('This provider information already exists.')
        }
        
        if (providerError.code === '23503') { // Foreign key violation
          throw new Error('User registration failed. Please try again.')
        }
        
        if (providerError.code === '42501') { // Permission denied
          throw new Error('Permission denied. Please ensure you have the right to create a provider account.')
        }
        
        // If provider creation fails, we should note that auth user was created
        console.error('Note: Auth user was created but provider record failed')
        
        throw new Error(`Provider creation failed: ${providerError.message}`)
      }

      console.log('Provider created successfully:', providerResult)

      // 3. Try to update or create profile if table exists
      try {
        // First try to insert the profile
        const { error: profileInsertError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.contact_person,
            role: 'provider'
          })

        if (profileInsertError) {
          // If insert fails (profile might already exist from trigger), try update
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({
              full_name: formData.contact_person,
              role: 'provider'
            })
            .eq('id', authData.user.id)

          if (profileUpdateError) {
            console.log('Profile update skipped:', profileUpdateError.message)
          } else {
            console.log('Profile updated successfully')
          }
        } else {
          console.log('Profile created successfully')
        }
      } catch (profileErr) {
        console.log('Profile table operation skipped:', profileErr)
        // Don't throw - profile table operations are non-critical
      }

      // Success!
      alert('Registration successful! Please check your email to verify your account. An admin will review your application within 24-48 hours. Once approved, you\'ll receive a 7-day free trial to explore our platform.')
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
          <p className="text-gray-600">Join CareConnect network of licensed 245D providers accepting waiver programs</p>
        </div>

        {/* Subscription Info Banner - NEW */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-blue-800">Subscription Information</h3>
              <div className="mt-1 text-sm text-blue-700">
                <p className="mb-2">
                  <strong>7-Day Free Trial</strong> – After admin approval, you&apos;ll get full platform access for 7 days at no cost.
                </p>
                <p>
                  <strong>$99.99/month</strong> – After your trial, continue listing your facility and connecting with case managers for just $99.99/month. Cancel anytime.
                </p>
              </div>
            </div>
          </div>
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

          {step === 5 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
              Please agree to all terms to continue
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Account Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Create Your Account</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Login Email Address *
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
                  <p className="text-xs text-gray-500 mt-1">This email will be used to log into your account</p>
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
                    Business Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="business_email"
                    value={formData.business_email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="business@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank to use your login email for business communications</p>
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
                    Service Types Offered (Optional - can be added later)
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
                    Accepted Waivers (Optional - can be added later)
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

                {/* Subscription & Pricing Info - NEW */}
                <div className="border-t pt-4 mt-6">
                  <h3 className="font-semibold mb-3 text-lg">Subscription & Pricing</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-green-600 font-bold text-sm">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Admin Review</p>
                          <p className="text-sm text-gray-600">Your application will be reviewed within 24-48 hours</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-bold text-sm">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">7-Day Free Trial</p>
                          <p className="text-sm text-gray-600">Once approved, enjoy full access for 7 days – no credit card required</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-purple-600 font-bold text-sm">3</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Monthly Subscription – $99.99/month</p>
                          <p className="text-sm text-gray-600">Continue listing your facility and receive referrals. Cancel anytime.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-800">
                      <strong>What&apos;s Included:</strong> Facility listing, messaging with case managers & families, booking management, and access to referral network.
                    </p>
                  </div>
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
                      I agree to CareConnect Terms of Service and authorize CareConnect to market my 245D facility to qualified referral sources including case managers, social workers, and discharge planners. I understand that after admin approval, I will receive a 7-day free trial, after which a subscription of $99.99/month is required to maintain my listing. *
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

        {/* Care Seeker Note - NEW */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Looking for care services?{' '}
            <Link href="/register/care-seeker" className="text-blue-600 hover:underline">
              Register as a Care Seeker
            </Link>
            {' '}– it&apos;s free!
          </p>
        </div>
      </div>
    </div>
  )
}