// app/care-seeker/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface CareSeeker {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  relationship_to_patient: string
  patient_name?: string
  patient_age?: number
  care_type?: string
  service_types_needed?: string[]
  care_needs: string
  preferred_city?: string
  preferred_zip?: string
  preferred_distance?: number
  budget_min?: number
  budget_max?: number
  has_waiver: boolean
  waiver_type?: string
  urgency: string
  move_in_date?: string
}

export default function CareSeekerProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<CareSeeker | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    relationship_to_patient: 'self',
    patient_name: '',
    patient_age: '',
    care_type: '',
    service_types_needed: [] as string[],
    care_needs: '',
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

  const supabase = createClient()

  const serviceTypes = [
    { value: 'ICS', label: 'Integrated Community Services' },
    { value: 'FRS', label: 'Family Residential Services' },
    { value: 'CRS', label: 'Community Residential Services' },
    { value: 'DC_DM', label: 'Day Care/Day Services' },
    { value: 'ADL_SUPPORT', label: 'ADLs Support' },
    { value: 'ASSISTED_LIVING', label: 'Assisted Living (24/7)' },
  ]

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profileData, error } = await supabase
        .from('care_seekers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error || !profileData) {
        console.error('Error loading profile:', error)
        router.push('/care-seeker/dashboard')
        return
      }

      setProfile(profileData)
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone: profileData.phone || '',
        relationship_to_patient: profileData.relationship_to_patient || 'self',
        patient_name: profileData.patient_name || '',
        patient_age: profileData.patient_age?.toString() || '',
        care_type: profileData.care_type || '',
        service_types_needed: profileData.service_types_needed || [],
        care_needs: profileData.care_needs || '',
        preferred_city: profileData.preferred_city || '',
        preferred_zip: profileData.preferred_zip || '',
        preferred_distance: profileData.preferred_distance?.toString() || '10',
        has_waiver: profileData.has_waiver || false,
        waiver_type: profileData.waiver_type || '',
        budget_min: profileData.budget_min?.toString() || '',
        budget_max: profileData.budget_max?.toString() || '',
        urgency: profileData.urgency || 'planning_ahead',
        move_in_date: profileData.move_in_date || '',
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !profile) return

      const { error } = await supabase
        .from('care_seekers')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || null,
          relationship_to_patient: formData.relationship_to_patient,
          patient_name: formData.relationship_to_patient !== 'self' ? formData.patient_name : null,
          patient_age: formData.patient_age ? parseInt(formData.patient_age) : null,
          care_type: formData.care_type || null,
          service_types_needed: formData.service_types_needed,
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
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      alert('Profile updated successfully!')
      router.push('/care-seeker/dashboard')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Edit Care Profile</h1>
            <Link href="/care-seeker/dashboard" className="text-gray-600 hover:text-gray-800">
              ← Back to Dashboard
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
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
                  />
                </div>
              </div>
            </div>

            {/* Care Recipient Information */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Care Recipient</h2>
              
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
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Care Recipient Name
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
                </div>
              )}

              <div className="mt-4">
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

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Services Needed
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

              <div className="mt-4">
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
                  placeholder="Please describe specific care needs..."
                />
              </div>
            </div>

            {/* Location & Budget */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold mb-4">Location & Budget</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
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
                  />
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
              </div>

              <div className="mt-4">
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
                  <div className="mt-3 ml-6">
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
                <div className="grid md:grid-cols-2 gap-4 mt-4">
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
            </div>

            {/* Timeline */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Timeline</h2>
              
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
                <div className="mt-4">
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

            {/* Submit Buttons */}
            <div className="flex justify-between pt-6">
              <Link
                href="/care-seeker/dashboard"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}