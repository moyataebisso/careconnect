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
  const [existingProviderId, setExistingProviderId] = useState<string | null>(null)
  const [resumeChecking, setResumeChecking] = useState(true)
  const [resumeMessage, setResumeMessage] = useState<string | null>(null)

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

  // Resume-after-payment detection
  useEffect(() => {
    let cancelled = false

    const detectResumeState = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          console.log('No auth user on register page - fresh registration')
          setResumeChecking(false)
          return
        }

        console.log('Auth user found, checking provider row for resume state:', user.id)

        const { data: provider, error: providerLookupError } = await supabase
          .from('providers')
          .select('id, status, subscription_status, business_email, business_name, contact_phone, address, city, zip_code, service_types, accepted_waivers, total_capacity, current_capacity, license_number, contact_name, contact_person, description, amenities, languages_spoken, years_in_business, primary_photo_url')
          .eq('user_id', user.id)
          .maybeSingle()

        if (providerLookupError) {
          console.error('Error looking up provider for resume:', providerLookupError)
          setResumeChecking(false)
          return
        }

        if (!provider) {
          console.log('No provider row for current user - fresh registration')
          setResumeChecking(false)
          return
        }

        if (provider.status === 'active') {
          console.log('Provider already active - redirecting to dashboard')
          router.push('/dashboard')
          return
        }

        if (provider.status === 'incomplete') {
          // Pre-fill any existing form data from the row in case the user
          // refreshes mid-flow.
          if (!cancelled) {
            setFormData(prev => ({
              ...prev,
              email: user.email || prev.email,
              business_name: provider.business_name && provider.business_name !== 'Pending Setup' ? provider.business_name : prev.business_name,
              business_email: provider.business_email || prev.business_email,
              contact_phone: provider.contact_phone || prev.contact_phone,
              address: provider.address && provider.address !== 'TBD' ? provider.address : prev.address,
              city: provider.city && provider.city !== 'TBD' ? provider.city : prev.city,
              zip_code: provider.zip_code && provider.zip_code !== '00000' ? provider.zip_code : prev.zip_code,
              service_types: provider.service_types || prev.service_types,
              accepted_waivers: provider.accepted_waivers || prev.accepted_waivers,
              total_capacity: provider.total_capacity != null ? String(provider.total_capacity) : prev.total_capacity,
              current_capacity: provider.current_capacity != null ? String(provider.current_capacity) : prev.current_capacity,
              license_number: provider.license_number || prev.license_number,
              contact_person: provider.contact_person || provider.contact_name || prev.contact_person,
              description: provider.description || prev.description,
              amenities: Array.isArray(provider.amenities) ? provider.amenities.join(', ') : (provider.amenities || prev.amenities),
              languages_spoken: Array.isArray(provider.languages_spoken) ? provider.languages_spoken.join(', ') : (provider.languages_spoken || prev.languages_spoken),
              years_in_business: provider.years_in_business != null ? String(provider.years_in_business) : prev.years_in_business,
              primary_photo_url: provider.primary_photo_url || prev.primary_photo_url,
            }))
          }

          if (provider.subscription_status === 'active') {
            console.log('Resume state: payment cleared, jumping to step 2')
            if (!cancelled) {
              setExistingProviderId(provider.id)
              setStep(2)
              setResumeChecking(false)
            }
            return
          }

          // subscription_status === 'pending' or anything else not active.
          // If they just came back from Stripe (payment_success=true), the
          // webhook may not have fired yet — poll briefly.
          const urlParams = new URLSearchParams(window.location.search)
          const paymentSuccess = urlParams.get('payment_success') === 'true'

          if (paymentSuccess) {
            console.log('payment_success=true but subscription_status not yet active - polling...')
            let attempts = 0
            const maxAttempts = 5 // 5 * 2s = 10s
            const poll = async () => {
              if (cancelled) return
              attempts += 1
              const { data: refreshed } = await supabase
                .from('providers')
                .select('id, status, subscription_status')
                .eq('user_id', user.id)
                .maybeSingle()

              if (cancelled) return

              if (refreshed?.subscription_status === 'active') {
                console.log('Subscription is now active after poll attempt', attempts)
                setExistingProviderId(refreshed.id)
                setStep(2)
                setResumeMessage(null)
                setResumeChecking(false)
                return
              }

              if (attempts >= maxAttempts) {
                console.log('Polling exhausted without active subscription')
                setResumeMessage('Payment is processing. Please refresh in a moment to continue setting up your profile.')
                setExistingProviderId(provider.id)
                setResumeChecking(false)
                return
              }

              setTimeout(poll, 2000)
            }
            setResumeMessage('Confirming payment...')
            setTimeout(poll, 2000)
            return
          }

          // No payment_success flag - user bailed out of Stripe. Send them back.
          console.log('Provider incomplete and payment not done - redirecting to /subscribe')
          if (provider.id) {
            sessionStorage.setItem('registered_provider', JSON.stringify({
              provider_id: provider.id,
              email: user.email || '',
              business_name: provider.business_name || 'Pending Setup',
            }))
          }
          router.push('/subscribe')
          return
        }

        // Unknown status - just let user proceed at step 1
        setResumeChecking(false)
      } catch (err) {
        console.error('Resume detection error:', err)
        if (!cancelled) setResumeChecking(false)
      }
    }

    detectResumeState()

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
    // Don't let users go back to step 1 once payment has been completed
    if (existingProviderId && step <= 2) return
    setStep(step - 1)
  }

  // Step 1: Create auth user + skeleton provider row, then redirect to /subscribe for payment
  const handleStep1AndPay = async () => {
    if (!validateStep()) return

    setLoading(true)
    setError(null)

    try {
      console.log('Step 1: creating auth user + skeleton provider row...')

      // 1. Create auth user
      console.log('Creating auth user with email:', formData.email)
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

      // 2. Insert MINIMAL skeleton provider row (NOT NULL columns use placeholders)
      const skeletonProviderData = {
        user_id: authData.user.id,
        contact_email: formData.email,
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

      console.log('Inserting skeleton provider row:', skeletonProviderData)

      const { data: providerResult, error: providerError } = await supabase
        .from('providers')
        .insert(skeletonProviderData)
        .select()

      if (providerError) {
        console.error('Provider skeleton insert error:', {
          message: providerError.message,
          details: providerError.details,
          hint: providerError.hint,
          code: providerError.code
        })

        if (providerError.code === '23505') {
          if (providerError.message.includes('user_id')) {
            throw new Error('A provider account already exists for this user.')
          }
          throw new Error('This provider information already exists.')
        }

        if (providerError.code === '23503') {
          throw new Error('User registration failed. Please try again.')
        }

        if (providerError.code === '42501') {
          throw new Error('Permission denied. Please ensure you have the right to create a provider account.')
        }

        throw new Error(`Provider creation failed: ${providerError.message}`)
      }

      console.log('Skeleton provider created:', providerResult)

      // 3. Try to update or create profile if table exists (same pattern as before)
      try {
        const { error: profileInsertError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            role: 'provider'
          })

        if (profileInsertError) {
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({
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
      }

      // 4. Save session info for the subscribe page (covers the
      // pre-email-verification flow that subscribe/page.tsx already supports)
      if (providerResult?.[0]?.id) {
        sessionStorage.setItem('registered_provider', JSON.stringify({
          provider_id: providerResult[0].id,
          email: formData.email,
          business_name: 'Pending Setup',
        }))
      }

      // 5. Redirect to subscribe page
      console.log('Skeleton account created. Redirecting to /subscribe for payment...')
      router.push('/subscribe')

    } catch (error) {
      console.error('Step 1 registration error:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else if (typeof error === 'string') {
        setError(error)
      } else {
        setError('Registration failed. Please check the console for details.')
      }
      setLoading(false)
    }
    // Note: Don't set loading to false on success because we're redirecting
  }

  // Final submit: UPDATE the existing provider row with full form data, set status='active'
  const handleFinalSubmit = async () => {
    if (!validateStep()) return

    if (!existingProviderId) {
      setError('Missing provider record. Please refresh and try again.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Final submit: updating provider row', existingProviderId)

      // Business email uniqueness check, excluding this provider's own row
      const businessEmail = formData.business_email || formData.email
      const { data: existing } = await supabase
        .from('providers')
        .select('id, business_email')
        .eq('business_email', businessEmail)
        .neq('id', existingProviderId)
        .maybeSingle()

      if (existing) {
        console.error('Business email collision:', businessEmail)
        throw new Error('This business email is already registered. Please use a different email.')
      }

      const updateData = {
        business_name: formData.business_name,
        business_email: businessEmail,
        contact_phone: formData.contact_phone,
        address: formData.address,
        city: formData.city,
        zip_code: formData.zip_code,
        state: 'MN',
        service_types: formData.service_types.length > 0 ? formData.service_types : [],
        accepted_waivers: formData.accepted_waivers.length > 0 ? formData.accepted_waivers : [],
        total_capacity: parseInt(formData.total_capacity) || 0,
        current_capacity: parseInt(formData.current_capacity) || 0,
        license_number: formData.license_number,
        contact_name: formData.contact_person,
        contact_person: formData.contact_person,
        description: formData.description || null,
        amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()) : [],
        languages_spoken: formData.languages_spoken ? formData.languages_spoken.split(',').map(l => l.trim()) : [],
        years_in_business: formData.years_in_business ? parseInt(formData.years_in_business) : null,
        primary_photo_url: formData.primary_photo_url || null,
        status: 'active',
        verified_245d: true,
      }

      console.log('Update data:', updateData)

      const { data: updateResult, error: updateError } = await supabase
        .from('providers')
        .update(updateData)
        .eq('id', existingProviderId)
        .select()

      if (updateError) {
        console.error('Provider update error:', updateError)

        if (updateError.code === '23505' && updateError.message.includes('business_email')) {
          throw new Error('This business email is already registered. Please use a different email.')
        }

        throw new Error(`Update failed: ${updateError.message}`)
      }

      console.log('Provider activated:', updateResult)

      // Also keep the profiles row's full_name in sync if it exists
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('profiles')
            .update({
              full_name: formData.contact_person,
              role: 'provider'
            })
            .eq('id', user.id)
        }
      } catch (profileErr) {
        console.log('Profile name update skipped:', profileErr)
      }

      // Welcome email - reuse provider_approved template
      try {
        const emailRes = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'provider_approved',
            to: formData.email,
            data: {
              providerName: formData.contact_person,
              businessName: formData.business_name,
              trialEndDate: '',
            }
          })
        })
        if (!emailRes.ok) {
          const errBody = await emailRes.json().catch(() => ({}))
          console.warn('Welcome email send failed:', errBody)
        } else {
          console.log('Welcome email sent')
        }
      } catch (emailErr) {
        console.warn('Welcome email error:', emailErr)
      }

      router.push('/dashboard?registration_complete=true')
    } catch (error) {
      console.error('Final submit error:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Failed to complete registration. Please try again.')
      }
      setLoading(false)
    }
  }

  if (resumeChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 text-sm">{resumeMessage || 'Loading registration...'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Registration</h1>
          <p className="text-gray-600">Join CareConnect network of licensed 245D providers accepting waiver programs</p>
        </div>

        {/* Subscription Info Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-blue-800">Subscription Required – $99.99/month</h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>
                  After creating your account, you&apos;ll be redirected to complete payment, then return here to finish your profile.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar - 5 Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4, 5].map((i) => {
              const stepComplete = i < step || (i === 1 && existingProviderId !== null)
              const stepActive = i === step
              return (
                <div key={i} className="flex-1">
                  <div className="relative">
                    <div className={`h-2 ${stepComplete ? 'bg-blue-600' : stepActive ? 'bg-blue-400' : 'bg-gray-300'} ${i < 5 ? 'mr-1' : ''}`} />
                    {i < 5 && <div className="absolute right-0 top-0 h-2 w-1 bg-white" />}
                  </div>
                  <p className="text-xs mt-1 text-center flex items-center justify-center gap-1">
                    {i === 1 && existingProviderId && (
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {i === 1 && 'Account & Payment'}
                    {i === 2 && 'Business'}
                    {i === 3 && 'Location'}
                    {i === 4 && 'Services'}
                    {i === 5 && 'Review & Submit'}
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

          {resumeMessage && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
              {resumeMessage}
            </div>
          )}

          {step === 5 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
              Please agree to all terms to complete your registration
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()}>
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

            {/* Step 5: Additional Info & Agreement (payment already complete) */}
            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Review & Submit</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Languages Spoken (Optional)
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
                </div>

                {/* Payment Complete Summary Box */}
                <div className="border-t pt-4 mt-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Payment Complete
                      </h3>
                    </div>
                    <p className="text-sm text-gray-700">
                      Your subscription is active. Submit this form to finish setting up your profile and start receiving inquiries.
                    </p>
                  </div>
                </div>

                {/* Agreement Terms */}
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
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    'Continue to Payment'
                  )}
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
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading || !formData.agree_to_terms}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Complete Registration'
                  )}
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

        {/* Care Seeker Note */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Looking for care services?{' '}
            <Link href="/auth/register-care-seeker" className="text-blue-600 hover:underline">
              Register as a Care Seeker
            </Link>
            {' '}– it&apos;s free!
          </p>
        </div>
      </div>
    </div>
  )
}
