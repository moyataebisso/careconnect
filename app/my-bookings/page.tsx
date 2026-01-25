'use client'

import { useState, useEffect } from 'react'
import { api } from '@/utils/api'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Booking } from '@/types/booking'

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all')
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.email) {
        setCurrentUserEmail(user.email)
        // Only load bookings after we have the user
        loadBookings(user.email)
      } else {
        // No user logged in
        setLoading(false)
      }
    } catch (error) {
      console.error('Error getting user:', error)
      setLoading(false)
    }
  }

  const loadBookings = async (userEmail: string) => {
    try {
      setLoading(true)
      const allBookings = await api.getBookings()
      
      // Filter bookings to only show ones belonging to current user
      const userBookings = allBookings.filter((booking) => {
        // Check possible email fields that exist on the Booking type
        const bookingEmail = 
          booking.customer_email || 
          booking.email ||
          '';
        
        // Only show bookings that match the current user's email
        return bookingEmail === userEmail;
      })
      
      console.log(`Found ${userBookings.length} bookings for ${userEmail} out of ${allBookings.length} total`)
      
      // Fetch additional details if needed
      const enrichedBookings = await Promise.all(
        userBookings.map(async (booking): Promise<Booking> => {
          const enrichedBooking: Booking = { ...booking };
          
          try {
            // If provider details are missing, try to fetch them
            if (!booking.provider && booking.provider_id) {
              try {
                const provider = await api.getProvider(booking.provider_id)
                enrichedBooking.provider = provider
              } catch (err) {
                console.log('Could not fetch provider details')
              }
            }
            
            // If service details are missing, try to fetch them
            if (!booking.service && booking.service_id) {
              try {
                const service = await api.getService(booking.service_id)
                enrichedBooking.service = service
              } catch (err) {
                console.log('Could not fetch service details')
              }
            }
          } catch (error) {
            console.error('Error enriching booking:', error)
          }
          
          return enrichedBooking
        })
      )
      
      setBookings(enrichedBookings)
    } catch (error) {
      console.error('Error loading bookings:', error)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      await api.cancelBooking(bookingId, 'Customer requested cancellation')
      if (currentUserEmail) {
        await loadBookings(currentUserEmail)
      }
      alert('Booking cancelled successfully!')
    } catch (error) {
      alert('Failed to cancel booking')
    }
  }

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true
    return booking.status === filter
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // If not logged in
  if (!currentUserEmail && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to view your bookings.</p>
          <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Bookings</h1>
            {currentUserEmail && (
              <p className="text-sm text-gray-600 mt-1">Account: {currentUserEmail}</p>
            )}
          </div>
          <Link
            href="/booking"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Book New Service
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 font-medium ${
                filter === 'all'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-6 py-3 font-medium ${
                filter === 'confirmed'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-6 py-3 font-medium ${
                filter === 'cancelled'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="w-24 h-24 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You haven't made any bookings with this account yet."
                : `No ${filter} bookings found.`}
            </p>
            <Link
              href="/booking"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Book Your First Service
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">
                          Booking #{booking.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <div className="space-y-2 text-gray-600">
                          <p className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Provider: {booking.provider?.business_name || booking.provider_name || 'Provider'}
                          </p>
                          <p className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Service: {booking.service?.name || booking.service_name || 'Service'}
                          </p>
                          <p className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Date: {formatDate(booking.date)}
                          </p>
                          <p className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Time: {booking.time}
                          </p>
                          {(booking.service?.price !== undefined || booking.service?.duration) && (
                            <p className="flex items-center">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {booking.service?.price !== undefined && `$${booking.service.price}`}
                              {booking.service?.duration && ` (${booking.service.duration} min)`}
                            </p>
                          )}
                          {booking.customer_name && (
                            <p className="flex items-center">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Customer: {booking.customer_name}
                            </p>
                          )}
                        </div>
                        {booking.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Notes:</span> {booking.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="ml-6">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      {booking.status === 'confirmed' && (
                        <>
                          <Link
                            href={`/booking-confirmation/${booking.id}`}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            View Details & Message
                          </Link>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50"
                          >
                            Cancel Booking
                          </button>
                        </>
                      )}
                      {booking.status === 'cancelled' && (
                        <Link
                          href="/booking"
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Book Again
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}