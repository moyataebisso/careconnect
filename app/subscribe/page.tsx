'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { checkProviderSubscription, SubscriptionCheck } from '@/lib/subscription/middleware'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'

export default function SubscribePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium'>('basic')
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionCheck | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isProvider, setIsProvider] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    checkCurrentSubscription()
  }, [])

  const checkCurrentSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setUser(user)
      
      // Check if user is a provider
      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (provider) {
        setIsProvider(true)
        
        // Check provider subscription
        const status = await checkProviderSubscription(user.id)
        setSubscriptionStatus(status)
        
        if (status.hasAccess && status.status !== 'trial') {
          router.push('/dashboard')
        }
      } else {
        // Care seekers don't need subscriptions
        router.push('/providers')
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
      setError('Failed to load subscription status')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (selectedPlan === 'premium') {
      alert('Premium plan coming soon!')
      return
    }

    setProcessingPayment(true)
    setError(null)
    
    try {
      // Call Stripe checkout API
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: selectedPlan })
      })
      
      const data = await response.json()
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else if (data.error) {
        setError(data.error)
        alert(`Error: ${data.error}`)
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Payment error:', error)
      setError('Payment processing failed. Please try again.')
      alert('Payment processing failed. Please try again.')
    } finally {
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Only show subscription page to providers
  if (!isProvider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Care Seekers Browse Free!</h2>
          <p className="text-gray-600 mb-6">
            As a care seeker, you have free access to browse all providers.
          </p>
          <Link 
            href="/providers"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Browse Providers
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Provider Subscription Plans</h1>
          <p className="text-xl text-gray-600">
            List your facility and connect with care seekers
          </p>
          
          {subscriptionStatus?.status === 'trial' && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-blue-800">
                🎉 You have {subscriptionStatus.trialDaysLeft} days left in your free trial
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Basic Plan */}
          <div 
            className={`bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transition-all ${
              selectedPlan === 'basic' ? 'ring-4 ring-blue-500 transform scale-105' : 'hover:shadow-xl'
            }`}
            onClick={() => setSelectedPlan('basic')}
          >
            <div className="bg-blue-600 text-white p-6">
              <h2 className="text-2xl font-bold mb-2">Basic Provider Plan</h2>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">$99.99</span>
                <span className="ml-2 text-blue-200">/month</span>
              </div>
              <p className="text-sm text-blue-100 mt-2">7-day free trial included</p>
            </div>
            
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">List your facility</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Receive unlimited referral requests</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Upload facility photos</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Manage availability and capacity</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">245D verified badge</span>
                </li>
              </ul>
              
              {selectedPlan === 'basic' && (
                <div className="text-center text-blue-600 font-semibold">
                  ✓ Selected
                </div>
              )}
            </div>
          </div>

          {/* Premium Plan */}
          <div 
            className={`bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transition-all relative ${
              selectedPlan === 'premium' ? 'ring-4 ring-green-500 transform scale-105' : 'hover:shadow-xl opacity-75'
            }`}
            onClick={() => setSelectedPlan('premium')}
          >
            <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold">
              Coming Soon
            </div>
            
            <div className="bg-green-600 text-white p-6">
              <h2 className="text-2xl font-bold mb-2">Premium Provider Plan</h2>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">$199.99</span>
                <span className="ml-2 text-green-200">/month</span>
              </div>
              <p className="text-sm text-green-100 mt-2">7-day free trial included</p>
            </div>
            
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Everything in Basic</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Priority placement in search results</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Featured provider badge</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Advanced analytics dashboard</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>
              
              {selectedPlan === 'premium' && (
                <div className="text-center text-green-600 font-semibold">
                  ✓ Selected
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubscribe}
            disabled={processingPayment || selectedPlan === 'premium'}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
              selectedPlan === 'premium' 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : processingPayment
                ? 'bg-blue-400 text-white cursor-wait'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {processingPayment 
              ? 'Redirecting to checkout...' 
              : selectedPlan === 'premium'
              ? 'Premium Plan Coming Soon'
              : `Subscribe to Basic Plan - $99.99/mo`
            }
          </button>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              ✓ 7-day free trial • ✓ Cancel anytime • ✓ Secure payment via Stripe
            </p>
            {subscriptionStatus?.status === 'trial' && (
              <p className="text-xs text-blue-600 mt-2">
                Your trial will end on {new Date(Date.now() + (subscriptionStatus.trialDaysLeft * 24 * 60 * 60 * 1000)).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="mt-8 text-center">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}