// app/auth/register-care-seeker/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterCareSeekerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  
  const supabase = createClient()

  const [formData, setFormData] = useState({
    // Step 1: Account
    email: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Personal Info
    first_name: '',
    last_name: '',
    phone: '',
    
    // Step 3: Care Recipient
    relationship_to_patient: 'self',
    patient_name: '',
    patient_age: '',
    care_type: '',
    service_types_needed: [] as string[],
    care_needs: '',
    
    // Step 4: Location & Budget
    preferred_city: '',
    preferred_zip: '',
    preferred_distance: '10',
    has_waiver: false,
    waiver_type: '',
    budget_min: '',
    budget_max: '',
    urgency: 'planning_ahead',
    move_in_date: '',
  })

  const serviceTypes = [
    { value: 'ICS', label: 'Integrated Community Services' },
    { value: 'FRS', label: 'Family Residential Services' },
    { value: 'CRS', label: 'Community Residential Services' },
    { value: 'DC_DM', label: 'Day Care/Day Services' },
    { value: 'ADL_SUPPORT', label: 'ADLs Support' },
    { value: 'ASSISTED_LIVING', label: 'Assisted Living (24/7)' },
  ]

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
      service_types_needed: prev.service_types_needed.includes(service)
        ? prev.service_types_needed.filter(s => s !== service)
        : [...prev.service_types_needed, service]
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
        if (!formData.first_name || !formData.last_name) {
          setError('Please provide your name')
          return false
        }
        break
      case 3:
        if (formData.relationship_to_patient !== 'self' && !formData.patient_name) {
          setError('Please provide the care recipient\'s name')
          return false
        }
        if (!formData.care_needs) {
          setError('Please describe the care needs')
          return false
        }
        break
      case 4:
        if (!formData.preferred_city && !formData.preferred_zip) {
          setError('Please provide at least a city or ZIP code')
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
      console.log('Starting care seeker registration...')
      
      // 1. Create auth user
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

      // 2. Create user role (optional - skip if it fails)
      try {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'care_seeker'
          })

        if (roleError) {
          console.log('Role creation skipped:', roleError.message)
          // Don't throw - this is non-critical
        } else {
          console.log('User role created successfully')
        }
      } catch (roleErr) {
        console.log('User roles table may not exist, skipping role creation')
      }

      // 3. Create care seeker profile - FIXED VERSION
      console.log('Creating care seeker profile...')
      
      // Build the care seeker data to match your database schema exactly
      const careSeekerData = {
        // Don't include 'id' - let the database generate it with gen_random_uuid()
        user_id: authData.user.id,
        email: formData.email, // ADD this - it was missing!
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || null,
        relationship_to_patient: formData.relationship_to_patient,
        patient_name: formData.relationship_to_patient !== 'self' ? formData.patient_name : null,
        patient_age: formData.patient_age ? parseInt(formData.patient_age) : null,
        care_type: formData.care_type || null,
        service_types_needed: formData.service_types_needed, // This should work as ARRAY
        care_needs: formData.care_needs,
        preferred_city: formData.preferred_city || null,
        preferred_zip: formData.preferred_zip || null,
        preferred_distance: parseInt(formData.preferred_distance),
        has_waiver: formData.has_waiver,
        waiver_type: formData.has_waiver ? formData.waiver_type : null,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        urgency: formData.urgency,
        move_in_date: formData.move_in_date || null,
        is_active: true, // Set to true by default
        // created_at and updated_at will be set automatically
      }

      console.log('Care seeker data to insert:', careSeekerData)

      const { data: careSeekerResult, error: profileError } = await supabase
        .from('care_seekers')
        .insert(careSeekerData)
        .select()

      if (profileError) {
        console.error('Care seeker profile error details:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        })
        console.error('Care seeker data that failed:', careSeekerData)
        
        // Better error messages for common issues
        if (profileError.code === '23505') { // Unique violation
          if (profileError.message.includes('email')) {
            throw new Error('A care seeker account with this email already exists.')
          }
          if (profileError.message.includes('user_id')) {
            throw new Error('A care seeker account already exists for this user.')
          }
          throw new Error('This care seeker information already exists.')
        }
        
        if (profileError.code === '23503') { // Foreign key violation
          throw new Error('User registration failed. Please try again.')
        }
        
        if (profileError.code === '42501') { // Permission denied
          throw new Error('Permission denied. Please check your account permissions.')
        }
        
        throw new Error(`Profile creation failed: ${profileError.message}`)
      }

      console.log('Care seeker profile created successfully:', careSeekerResult)

      // 4. Try to update or create profile in profiles table if it exists (optional)
      try {
        // First try to insert the profile
        const { error: profileInsertError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: `${formData.first_name} ${formData.last_name}`,
            role: 'care_seeker',
            phone: formData.phone || null
          })

        if (profileInsertError) {
          // If insert fails (profile might already exist from trigger), try update
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({
              full_name: `${formData.first_name} ${formData.last_name}`,
              role: 'care_seeker',
              phone: formData.phone || null
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
      alert('Registration successful! Please check your email to verify your account.')
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Quality Care</h1>
          <p className="text-gray-600">Create your account to browse and contact care providers</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1">
                <div className="relative">
                  <div className={`h-2 ${i < step ? 'bg-green-600' : i === step ? 'bg-green-400' : 'bg-gray-300'} ${i < 4 ? 'mr-1' : ''}`} />
                  {i < 4 && <div className="absolute right-0 top-0 h-2 w-1 bg-white" />}
                </div>
                <p className="text-xs mt-1 text-center">
                  {i === 1 && 'Account'}
                  {i === 2 && 'Your Info'}
                  {i === 3 && 'Care Needs'}
                  {i === 4 && 'Preferences'}
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
            {/* Step 1: Account */}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Personal Info */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Your Information</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="(XXX) XXX-XXXX"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Care Needs */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Care Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Who needs care? *
                  </label>
                  <select
                    name="relationship_to_patient"
                    value={formData.relationship_to_patient}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="self">Myself</option>
                    <option value="parent">My Parent</option>
                    <option value="child">My Child</option>
                    <option value="spouse">My Spouse</option>
                    <option value="sibling">My Sibling</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {formData.relationship_to_patient !== 'self' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Care Recipient Name *
                      </label>
                      <input
                        type="text"
                        name="patient_name"
                        value={formData.patient_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Care Recipient Age
                      </label>
                      <input
                        type="number"
                        name="patient_age"
                        value={formData.patient_age}
                        onChange={handleInputChange}
                        min="0"
                        max="120"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Care Type
                  </label>
                  <select
                    name="care_type"
                    value={formData.care_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select care type...</option>
                    <option value="CADI">CADI - Community Access for Disability Inclusion</option>
                    <option value="DD">DD - Developmental Disabilities</option>
                    <option value="BI">BI - Brain Injury</option>
                    <option value="ELDERLY">Elderly Care (65+)</option>
                    <option value="other">Other/Not Sure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Services Needed (Check all that apply)
                  </label>
                  <div className="space-y-2">
                    {serviceTypes.map((service) => (
                      <label key={service.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.service_types_needed.includes(service.value)}
                          onChange={() => handleServiceTypeChange(service.value)}
                          className="mr-3"
                        />
                        <span>{service.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Describe Care Needs *
                  </label>
                  <textarea
                    name="care_needs"
                    value={formData.care_needs}
                    onChange={handleInputChange}
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Please describe specific care needs, mobility requirements, medical conditions, or any other important information..."
                  />
                </div>
              </div>
            )}

            {/* Step 4: Location & Budget */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Location & Budget Preferences</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred City
                    </label>
                    <input
                      type="text"
                      name="preferred_city"
                      value={formData.preferred_city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Minneapolis"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred ZIP Code
                    </label>
                    <input
                      type="text"
                      name="preferred_zip"
                      value={formData.preferred_zip}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="55401"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Distance (miles)
                  </label>
                  <select
                    name="preferred_distance"
                    value={formData.preferred_distance}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="5">5 miles</option>
                    <option value="10">10 miles</option>
                    <option value="25">25 miles</option>
                    <option value="50">50 miles</option>
                    <option value="100">100+ miles</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="has_waiver"
                      checked={formData.has_waiver}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span className="font-medium">I have or am eligible for a waiver program</span>
                  </label>

                  {formData.has_waiver && (
                    <div className="ml-6">
                      <select
                        name="waiver_type"
                        value={formData.waiver_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select waiver type...</option>
                        <option value="CADI">CADI Waiver</option>
                        <option value="DD">DD Waiver</option>
                        <option value="BI">BI Waiver</option>
                        <option value="ELDERLY">Elderly Waiver</option>
                      </select>
                    </div>
                  )}
                </div>

                {!formData.has_waiver && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Budget Min
                      </label>
                      <input
                        type="number"
                        name="budget_min"
                        value={formData.budget_min}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="$0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Budget Max
                      </label>
                      <input
                        type="number"
                        name="budget_max"
                        value={formData.budget_max}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="$5000"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    When do you need care?
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="immediate">Immediately</option>
                    <option value="within_week">Within a week</option>
                    <option value="within_month">Within a month</option>
                    <option value="planning_ahead">Planning ahead</option>
                  </select>
                </div>

                {formData.urgency !== 'immediate' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Move-in Date
                    </label>
                    <input
                      type="date"
                      name="move_in_date"
                      value={formData.move_in_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
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

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
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
              <Link href="/login" className="text-green-600 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}