'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ProviderSubscription {
  id: string
  business_name: string
  contact_email: string
  subscription_status: string | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  status: string
}

export default function AdminSubscriptionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [providers, setProviders] = useState<ProviderSubscription[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all')
  const [editingProvider, setEditingProvider] = useState<string | null>(null)
  const [addDaysAmount, setAddDaysAmount] = useState<number>(30)
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null)
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
          stripe_customer_id,
          stripe_subscription_id,
          created_at,
          status
        `)
        .eq('status', 'active') // Only show approved providers
        .order('business_name', { ascending: true })

      if (error) throw error
      setProviders(data || [])
    } catch (error) {
      console.error('Error loading providers:', error)
    }
  }

  // Toggle subscription status between active and pending
  const toggleSubscriptionStatus = async (providerId: string, currentStatus: string | null) => {
    const newStatus = currentStatus === 'active' ? 'pending' : 'active'
    const action = newStatus === 'active' ? 'activate' : 'deactivate'

    if (!confirm(`Are you sure you want to ${action} this subscription?`)) return

    try {
      const updates: Record<string, string | null> = {
        subscription_status: newStatus
      }

      // If activating, set start date to now if not already set
      if (newStatus === 'active') {
        const provider = providers.find(p => p.id === providerId)
        if (!provider?.subscription_start_date) {
          updates.subscription_start_date = new Date().toISOString()
        }
        // Set end date to 30 days from now if not set
        if (!provider?.subscription_end_date) {
          const endDate = new Date()
          endDate.setDate(endDate.getDate() + 30)
          updates.subscription_end_date = endDate.toISOString()
        }
      }

      const { error } = await supabase
        .from('providers')
        .update(updates)
        .eq('id', providerId)

      if (error) throw error

      await loadProviders()
      alert(`Subscription ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating subscription:', error)
      alert('Failed to update subscription')
    }
  }

  // Add days to subscription
  const addDaysToSubscription = async (providerId: string, days: number) => {
    try {
      const provider = providers.find(p => p.id === providerId)
      if (!provider) return

      let newEndDate: Date

      if (provider.subscription_end_date) {
        // Add days to existing end date
        newEndDate = new Date(provider.subscription_end_date)
        newEndDate.setDate(newEndDate.getDate() + days)
      } else {
        // Start from today
        newEndDate = new Date()
        newEndDate.setDate(newEndDate.getDate() + days)
      }

      const updates: Record<string, string> = {
        subscription_end_date: newEndDate.toISOString(),
        subscription_status: 'active'
      }

      // Set start date if not set
      if (!provider.subscription_start_date) {
        updates.subscription_start_date = new Date().toISOString()
      }

      const { error } = await supabase
        .from('providers')
        .update(updates)
        .eq('id', providerId)

      if (error) throw error

      await loadProviders()
      alert(`Added ${days} days to subscription. New end date: ${newEndDate.toLocaleDateString()}`)
    } catch (error) {
      console.error('Error adding days:', error)
      alert('Failed to add days to subscription')
    }
  }

  // Set subscription to lifetime (grandfathered)
  const setLifetimeSubscription = async (providerId: string) => {
    if (!confirm('Set this provider as grandfathered with lifetime access?')) return

    try {
      const { error } = await supabase
        .from('providers')
        .update({
          subscription_status: 'active',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: new Date('2099-12-31').toISOString()
        })
        .eq('id', providerId)

      if (error) throw error

      await loadProviders()
      alert('Provider set as grandfathered with lifetime access')
    } catch (error) {
      console.error('Error setting lifetime:', error)
      alert('Failed to set lifetime subscription')
    }
  }

  // Sync with Stripe
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
        alert(`Synced ${providerName}\n\nStripe Status: ${data.stripeStatus}\nDatabase Status: ${data.dbStatus}`)
        await loadProviders()
      } else {
        alert(`Sync failed for ${providerName}\n\n${data.error}`)
      }
    } catch (error) {
      console.error('Sync error:', error)
      alert('Failed to sync with Stripe')
    } finally {
      setSyncingProvider(null)
    }
  }

  // Filter providers
  const filteredProviders = providers.filter(provider => {
    if (filter === 'all') return true
    if (filter === 'pending') {
      return provider.subscription_status === 'pending' || !provider.subscription_status
    }
    if (filter === 'expired') {
      return provider.subscription_status === 'expired' || provider.subscription_status === 'past_due'
    }
    return provider.subscription_status === filter
  })

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    if (date.getFullYear() > 2090) return 'Lifetime'
    return date.toLocaleDateString()
  }

  // Get days remaining
  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null
    const end = new Date(endDate)
    if (end.getFullYear() > 2090) return 'Lifetime'
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  // Counts
  const activeCount = providers.filter(p => p.subscription_status === 'active').length
  const pendingCount = providers.filter(p => p.subscription_status === 'pending' || !p.subscription_status).length
  const expiredCount = providers.filter(p => p.subscription_status === 'expired' || p.subscription_status === 'past_due').length

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
            <Link href="/admin" className="text-blue-600 hover:text-blue-800">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold">{providers.length}</div>
            <div className="text-sm text-gray-600">Total Providers</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <div className="text-sm text-gray-600">Active Subscriptions</div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow p-4 border-l-4 border-orange-500">
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <div className="text-sm text-gray-600">Pending Payment</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-600">{expiredCount}</div>
            <div className="text-sm text-gray-600">Expired</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              All ({providers.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded ${filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded ${filter === 'expired' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Expired ({expiredCount})
            </button>
          </div>
        </div>

        {/* Providers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Business Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Start Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">End Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Days Left</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProviders.map((provider) => {
                const daysRemaining = getDaysRemaining(provider.subscription_end_date)
                const isExpiringSoon = typeof daysRemaining === 'number' && daysRemaining <= 7 && daysRemaining > 0
                const isExpired = typeof daysRemaining === 'number' && daysRemaining <= 0

                return (
                  <tr key={provider.id} className={`hover:bg-gray-50 ${isExpired ? 'bg-red-50' : isExpiringSoon ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{provider.business_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">{provider.contact_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        provider.subscription_status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : provider.subscription_status === 'pending' || !provider.subscription_status
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {provider.subscription_status === 'active' ? 'Active' :
                         provider.subscription_status === 'pending' || !provider.subscription_status ? 'Pending' :
                         'Expired'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatDate(provider.subscription_start_date)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatDate(provider.subscription_end_date)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {daysRemaining === 'Lifetime' ? (
                        <span className="text-purple-600 font-medium">Lifetime</span>
                      ) : daysRemaining === null ? (
                        <span className="text-gray-400">-</span>
                      ) : daysRemaining <= 0 ? (
                        <span className="text-red-600 font-medium">Expired</span>
                      ) : (
                        <span className={daysRemaining <= 7 ? 'text-orange-600 font-medium' : ''}>
                          {daysRemaining} days
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingProvider === provider.id ? (
                        <div className="space-y-2">
                          {/* Toggle Status */}
                          <button
                            onClick={() => toggleSubscriptionStatus(provider.id, provider.subscription_status)}
                            className={`w-full text-xs px-3 py-1.5 rounded ${
                              provider.subscription_status === 'active'
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {provider.subscription_status === 'active' ? 'Set to Pending' : 'Set to Active'}
                          </button>

                          {/* Add Days */}
                          <div className="flex gap-1">
                            <input
                              type="number"
                              value={addDaysAmount}
                              onChange={(e) => setAddDaysAmount(parseInt(e.target.value) || 30)}
                              className="w-16 text-xs px-2 py-1.5 border rounded"
                              min="1"
                            />
                            <button
                              onClick={() => addDaysToSubscription(provider.id, addDaysAmount)}
                              className="flex-1 text-xs bg-blue-100 text-blue-700 px-2 py-1.5 rounded hover:bg-blue-200"
                            >
                              Add Days
                            </button>
                          </div>

                          {/* Quick Add Buttons */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => addDaysToSubscription(provider.id, 30)}
                              className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                            >
                              +30d
                            </button>
                            <button
                              onClick={() => addDaysToSubscription(provider.id, 90)}
                              className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                            >
                              +90d
                            </button>
                            <button
                              onClick={() => addDaysToSubscription(provider.id, 365)}
                              className="flex-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                            >
                              +1yr
                            </button>
                          </div>

                          {/* Lifetime */}
                          <button
                            onClick={() => setLifetimeSubscription(provider.id)}
                            className="w-full text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-200"
                          >
                            Set Lifetime (Grandfathered)
                          </button>

                          {/* Sync with Stripe */}
                          {provider.stripe_customer_id && (
                            <button
                              onClick={() => syncWithStripe(provider.id, provider.business_name)}
                              disabled={syncingProvider === provider.id}
                              className="w-full text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-200 disabled:opacity-50"
                            >
                              {syncingProvider === provider.id ? 'Syncing...' : 'Sync with Stripe'}
                            </button>
                          )}

                          {/* Cancel */}
                          <button
                            onClick={() => setEditingProvider(null)}
                            className="w-full text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300"
                          >
                            Done
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
              No providers found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
