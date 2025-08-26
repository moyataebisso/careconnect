'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Booking = {
  id: string
  provider_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  date: string
  time: string
  status: string
  notes?: string
  created_at: string
}

interface ProviderData {
  id: string
  user_id: string
  business_name: string
  [key: string]: unknown
}

export default function InquiriesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [provider, setProvider] = useState<ProviderData | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
  const [noProviderListing, setNoProviderListing] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Get provider record - handle case where no provider exists
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (providerError) {
        console.error('Error fetching provider:', providerError)
        throw providerError
      }

      if (!providerData) {
        // No provider listing yet
        setNoProviderListing(true)
        setLoading(false)
        return
      }

      setProvider(providerData)

      // Get bookings for this provider
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('provider_id', providerData.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching bookings:', error)
        setBookings([])
      } else {
        setBookings(bookingsData || [])
      }
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      // Reload bookings
      await loadBookings()
      alert('Status updated successfully')
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'pending') return booking.status === 'pending'
    if (filter === 'confirmed') return booking.status === 'confirmed'
    if (filter === 'cancelled') return booking.status === 'cancelled'
    return true
  })

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show message if no provider listing exists
  if (noProviderListing) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="mb-6">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3">No Provider Listing Found</h2>
              <p className="text-gray-600 mb-6">
                You need to create a provider listing before you can receive and manage bookings.
              </p>
              <Link
                href="/dashboard/create-listing"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Provider Listing
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Customer Bookings</h1>
              <p className="text-gray-600 mt-2">
                Manage appointment requests from customers
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold">{bookings.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'pending' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({bookings.filter(b => b.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'confirmed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'cancelled' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mb-4">
              <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">No bookings found</p>
            <p className="text-sm text-gray-500">
              {filter === 'pending' 
                ? 'You have no pending bookings at the moment.' 
                : filter === 'confirmed' 
                ? 'You have no confirmed bookings yet.'
                : filter === 'cancelled'
                ? 'You have no cancelled bookings.'
                : 'You haven\'t received any bookings yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{booking.customer_name}</h3>
                    <p className="text-sm text-gray-600">
                      Booked on {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Contact Information</p>
                    <p className="font-medium">{booking.customer_email}</p>
                    <p className="font-medium">{booking.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Appointment Details</p>
                    <p className="font-medium">Date: {formatDate(booking.date)}</p>
                    <p className="font-medium">Time: {booking.time}</p>
                    <p className="font-medium text-sm mt-1">Service: Initial Consultation</p>
                  </div>
                </div>

                {booking.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600 mb-1">Customer Notes</p>
                    <p className="text-gray-800">{booking.notes}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-2">
                    <a
                      href={`mailto:${booking.customer_email}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Email Customer
                    </a>
                    <span className="text-gray-400">|</span>
                    <a
                      href={`tel:${booking.customer_phone}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Call Customer
                    </a>
                    <span className="text-gray-400">|</span>
                    <Link
                      href={`/booking-confirmation/${booking.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                  
                  <select
                    value={booking.status}
                    onChange={(e) => updateStatus(booking.id, e.target.value)}
                    className="text-sm border border-gray-300 rounded px-3 py-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Tips for Managing Bookings</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Confirm bookings within 24 hours to secure appointments</li>
            <li>• Contact customers promptly if you need to reschedule</li>
            <li>• Keep booking status updated for accurate scheduling</li>
            <li>• Use the messaging system for all communications</li>
          </ul>
        </div>
      </div>
    </div>
  )
}