'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    totalProviders: 0,
    activeProviders: 0,
    totalContactSubmissions: 0,
    unreadContactSubmissions: 0,
    totalCareSeekers: 0,
    activeCareSeekers: 0
  })
  
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if user is admin
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!adminUser?.role) {
        alert('Access denied. Admin privileges required.')
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      await loadStats()
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Get booking stats
      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })

      const { count: pendingBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Get provider stats
      const { count: totalProviders } = await supabase
        .from('providers')
        .select('*', { count: 'exact', head: true })

      const { count: activeProviders } = await supabase
        .from('providers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Get contact submission stats (changed from messages)
      const { count: totalContactSubmissions } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })

      const { count: unreadContactSubmissions } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .or('status.eq.new,status.is.null')

      // Get care seeker stats
      const { count: totalCareSeekers } = await supabase
        .from('care_seekers')
        .select('*', { count: 'exact', head: true })

      const { count: activeCareSeekers } = await supabase
        .from('care_seekers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      setStats({
        totalBookings: totalBookings || 0,
        pendingBookings: pendingBookings || 0,
        totalProviders: totalProviders || 0,
        activeProviders: activeProviders || 0,
        totalContactSubmissions: totalContactSubmissions || 0,
        unreadContactSubmissions: unreadContactSubmissions || 0,
        totalCareSeekers: totalCareSeekers || 0,
        activeCareSeekers: activeCareSeekers || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
              ← Back to Main Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards - Now 8 cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.totalBookings}</div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</div>
            <div className="text-sm text-gray-600">Pending Bookings</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.totalProviders}</div>
            <div className="text-sm text-gray-600">Total Providers</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{stats.activeProviders}</div>
            <div className="text-sm text-gray-600">Active Providers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.totalCareSeekers}</div>
            <div className="text-sm text-gray-600">Care Seekers</div>
          </div>
          <div className="bg-pink-50 rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-pink-600">{stats.activeCareSeekers}</div>
            <div className="text-sm text-gray-600">Active Seekers</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.totalContactSubmissions}</div>
            <div className="text-sm text-gray-600">Contact Forms</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-red-600">{stats.unreadContactSubmissions}</div>
            <div className="text-sm text-gray-600">Unread Forms</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Contact Form Messages */}
          <Link href="/admin/messages" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                {stats.unreadContactSubmissions > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {stats.unreadContactSubmissions} NEW
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-lg mb-2">Contact Messages</h3>
              <p className="text-gray-600 text-sm">View contact form submissions</p>
            </div>
          </Link>

          {/* Manage Bookings */}
          <Link href="/admin/bookings" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                {stats.pendingBookings > 0 && (
                  <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                    {stats.pendingBookings} PENDING
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-lg mb-2">Manage Bookings</h3>
              <p className="text-gray-600 text-sm">Review and manage ALL care-seeker bookings</p>
            </div>
          </Link>

          {/* Manage Providers */}
          <Link href="/admin/providers" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 rounded-lg p-3">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Manage Providers</h3>
              <p className="text-gray-600 text-sm">Approve and manage provider listings</p>
            </div>
          </Link>

          {/* Manage Care Seekers */}
          <Link href="/admin/care-seekers" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-pink-100 rounded-lg p-3">
                  <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                {stats.totalCareSeekers > 0 && (
                  <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                    {stats.totalCareSeekers} TOTAL
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-lg mb-2">Manage Care Seekers</h3>
              <p className="text-gray-600 text-sm">View and manage registered care seekers</p>
            </div>
          </Link>

          {/* Geocode Providers */}
          <Link href="/admin/geocode-providers" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-teal-100 rounded-lg p-3">
                  <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Geocode Providers</h3>
              <p className="text-gray-600 text-sm">Add map coordinates to provider addresses</p>
            </div>
          </Link>

          {/* Analytics */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 rounded-lg p-3">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xs text-gray-500">Coming Soon</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Analytics</h3>
            <p className="text-gray-600 text-sm">View platform statistics and reports</p>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gray-100 rounded-lg p-3">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-xs text-gray-500">Coming Soon</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Settings</h3>
            <p className="text-gray-600 text-sm">Configure platform settings</p>
          </div>

          {/* Email Templates */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-indigo-100 rounded-lg p-3">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs text-gray-500">Coming Soon</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Email Templates</h3>
            <p className="text-gray-600 text-sm">Manage automated email templates</p>
          </div>
        </div>
      </div>
    </div>
  )
}