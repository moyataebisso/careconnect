'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ServiceType, WaiverType } from '@/lib/types/careconnect'

// Updated service types for 245D programs with label changes
const SERVICE_TYPES_245D = {
  // Basic Services
  ICS: 'Integrated Community Services',
  FRS: 'Family Residential Services', 
  CRS: 'Community Residential Services',
  DC_DM: 'Adult Day Services', // CHANGED from Day Care/Day Services
  // Comprehensive Services
  ADL_SUPPORT: 'Respite Support', // CHANGED from ADLs Support
  ASSISTED_LIVING: 'Assisted Living (24/7 Care)'
} as const

// Updated waiver types to include Private Pay
const WAIVER_TYPES = {
  CADI: 'CADI - Community Access for Disability Inclusion (18+)',
  DD: 'DD - Developmental Disabilities (All Ages)',
  BI: 'BI - Brain Injury (All Ages)',
  Elderly: 'Elderly Waiver (65+)',
  private_pay: 'Private Pay - Self-funded care'
} as const

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentSuccess = searchParams.get('payment_success') === 'true'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [existingProviderId, setExistingProviderId] = useState<string | null>(null)
  const [resumeChecking, setResumeChecking] = useState(true)
  const [resumeMessage, setResumeMessage] = useState<string | null>(null)

  const supabase = createClient()

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
    service_types: [] as string[],
    accepted_waivers: [] as string[],
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

  // Resume-detection: route the user based on their current provider row state
  useEffect(() => {
    let cancelled = false

    const checkResumeState = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) setResumeChecking(false)
        return
      }

      const { data: provider } = await supabase
        .from('providers')
        .select('id, status, subscription_status, business_email')
        .eq('user_id', user.id)
        .single()

      if (!provider) {
        if (!cancelled) setResumeChecking(false)
        return
      }

      if (provider.status === 'active') {
        router.push('/dashboard')
        return
      }

      if (provider.status === 'incomplete' && provider.subscription_status === 'active') {
        if (cancelled) return
        setExistingProviderId(provider.id)
        setFormData(prev => ({ ...prev, email: user.email || prev.email }))
        setStep(2)
        setResumeChecking(false)
        return
      }

      if (provider.status === 'incomplete' && provider.subscription_status === 'pending' && paymentSuccess) {
        if (cancelled) return
        setResumeMessage('Confirming your payment...')
        let attempts = 0
        const poll = setInterval(async () => {
          attempts++
          const { data: refreshed } = await supabase
            .from('providers')
            .select('subscription_status')
            .eq('id', provider.id)
            .single()

          if (cancelled) {
            clearInterval(poll)
            return
          }

          if (refreshed?.subscription_status === 'active') {
            clearInterval(poll)
            setExistingProviderId(provider.id)
            setFormData(prev => ({ ...prev, email: user.email || prev.email }))
            setStep(2)
            setResumeMessage(null)
            setResumeChecking(false)
          } else if (attempts >= 5) {
            clearInterval(poll)
            setResumeMessage('Payment is still processing. Please refresh in a moment.')
            setResumeChecking(false)
          }
        }, 2000)
        return
      }

      if (provider.status === 'incomplete' && provider.subscription_status === 'pending') {
        router.push('/subscribe')
        return
      }

      if (!cancelled) setResumeChecking(false)
    }

    checkResumeState()

    return () => {
      cancelled = true
    }
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

  // Helper function to send emails (non-blocking)
  const sendEmail = async (type: string, to: string, data: Record<string, string | number>) => {
    try {
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, to, data })
      })
      console.log(`Email sent: ${type} to ${to}`)
    } catch (emailError) {
      console.log(`Email failed (non-blocking): ${type}`, emailError)
    }
  }

  // Step 1: create auth user + skeleton provider row, then redirect to /subscribe for payment
  const handleStep1AndPay = async () => {
    if (!validateStep()) return

    setLoading(true)
    setError(null)

    try {
      console.log('Step 1: creating auth user with email:', formData.email)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        console.error('Auth error details:', authError)
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

      const skeleton = {
        user_id: authData.user.id,
        contact_email: formData.email,
        business_email: formData.email,
        business_name: 'Pending Setup',
        address: 'TBD',
        city: 'TBD',
        zip_code: '00000',
        state: 'MN',
        status: 'incomplete',
        subscription_status: 'pending',
        trial_ends_at: null,
        verified_245d: false,
      }

      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .insert(skeleton)
        .select()

      if (providerError) {
        console.error('Skeleton provider insert error:', providerError)
        if (providerError.code === '23505' && providerError.message.includes('user_id')) {
          throw new Error('A provider account already exists for this user.')
        }
        throw new Error(`Provider creation failed: ${providerError.message}`)
      }

      console.log('Skeleton provider created:', providerData)

      // Try-update profiles row (same pattern as before)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_provider: true
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.log('Profile update skipped (table may not exist):', profileError)
      }

      if (providerData?.[0]?.id) {
        sessionStorage.setItem('registered_provider', JSON.stringify({
          provider_id: providerData[0].id,
          email: formData.email,
          business_name: 'Pending Setup',
        }))
      }

      console.log('Skeleton created. Redirecting to /subscribe for payment...')
      router.push('/subscribe')
    } catch (error) {
      console.error('Step 1 error:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else if (typeof error === 'string') {
        setError(error)
      } else {
        setError('Registration failed. Please check the console for details.')
      }
      setLoading(false)
    }
    // Don't unset loading on success — we're redirecting
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep()) return

    setLoading(true)
    setError(null)

    try {
      // Resume flow: UPDATE the existing skeleton row created in step 1
      if (existingProviderId) {
        console.log('Final submit: updating provider row', existingProviderId)

        const updateData = {
          business_name: formData.business_name,
          business_email: formData.email,
          license_number: formData.license_number,
          contact_person: formData.contact_person,
          contact_email: formData.email,
          contact_phone: formData.contact_phone,
          address: formData.address,
          city: formData.city,
          state: 'MN',
          zip_code: formData.zip_code,
          service_types: formData.service_types.length > 0 ? formData.service_types : [],
          accepted_waivers: formData.accepted_waivers.length > 0 ? formData.accepted_waivers : [],
          total_capacity: parseInt(formData.total_capacity),
          current_capacity: parseInt(formData.current_capacity),
          description: formData.description || null,
          amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()) : [],
          languages_spoken: formData.languages_spoken ? formData.languages_spoken.split(',').map(l => l.trim()) : [],
          years_in_business: formData.years_in_business ? parseInt(formData.years_in_business) : null,
          primary_photo_url: formData.primary_photo_url || null,
          referral_agreement_signed: formData.agree_to_terms,
          status: 'active',
          verified_245d: true,
        }

        const { data: updateResult, error: updateError } = await supabase
          .from('providers')
          .update(updateData)
          .eq('id', existingProviderId)
          .select()

        if (updateError) {
          console.error('Provider update error:', updateError)
          throw new Error(`Update failed: ${updateError.message}`)
        }

        console.log('Provider activated:', updateResult)

        // Keep profiles row's name in sync
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              is_provider: true,
              full_name: formData.contact_person
            })
            .eq('id', user.id)
          if (profileError) {
            console.log('Profile update skipped:', profileError)
          }
        }

        // Welcome email to provider (non-blocking)
        sendEmail('provider_welcome', formData.email, {
          providerName: formData.contact_person,
          businessName: formData.business_name
        })

        // Admin notification (non-blocking)
        const adminEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'careconnectmkting@gmail.com'
        sendEmail('admin_new_provider', adminEmail, {
          providerName: formData.contact_person,
          businessName: formData.business_name,
          email: formData.email,
          phone: formData.contact_phone,
          licenseNumber: formData.license_number
        })

        router.push('/dashboard?registration_complete=true')
        return
      }

      // Fallback: original INSERT path (shouldn't be reached in the new flow,
      // but kept as a safety net in case someone reaches step 5 without an existingProviderId).
      console.log('Fallback: creating auth user with email:', formData.email)
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

      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .insert({
          user_id: authData.user.id,
          business_name: formData.business_name,
          business_email: formData.email,
          license_number: formData.license_number,
          contact_person: formData.contact_person,
          contact_email: formData.email,
          contact_phone: formData.contact_phone,
          address: formData.address,
          city: formData.city,
          state: 'MN',
          zip_code: formData.zip_code,
          service_types: formData.service_types.length > 0 ? formData.service_types : [],
          accepted_waivers: formData.accepted_waivers.length > 0 ? formData.accepted_waivers : [],
          total_capacity: parseInt(formData.total_capacity),
          current_capacity: parseInt(formData.current_capacity),
          description: formData.description || null,
          amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()) : [],
          languages_spoken: formData.languages_spoken ? formData.languages_spoken.split(',').map(l => l.trim()) : [],
          years_in_business: formData.years_in_business ? parseInt(formData.years_in_business) : null,
          primary_photo_url: formData.primary_photo_url || null,
          referral_agreement_signed: formData.agree_to_terms,
          status: 'pending',
          verified_245d: false,
          subscription_status: 'pending',
          trial_ends_at: null
        })
        .select()

      if (providerError) {
        console.error('Provider error details:', providerError)
        throw new Error(`Provider creation failed: ${providerError.message}`)
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_provider: true,
          full_name: formData.contact_person
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.log('Profile update skipped (table may not exist):', profileError)
      }

      sendEmail('provider_welcome', formData.email, {
        providerName: formData.contact_person,
        businessName: formData.business_name
      })

      const adminEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'careconnectmkting@gmail.com'
      sendEmail('admin_new_provider', adminEmail, {
        providerName: formData.contact_person,
        businessName: formData.business_name,
        email: formData.email,
        phone: formData.contact_phone,
        licenseNumber: formData.license_number
      })

      if (providerData?.[0]?.id) {
        sessionStorage.setItem('registered_provider', JSON.stringify({
          provider_id: providerData[0].id,
          email: formData.email,
          business_name: formData.business_name,
        }))
      }

      router.push('/subscribe')
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

  if (resumeChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          {resumeMessage && <p className="text-gray-600">{resumeMessage}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">245D Provider Registration</h1>
          <p className="text-gray-600">Join CareConnect network of licensed 245D providers</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4, 5].map((i) => {
              const stepDone = i < step || (i === 1 && existingProviderId !== null)
              const stepActive = i === step
              return (
                <div key={i} className="flex-1">
                  <div className="relative">
                    <div className={`h-2 ${stepDone ? 'bg-blue-600' : stepActive ? 'bg-blue-400' : 'bg-gray-300'} ${i < 5 ? 'mr-1' : ''}`} />
                    {i < 5 && <div className="absolute right-0 top-0 h-2 w-1 bg-white" />}
                  </div>
                  <p className="text-xs mt-1 text-center flex items-center justify-center gap-1">
                    {i === 1 && existingProviderId && (
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {i === 1 && 'Account'}
                    {i === 2 && 'Business'}
                    {i === 3 && 'Location'}
                    {i === 4 && 'Services'}
                    {i === 5 && 'Review'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleFinalSubmit}>
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
                    required
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
                    required
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

            {/* Step 4: Services & Payment Types - UPDATED */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">245D Services & Payment Types</h2>
                
                {/* 245D Service Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    245D Service Types (Optional - can be added later)
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
                        <span><strong>ICS</strong> - Integrated Community Services</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.service_types.includes('FRS')}
                          onChange={() => handleServiceTypeChange('FRS')}
                          className="mr-3"
                        />
                        <span><strong>FRS</strong> - Family Residential Services</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.service_types.includes('CRS')}
                          onChange={() => handleServiceTypeChange('CRS')}
                          className="mr-3"
                        />
                        <span><strong>CRS</strong> - Community Residential Services</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.service_types.includes('DC_DM')}
                          onChange={() => handleServiceTypeChange('DC_DM')}
                          className="mr-3"
                        />
                        <span><strong>DC/DM</strong> - Adult Day Services</span>
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

                {/* Accepted Payment Types - UPDATED */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Accepted Payment Types (Optional - can be added later)
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
                      <span>
                        <strong>CADI</strong> - Community Access for Disability Inclusion (Ages 18+)
                      </span>
                    </label>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.accepted_waivers.includes('DD')}
                        onChange={() => handleWaiverChange('DD')}
                        className="mr-3 mt-1"
                      />
                      <span>
                        <strong>DD</strong> - Developmental Disabilities (All Ages)
                      </span>
                    </label>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.accepted_waivers.includes('BI')}
                        onChange={() => handleWaiverChange('BI')}
                        className="mr-3 mt-1"
                      />
                      <span>
                        <strong>BI</strong> - Brain Injury (All Ages)
                      </span>
                    </label>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.accepted_waivers.includes('Elderly')}
                        onChange={() => handleWaiverChange('Elderly')}
                        className="mr-3 mt-1"
                      />
                      <span>
                        <strong>Elderly</strong> - Elderly Waiver (Ages 65+)
                      </span>
                    </label>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.accepted_waivers.includes('private_pay')}
                        onChange={() => handleWaiverChange('private_pay')}
                        className="mr-3 mt-1"
                      />
                      <span>
                        <strong>Private Pay</strong> - Self-funded care
                      </span>
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
                      I agree to CareConnect Terms of Service and authorize CareConnect to market my 245D facility to qualified referral sources including case managers, social workers, and discharge planners. *
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 && !(existingProviderId && step === 2) ? (
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

              {step === 1 && !existingProviderId ? (
                <button
                  type="button"
                  onClick={handleStep1AndPay}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Continue to Payment'}
                </button>
              ) : step < 5 ? (
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
                  {loading ? 'Submitting...' : 'Complete Registration'}
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