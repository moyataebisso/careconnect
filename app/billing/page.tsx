'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// Define the exact shape of data from Supabase
interface ProviderRow {
  id: string
  business_name: string
  subscription_status: string
  subscription_end_date: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_plans: {
    name: string
    price: number
  } | null
}

export default function BillingPage() {
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<ProviderRow | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProviderData()
  }, [])

  const loadProviderData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Query with proper join syntax
    const { data: providerData, error } = await supabase
      .from('providers')
      .select(`
        id,
        business_name,
        subscription_status,
        subscription_end_date,
        stripe_customer_id,
        stripe_subscription_id,
        subscription_plan_id
      `)
      .eq('user_id', user.id)
      .single()

    if (providerData && !error) {
      // If provider has a plan, fetch it separately
      let planData = null
      if (providerData.subscription_plan_id) {
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('name, price')
          .eq('id', providerData.subscription_plan_id)
          .single()
        
        planData = plan
      }

      // Construct the provider object with proper typing
      const typedProvider: ProviderRow = {
        id: providerData.id,
        business_name: providerData.business_name,
        subscription_status: providerData.subscription_status || 'expired',
        subscription_end_date: providerData.subscription_end_date,
        stripe_customer_id: providerData.stripe_customer_id,
        stripe_subscription_id: providerData.stripe_subscription_id,
        subscription_plans: planData
      }

      setProvider(typedProvider)
    }
  }

  const handleManageBilling = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Failed to create portal session')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Unable to open billing portal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isGrandfathered = (endDate: string | null): boolean => {
    if (!endDate) return false
    const year = new Date(endDate).getFullYear()
    return year > 2090
  }

  return (
    <div className="container mx-auto px-4 pt-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
        
        {provider && (
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Status</span>
              <span className={`font-semibold ${
                provider.subscription_status === 'active' ? 'text-green-600' :
                provider.subscription_status === 'trial' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {provider.subscription_status === 'active' ? 'Active' :
                 provider.subscription_status === 'trial' ? 'Trial' :
                 'Expired'}
              </span>
            </div>
            
            {provider.subscription_plans && (
              <>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-medium">{provider.subscription_plans.name}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Price</span>
                  <span className="font-medium">${provider.subscription_plans.price}/month</span>
                </div>
              </>
            )}
            
            {provider.subscription_end_date && !isGrandfathered(provider.subscription_end_date) && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Next Billing Date</span>
                <span className="font-medium">
                  {new Date(provider.subscription_end_date).toLocaleDateString()}
                </span>
              </div>
            )}

            {isGrandfathered(provider.subscription_end_date) && (
              <div className="bg-green-50 p-3 rounded">
                <p className="text-green-800 text-sm">
                  ✨ Grandfathered Account - Lifetime Access
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Manage Your Subscription</h2>
        
        <p className="text-gray-600 mb-6">
          Access the Stripe customer portal to:
        </p>
        
        <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
          <li>View payment history and download invoices</li>
          <li>Update your payment method</li>
          <li>Change your subscription plan</li>
          <li>Cancel your subscription</li>
        </ul>
        
        <button
          onClick={handleManageBilling}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Opening Portal...' : 'Manage Billing in Stripe'}
        </button>
        
        <div className="mt-6 pt-6 border-t">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
      
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-2">Need Help?</h3>
        <p className="text-gray-600 mb-3">
          If you have any questions about your subscription or billing, please contact our support team.
        </p>
        <Link href="/contact" className="text-blue-600 hover:underline font-medium">
          Contact Support →
        </Link>
      </div>
    </div>
  )
}