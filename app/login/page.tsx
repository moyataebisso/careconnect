// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Sign in the user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Login failed')
      }

      // 2. Check user role from user_roles table
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .single()

      if (roleError) {
        console.error('Role check error:', roleError)
        // If no role found, check if they're a legacy provider
        const { data: provider } = await supabase
          .from('providers')
          .select('id')
          .eq('user_id', authData.user.id)
          .single()
        
        if (provider) {
          // Legacy provider - add to user_roles and redirect
          await supabase
            .from('user_roles')
            .insert({ user_id: authData.user.id, role: 'provider' })
          router.push('/dashboard')
          return
        }
        
        // No role found - might be a new user, redirect to role selection
        router.push('/auth/select-role')
        return
      }

      // 3. Route based on user role
      switch (userRole.role) {
        case 'admin':
          router.push('/admin')
          break
        case 'provider':
          router.push('/dashboard')
          break
        case 'care_seeker':
          router.push('/care-seeker/dashboard')
          break
        default:
          router.push('/dashboard')
      }

    } catch (error) {
      console.error('Login error:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Invalid email or password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-gray-600">Sign in to your CareConnect account</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <Link href="/reset-password" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">New to CareConnect?</span>
            </div>
          </div>

          {/* Register Options */}
          <div className="mt-6 space-y-3">
            <Link
              href="/auth/register-care-seeker"
              className="w-full flex justify-center py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              I am Looking for Care
            </Link>
            <Link
              href="/auth/register"
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              I am a Care Provider
            </Link>
          </div>
        </div>

        {/* Help Links */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Need help?{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}