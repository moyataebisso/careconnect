// app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      toast.error(authError.message)
      setLoading(false)
      return
    }

    if (!authData.user) {
      toast.error('Login failed')
      setLoading(false)
      return
    }

    // Check user role from user_roles table
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .single()

    // Check if they're an admin (backup check)
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', authData.user.id)
      .single()

    // Route based on user type
    if (adminUser) {
      toast.success('Welcome back, Admin!')
      router.push('/admin')
    } else if (userRole?.role === 'care_seeker') {
      toast.success('Welcome back!')
      router.push('/care-seeker/dashboard')
    } else if (userRole?.role === 'provider') {
      toast.success('Welcome back!')
      router.push('/dashboard')
    } else {
      // Check if they're a legacy provider
      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', authData.user.id)
        .single()
      
      if (provider) {
        // Legacy provider - add to user_roles for future
        await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role: 'provider' })
          .select()
          .single()
        
        toast.success('Welcome back!')
        router.push('/dashboard')
      } else {
        // No role found - default to dashboard
        toast.success('Welcome back!')
        router.push('/dashboard')
      }
    }
    
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
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
        
        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <Link href="/auth/reset-password" className="text-sm text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">New to CareConnect?</span>
            </div>
          </div>

          <div className="space-y-3">
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
        </form>
      </div>
    </div>
  )
}