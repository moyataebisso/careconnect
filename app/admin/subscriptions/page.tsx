// File: /app/admin/subscriptions/page.tsx
// Replace your existing file at: app/admin/subscriptions/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ProviderSubscription {
  id: string
  business_name: string
  contact_email: string
  subscription_status: string
  subscription_start_date: string | null
  subscription_end_date: string | null
  trial_ends_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_plan_id: string | null
  created_at: string
  subscription_plans: {
    name: string
    price: number
  } | null
}

export default function AdminSubscriptionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [providers, setProviders] = useState<ProviderSubscription[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'expired'>('all')
  const [editingProvider, setEditingProvider] = useState<string | null>(null)
  // Trial reminders removed - payment required immediately
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null)
  const [syncingAll, setSyncingAll] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndLoadData()
  }, [])

  const checkAdminAndLoadData = async () => {
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
        alert('Access denied. Admin privileges required.')
        router.push('/dashboard')
        return
      }

      await loadProviders()
    } catch (error) {
      console.error('Error:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select(`
          id,
          business_name,
          contact_email,
          subscription_status,
          subscription_start_date,
          subscription_end_date,
          trial_ends_at,
          stripe_customer_id,
          stripe_subscription_id,
          subscription_plan_id,
          created_at,
          subscription_plans (
            name,
            price
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform the data to handle subscription_plans array
      const transformedData = (data || []).map(provider => ({
        ...provider,
        subscription_plans: Array.isArray(provider.subscription_plans) 
          ? provider.subscription_plans[0] || null 
          : provider.subscription_plans
      }))
      
      setProviders(transformedData)
    } catch (error) {
      console.error('Error loading providers:', error)
    }
  }

  // Sync single provider with Stripe
  const syncWithStripe = async (providerId: string, providerName: string) => {
    setSyncingProvider(providerId)
    try {
      const response = await fetch('/api/admin/sync-stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`✅ Synced ${providerName}\n\nStripe Status: ${data.stripeStatus}\nDatabase Status: ${data.dbStatus}${data.stripeSubscriptionId ? `\nSubscription ID: ${data.stripeSubscriptionId}` : ''}`)
        await loadProviders() // Reload the list
      } else {
        alert(`❌ Sync failed for ${providerName}\n\n${data.error}`)
      }
    } catch (error) {
      console.error('Sync error:', error)
      alert('Failed to sync with Stripe')
    } finally {
      setSyncingProvider(null)
    }
  }

  // Sync ALL providers with Stripe
  const syncAllWithStripe = async () => {
    if (!confirm('Sync ALL providers with Stripe accounts?\n\nThis will check each provider\'s Stripe subscription and update the database accordingly.')) return
    
    setSyncingAll(true)
    try {
      const response = await fetch('/api/admin/sync-stripe', {
        method: 'PUT'
      })
      
      const data = await response.json()
      
      if (data.success) {
        const resultText = data.results
          .map((r: {provider: string, status: string, error?: string}) => 
            `• ${r.provider}: ${r.status}${r.error ? ` (${r.error})` : ''}`
          )
          .join('\n')
        
        alert(`✅ ${data.message}\n\nResults:\n${resultText}`)
        await loadProviders() // Reload the list
      } else {
        alert(`❌ Sync failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Bulk sync error:', error)
      alert('Failed to sync with Stripe')
    } finally {
      setSyncingAll(false)
    }
  }

  const activateSubscription = async (providerId: string, duration: 'month' | '3months' | 'year' | 'lifetime') => {
    try {
      let endDate: Date
      const now = new Date()

      switch (duration) {
        case 'month':
          endDate = new Date(now.setMonth(now.getMonth() + 1))
          break
        case '3months':
          endDate = new Date(now.setMonth(now.getMonth() + 3))
          break
        case 'year':
          endDate = new Date(now.setFullYear(now.getFullYear() + 1))
          break
        case 'lifetime':
          endDate = new Date('2099-12-31') // Grandfathered account
          break
      }

      const { error } = await supabase
        .from('providers')
        .update({
          subscription_status: 'active',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: endDate.toISOString(),
          trial_ends_at: null
        })
        .eq('id', providerId)

      if (error) throw error
      
      await loadProviders()
      alert(`Subscription activated for ${duration}`)
    } catch (error) {
      console.error('Error activating subscription:', error)
      alert('Failed to activate subscription')
    }
  }

  const deactivateSubscription = async (providerId: string) => {
    if (!confirm('Are you sure you want to deactivate this subscription?')) return
    
    try {
      const { error } = await supabase
        .from('providers')
        .update({
          subscription_status: 'expired',
          subscription_end_date: new Date().toISOString()
        })
        .eq('id', providerId)

      if (error) throw error
      
      await loadProviders()
      alert('Subscription deactivated')
    } catch (error) {
      console.error('Error deactivating subscription:', error)
      alert('Failed to deactivate subscription')
    }
  }

  const filteredProviders = providers.filter(provider => {
    if (filter === 'all') return true
    if (filter === 'expired') {
      // Include expired, trial (legacy), and empty status
      return provider.subscription_status === 'expired' ||
             provider.subscription_status === 'trial' ||
             !provider.subscription_status
    }
    return provider.subscription_status === filter
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    if (date.getFullYear() > 2090) return 'Lifetime'
    return date.toLocaleDateString()
  }

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return 0
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // Count providers with Stripe accounts
  const providersWithStripe = providers.filter(p => p.stripe_customer_id).length

  // Count different subscription types
  const paidActiveCount = providers.filter(p => 
    p.subscription_status === 'active' && p.stripe_subscription_id
  ).length
  
  const grandfatheredCount = providers.filter(p => 
    p.subscription_status === 'active' && 
    !p.stripe_subscription_id && 
    p.subscription_end_date && 
    new Date(p.subscription_end_date).getFullYear() > 2090
  ).length
  
  const manualActiveCount = providers.filter(p => 
    p.subscription_status === 'active' && 
    !p.stripe_subscription_id &&
    (!p.subscription_end_date || new Date(p.subscription_end_date).getFullYear() <= 2090)
  ).length

  const expiredCount = providers.filter(p => p.subscription_status === 'expired' || p.subscription_status === 'trial').length
  const pastDueCount = providers.filter(p => p.subscription_status === 'past_due').length
  const pendingPaymentCount = providers.filter(p => !p.subscription_status || p.subscription_status === '' || p.subscription_status === 'trial').length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Manage Subscriptions</h1>
            <div className="flex gap-3 items-center">
              {/* Sync All Button */}
              <button
                onClick={syncAllWithStripe}
                disabled={syncingAll || providersWithStripe === 0}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 text-sm flex items-center gap-2"
                title={`Sync ${providersWithStripe} providers with Stripe accounts`}
              >
                {syncingAll ? (
                  <>
                    <span className="animate-spin">...</span>
                    Syncing...
                  </>
                ) : (
                  <>
                    Sync All with Stripe
                    {providersWithStripe > 0 && (
                      <span className="bg-white text-purple-600 px-2 py-0.5 rounded-full text-xs font-bold">
                        {providersWithStripe}
                      </span>
                    )}
                  </>
                )}
              </button>

              <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold">{providers.length}</div>
            <div className="text-sm text-gray-600">Total Providers</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600">
              {paidActiveCount}
            </div>
            <div className="text-sm text-gray-600">Paid Active</div>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-4 border-l-4 border-purple-500">
            <div className="text-2xl font-bold text-purple-600">
              {grandfatheredCount}
            </div>
            <div className="text-sm text-gray-600">Grandfathered</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-blue-600">
              {manualActiveCount}
            </div>
            <div className="text-sm text-gray-600">Manual Active</div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow p-4 border-l-4 border-orange-500">
            <div className="text-2xl font-bold text-orange-600">
              {pendingPaymentCount}
            </div>
            <div className="text-sm text-gray-600">Pending Payment</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-600">
              {expiredCount + pastDueCount}
            </div>
            <div className="text-sm text-gray-600">Expired/Past Due</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              All ({providers.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded ${
                filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Active ({providers.filter(p => p.subscription_status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded ${
                filter === 'expired' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Expired/Pending ({providers.filter(p => p.subscription_status === 'expired' || p.subscription_status === 'trial' || !p.subscription_status).length})
            </button>
          </div>
        </div>

        {/* Providers List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Provider</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Plan</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Dates</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Stripe Info</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProviders.map((provider) => {
                const hasStripe = !!provider.stripe_customer_id
                const needsPayment = provider.subscription_status !== 'active'

                return (
                  <tr key={provider.id} className={`hover:bg-gray-50 ${needsPayment ? 'bg-orange-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{provider.business_name}</div>
                      <div className="text-sm text-gray-500">{provider.contact_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {provider.subscription_plans ? (
                        <div>
                          <div className="font-medium">{provider.subscription_plans.name}</div>
                          <div className="text-sm text-gray-500">${provider.subscription_plans.price}/mo</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No plan</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {/* Improved status display */}
                      {(() => {
                        const hasStripeSubscription = !!provider.stripe_subscription_id
                        const isGrandfathered = provider.subscription_end_date && 
                          new Date(provider.subscription_end_date).getFullYear() > 2090
                        const isManualActive = provider.subscription_status === 'active' && 
                          !hasStripeSubscription && !isGrandfathered
                        
                        if (provider.subscription_status === 'active') {
                          if (hasStripeSubscription) {
                            return (
                              <div>
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  💳 Paid Active
                                </span>
                                <div className="text-xs text-green-600 mt-1">via Stripe</div>
                              </div>
                            )
                          } else if (isGrandfathered) {
                            return (
                              <div>
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                  ⭐ Grandfathered
                                </span>
                                <div className="text-xs text-purple-600 mt-1">Lifetime access</div>
                              </div>
                            )
                          } else {
                            return (
                              <div>
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  🔧 Manual Active
                                </span>
                                <div className="text-xs text-blue-600 mt-1">Admin activated</div>
                              </div>
                            )
                          }
                        } else if (provider.subscription_status === 'trial' || !provider.subscription_status) {
                          return (
                            <div>
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                Pending Payment
                              </span>
                              <div className="text-xs mt-1 text-orange-600">
                                Needs subscription
                              </div>
                            </div>
                          )
                        } else if (provider.subscription_status === 'past_due') {
                          return (
                            <div>
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                ⚠️ Past Due
                              </span>
                              <div className="text-xs text-orange-600 mt-1">Payment failed</div>
                            </div>
                          )
                        } else {
                          return (
                            <div>
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                ❌ Expired
                              </span>
                            </div>
                          )
                        }
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div>Start: {formatDate(provider.subscription_start_date)}</div>
                        <div>End: {formatDate(provider.subscription_end_date)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {provider.stripe_customer_id ? (
                        <div className="text-xs">
                          <div className="font-mono text-gray-600 mb-1" title={provider.stripe_customer_id}>
                            {provider.stripe_customer_id.substring(0, 15)}...
                          </div>
                          {provider.stripe_subscription_id ? (
                            <div className="font-mono text-green-600" title={provider.stripe_subscription_id}>
                              ✓ {provider.stripe_subscription_id.substring(0, 15)}...
                            </div>
                          ) : (
                            <div className="text-orange-500 font-medium">
                              ⚠️ No sub ID synced
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No Stripe account</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingProvider === provider.id ? (
                        <div className="flex flex-col gap-1">
                          {/* Sync with Stripe button - only show if has Stripe customer */}
                          {hasStripe && (
                            <button
                              onClick={() => syncWithStripe(provider.id, provider.business_name)}
                              disabled={syncingProvider === provider.id}
                              className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 disabled:opacity-50 flex items-center gap-1"
                            >
                              {syncingProvider === provider.id ? (
                                <>⏳ Syncing...</>
                              ) : (
                                <>🔄 Sync with Stripe</>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => activateSubscription(provider.id, 'month')}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                          >
                            Activate 1 Month
                          </button>
                          <button
                            onClick={() => activateSubscription(provider.id, '3months')}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                          >
                            Activate 3 Months
                          </button>
                          <button
                            onClick={() => activateSubscription(provider.id, 'lifetime')}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                          >
                            Grandfathered (Lifetime)
                          </button>
                          <button
                            onClick={() => deactivateSubscription(provider.id)}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                          >
                            Deactivate
                          </button>
                          <button
                            onClick={() => setEditingProvider(null)}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingProvider(provider.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Manage →
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredProviders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No subscriptions found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}