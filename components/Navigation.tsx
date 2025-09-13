'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface NavigationProps {
  initialUser: User | null
  initialRole: 'admin' | 'provider' | 'care_seeker' | null
}

export default function Navigation({ initialUser, initialRole }: NavigationProps) {
  const [user, setUser] = useState(initialUser)
  const [userRole, setUserRole] = useState(initialRole)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Check current auth state
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkUserRole(session.user.id)
      } else {
        setUserRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        await checkUserRole(user.id)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkUserRole = async (userId: string) => {
    try {
      // Check user_roles table first
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()
      
      if (roleData) {
        setUserRole(roleData.role as 'admin' | 'provider' | 'care_seeker')
        return
      }

      // Check if admin (legacy)
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', userId)
        .single()
      
      if (adminUser) {
        setUserRole('admin')
        return
      }

      // Check if provider (legacy)
      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', userId)
        .single()
      
      if (provider) {
        setUserRole('provider')
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    }
  }

  const isAdmin = userRole === 'admin'

  return (
    <>
      {/* Main Navigation */}
      <div className="hidden md:flex items-center space-x-8">
        <Link href="/browse" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
          Browse Providers
        </Link>
        <Link href="/services" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
          Our Services
        </Link>
        <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
          About Us
        </Link>
        <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
          Contact
        </Link>
        {isAdmin && (
          <Link href="/admin" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
            Admin
          </Link>
        )}
      </div>

      {/* Auth Buttons */}
      <div className="hidden md:flex items-center space-x-4">
        {user ? (
          <>
            {/* Show different options based on user role */}
            {userRole === 'care_seeker' && (
              <>
                <Link href="/care-seeker/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
                  Dashboard
                </Link>
                <Link href="/my-bookings" className="text-gray-700 hover:text-blue-600 font-medium">
                  My Bookings
                </Link>
                <Link href="/care-seeker/saved" className="text-gray-700 hover:text-blue-600 font-medium">
                  Saved
                </Link>
              </>
            )}
            {userRole === 'provider' && (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
                  Provider Dashboard
                </Link>
                <Link href="/dashboard/inquiries" className="text-gray-700 hover:text-blue-600 font-medium">
                  Inquiries
                </Link>
              </>
            )}
            {userRole === 'admin' && (
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
                Dashboard
              </Link>
            )}
            {!loading && !userRole && (
              <span className="text-sm text-gray-500">Loading...</span>
            )}
            <form action="/auth/logout" method="POST">
              <button className="text-gray-700 hover:text-blue-600 font-medium">
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/auth/login" className="text-gray-700 hover:text-blue-600 font-medium">
              Sign In
            </Link>
            <div className="flex items-center space-x-2">
              <Link href="/auth/register-care-seeker" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                Find Care
              </Link>
              <Link href="/auth/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                List Your Facility
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}