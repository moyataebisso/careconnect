'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { checkProviderSubscription, checkIfCareSeeker, SubscriptionCheck } from '@/lib/subscription/middleware'
import Link from 'next/link'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireProviderSubscription?: boolean
  allowCareSeeker?: boolean
}

export default function ProtectedRoute({ 
  children, 
  requireProviderSubscription = false,
  allowCareSeeker = true 
}: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionCheck | null>(null)
  const [userType, setUserType] = useState<'provider' | 'care_seeker' | 'none'>('none')
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    checkAccess()
  }, [pathname])

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Determine user type
      const isCareSeeker = await checkIfCareSeeker(user.id)
      
      if (isCareSeeker) {
        setUserType('care_seeker')
        // Care seekers always have access to browse
        if (allowCareSeeker) {
          setLoading(false)
          return
        } else {
          // This route is provider-only
          router.push('/providers')
          return
        }
      }

      // Check if user is a provider
      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (provider) {
        setUserType('provider')

        // Check provider subscription if required
        if (requireProviderSubscription) {
          const status = await checkProviderSubscription(user.id)
          setSubscriptionStatus(status)

          // Don't redirect - let the dashboard show with payment overlay
          // The dashboard itself will handle showing the PaymentRequiredOverlay
        }
      } else {
        // User is neither provider nor care seeker
        setUserType('none')
        router.push('/auth/register')
        return
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Access check error:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show grandfathered banner for early supporters only
  return (
    <>
      {userType === 'provider' && subscriptionStatus?.status === 'active' &&
       subscriptionStatus.message?.includes('Grandfathered') && (
        <div className="bg-green-50 border-b border-green-200 p-3">
          <div className="container mx-auto px-4">
            <p className="text-sm text-green-800">
              Grandfathered Account - Thank you for being an early supporter!
            </p>
          </div>
        </div>
      )}

      {children}
    </>
  )
}