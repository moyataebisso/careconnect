'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Provider {
  id: string
  user_id: string
  current_capacity: number
  total_capacity: number
  is_at_capacity: boolean
}
export default function AvailabilityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [provider, setProvider] = useState<Provider | null>(null)
  const [formData, setFormData] = useState({
    current_capacity: 0,
    total_capacity: 0,
    is_at_capacity: false
  })
  const [successMessage, setSuccessMessage] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    checkAuthAndLoadProvider()
  }, [])

  const checkAuthAndLoadProvider = async () => {
    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Load provider data
      const { data: providerData, error } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error || !providerData) {
        console.error('Error loading provider:', error)
        // Redirect to create listing if no provider profile exists
        router.push('/dashboard/create-listing')
        return
      }

      setProvider(providerData)
      setFormData({
        current_capacity: providerData.current_capacity || 0,
        total_capacity: providerData.total_capacity || 0,
        is_at_capacity: providerData.is_at_capacity || false
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = parseInt(value) || 0
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: numValue
      }
      
      // Auto-update is_at_capacity based on occupancy
      if (name === 'current_capacity' || name === 'total_capacity') {
        updated.is_at_capacity = updated.current_capacity >= updated.total_capacity
      }
      
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMessage('')

    if (!provider) {
      alert('Provider information not loaded')
      setSaving(false)
      return
    }

    try {
      const { error } = await supabase
        .from('providers')
        .update({
          current_capacity: formData.current_capacity,
          total_capacity: formData.total_capacity,
          is_at_capacity: formData.is_at_capacity,
          updated_at: new Date().toISOString()
        })
        .eq('id', provider.id)

      if (error) throw error

      setSuccessMessage('Availability updated successfully!')
      
      // Reload provider data
      await checkAuthAndLoadProvider()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error updating availability:', error)
      alert('Failed to update availability. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getOccupancyPercentage = () => {
    if (formData.total_capacity === 0) return 0
    return Math.round((formData.current_capacity / formData.total_capacity) * 100)
  }

  const getOccupancyColor = () => {
    const percentage = getOccupancyPercentage()
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusText = () => {
    const percentage = getOccupancyPercentage()
    if (percentage >= 100) return 'At Full Capacity'
    if (percentage >= 75) return 'Near Capacity'
    return 'Spaces Available'
  }

  const availableSpots = Math.max(0, formData.total_capacity - formData.current_capacity)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          <h1 className="text-3xl font-bold">Manage Availability</h1>
          <p className="text-gray-600 mt-2">
            Update facility current capacity and availability status
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {successMessage}
          </div>
        )}

        {/* Current Status Card */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Current Status</h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Occupancy Status</p>
                <div className="flex items-center gap-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium ${getOccupancyColor()}`}>
                    {getStatusText()}
                  </span>
                  <span className="text-gray-700">
                    {getOccupancyPercentage()}% Full
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Available Spots</p>
                <p className="text-3xl font-bold text-gray-900">
                  {availableSpots}
                  <span className="text-base font-normal text-gray-600 ml-2">
                    of {formData.total_capacity} total
                  </span>
                </p>
              </div>
            </div>
            
            {/* Visual Occupancy Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Occupancy Level</span>
                <span>{formData.current_capacity} / {formData.total_capacity} occupied</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-300 ${getOccupancyColor()}`}
                  style={{ width: `${Math.min(100, getOccupancyPercentage())}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Update Capacity</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="current_capacity" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Occupied Beds
                </label>
                <input
                  type="number"
                  id="current_capacity"
                  name="current_capacity"
                  min="0"
                  max={formData.total_capacity}
                  value={formData.current_capacity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Number of beds currently occupied
                </p>
              </div>
              
              <div>
                <label htmlFor="total_capacity" className="block text-sm font-medium text-gray-700 mb-2">
                  Total Bed Capacity
                </label>
                <input
                  type="number"
                  id="total_capacity"
                  name="total_capacity"
                  min="1"
                  value={formData.total_capacity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Total number of beds in your facility
                </p>
              </div>
            </div>

            {/* At Capacity Toggle */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Facility at Full Capacity</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    This will be automatically set based on your occupancy
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  formData.is_at_capacity 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {formData.is_at_capacity ? 'Full' : 'Available'}
                </div>
              </div>
            </div>

            {/* Quick Adjustment Buttons */}
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Adjustments</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const newValue = Math.max(0, formData.current_capacity - 1)
                    setFormData(prev => ({
                      ...prev,
                      current_capacity: newValue,
                      is_at_capacity: newValue >= prev.total_capacity
                    }))
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                  disabled={formData.current_capacity === 0}
                >
                  -1 Occupied
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newValue = Math.min(formData.total_capacity, formData.current_capacity + 1)
                    setFormData(prev => ({
                      ...prev,
                      current_capacity: newValue,
                      is_at_capacity: newValue >= prev.total_capacity
                    }))
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                  disabled={formData.current_capacity >= formData.total_capacity}
                >
                  +1 Occupied
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      current_capacity: prev.total_capacity,
                      is_at_capacity: true
                    }))
                  }}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium"
                >
                  Mark as Full
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Update Availability'}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Information Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Important Notes</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your availability status is displayed publicly to care seekers</li>
            <li>• Update your capacity regularly to ensure accurate referrals</li>
            <li>• Facilities at full capacity will be marked accordingly in search results</li>
            <li>• Contact CareConnect support if you need assistance with capacity management</li>
          </ul>
        </div>
      </div>
    </div>
  )
}