'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  price: number
  features: Record<string, string | boolean | number>
  stripe_price_id: string | null
  updated_at: string
  created_at: string
  is_active: boolean
}

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndLoadPlans()
  }, [])

  const checkAdminAndLoadPlans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!adminUser) {
        router.push('/dashboard')
        return
      }

      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true })

      if (plansData) {
        setPlans(plansData as SubscriptionPlan[])
      }
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePlanPrice = async (planId: string, newPrice: string) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ 
          price: parseFloat(newPrice),
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)

      if (!error) {
        alert('Price updated successfully!')
        checkAdminAndLoadPlans()
      } else {
        alert('Error updating price')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to update price')
    } finally {
      setSaving(false)
    }
  }

  const updatePlanFeatures = async (planId: string, features: Record<string, string | boolean | number>) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ 
          features,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)

      if (!error) {
        alert('Features updated successfully!')
        checkAdminAndLoadPlans()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Pricing Management</h1>
          <p className="text-gray-600 mt-2">Update subscription plans and pricing</p>
        </div>

        <div className="space-y-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{plan.name}</h2>
                  <p className="text-gray-500 text-sm">ID: {plan.slug}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Price
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={plan.price}
                      onBlur={(e) => {
                        if (e.target.value !== plan.price.toString()) {
                          updatePlanPrice(plan.id, e.target.value)
                        }
                      }}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Features</h3>
                <div className="space-y-2">
                  {Object.entries(plan.features || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                      <span className="text-sm font-medium">
                        {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Last updated: {new Date(plan.updated_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => {
                      const newFeature = prompt('Add feature (format: key=value)')
                      if (newFeature && newFeature.includes('=')) {
                        const [key, value] = newFeature.split('=')
                        const features = { ...plan.features }
                        features[key] = value === 'true' ? true : value === 'false' ? false : value
                        updatePlanFeatures(plan.id, features)
                      }
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Add Feature
                  </button>
                </div>
              </div>

              {plan.stripe_price_id && (
                <div className="mt-2 text-xs text-gray-400">
                  Stripe Price ID: {plan.stripe_price_id}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Quick Actions</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• Prices update immediately in the database</p>
            <p>• Changes affect new subscriptions only</p>
            <p>• Existing subscriptions continue at their current price</p>
            <p>• To change existing subscriptions, use Stripe dashboard</p>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.push('/admin')}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Admin
          </button>
          <button
            onClick={checkAdminAndLoadPlans}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}