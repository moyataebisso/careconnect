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
  const [sendingReminders, setSendingReminders] = useState(false)
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

  // Send trial reminder emails
  const sendTrialReminders = async () => {
    if (!confirm('Send trial ending reminder emails to all providers with trials ending in 1-3 days?')) return
    
    setSendingReminders(true)
    try {
      const response = await fetch('/api/cron/trial-reminders?manual=true', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        alert(`Trial reminders sent!\n\nChecked: ${data.checked} providers\nEmails sent: ${data.emailsSent}`)
      } else {
        alert('Failed to send reminders: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error sending reminders:', error)
      alert('Failed to send trial reminders')
    } finally {
      setSendingReminders(false)
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

  const extendTrial = async (providerId: string, days: number) => {
    try {
      const now = new Date()
      const trialEnd = new Date(now.setDate(now.getDate() + days))

      const { error } = await supabase
        .from('providers')
        .update({
          subscription_status: 'trial',
          trial_ends_at: trialEnd.toISOString()
        })
        .eq('id', providerId)

      if (error) throw error
      
      await loadProviders()
      alert(`Trial extended by ${days} days`)
    } catch (error) {
      console.error('Error extending trial:', error)
      alert('Failed to extend trial')
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

  // Count providers with trials ending soon (1-3 days)
  const trialsEndingSoon = providers.filter(p => {
    if (p.subscription_status !== 'trial' || !p.trial_ends_at) return false
    const daysLeft = getDaysRemaining(p.trial_ends_at)
    return daysLeft >= 0 && daysLeft <= 3
  }).length

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
            <div className="flex gap-4 items-center">
              <button
                onClick={sendTrialReminders}
                disabled={sendingReminders}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 text-sm flex items-center gap-2"
              >
                {sendingReminders ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    📧 Send Trial Reminders
                    {trialsEndingSoon > 0 && (
                      <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">
                        {trialsEndingSoon}
                      </span>
                    )}
                  </>
                )}
              </button>
              <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                ← Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold">{providers.length}</div>
            <div className="text-sm text-gray-600">Total Providers</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {providers.filter(p => p.subscription_status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Subscriptions</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {providers.filter(p => p.subscription_status === 'trial').length}
            </div>
            <div className="text-sm text-gray-600">On Trial</div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">
              {trialsEndingSoon}
            </div>
            <div className="text-sm text-gray-600">Trials Ending Soon</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">
              {providers.filter(p => p.subscription_status === 'expired').length}
            </div>
            <div className="text-sm text-gray-600">Expired</div>
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
              onClick={() => setFilter('trial')}
              className={`px-4 py-2 rounded ${
                filter === 'trial' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Trial ({providers.filter(p => p.subscription_status === 'trial').length})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded ${
                filter === 'expired' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Expired ({providers.filter(p => p.subscription_status === 'expired').length})
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
                const daysLeft = getDaysRemaining(provider.trial_ends_at)
                const isTrialEndingSoon = provider.subscription_status === 'trial' && daysLeft >= 0 && daysLeft <= 3
                
                return (
                  <tr key={provider.id} className={`hover:bg-gray-50 ${isTrialEndingSoon ? 'bg-orange-50' : ''}`}>
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
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        provider.subscription_status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : provider.subscription_status === 'trial'
                          ? isTrialEndingSoon 
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {provider.subscription_status}
                      </span>
                      {provider.subscription_status === 'trial' && provider.trial_ends_at && (
                        <div className={`text-xs mt-1 ${isTrialEndingSoon ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                          {daysLeft} days left
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div>Start: {formatDate(provider.subscription_start_date)}</div>
                        <div>End: {formatDate(provider.subscription_end_date)}</div>
                        {provider.trial_ends_at && (
                          <div className={isTrialEndingSoon ? 'text-orange-600 font-medium' : 'text-yellow-600'}>
                            Trial: {formatDate(provider.trial_ends_at)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {provider.stripe_customer_id ? (
                        <div className="text-xs">
                          <div className="font-mono text-gray-600 mb-1" title={provider.stripe_customer_id}>
                            {provider.stripe_customer_id.substring(0, 15)}...
                          </div>
                          {provider.stripe_subscription_id && (
                            <div className="font-mono text-gray-500" title={provider.stripe_subscription_id}>
                              {provider.stripe_subscription_id.substring(0, 15)}...
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
                            onClick={() => extendTrial(provider.id, 7)}
                            className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200"
                          >
                            Extend Trial +7 days
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