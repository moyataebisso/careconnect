'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Provider {
  id: string
  business_name: string
  contact_person: string
  contact_email: string
  contact_phone: string
  address: string
  city: string
  zip_code: string
  status: string
  verified_245d: boolean
  current_capacity: number
  total_capacity: number
  created_at: string
  user_id: string
  trial_ends_at: string | null
  subscription_status: string | null
}

export default function AdminProvidersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [providers, setProviders] = useState<Provider[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all')
  const [sendingReminders, setSendingReminders] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndLoadProviders()
  }, [])

  const checkAdminAndLoadProviders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check admin access
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
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProviders(data || [])
    } catch (error) {
      console.error('Error loading providers:', error)
    }
  }

  // Helper function to send emails (non-blocking)
  const sendEmail = async (type: string, to: string, data: Record<string, string | number>) => {
    try {
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, to, data })
      })
      console.log(`Email sent: ${type} to ${to}`)
    } catch (emailError) {
      console.log(`Email failed (non-blocking): ${type}`, emailError)
    }
  }

  const updateProviderStatus = async (providerId: string, newStatus: string) => {
    try {
      // Find the provider to get their details
      const provider = providers.find(p => p.id === providerId)
      if (!provider) {
        alert('Provider not found')
        return
      }

      interface ProviderUpdate {
        status: string
        verified_245d?: boolean
        last_updated: string
        trial_ends_at?: string
        subscription_status?: string
      }

      const updates: ProviderUpdate = { 
        status: newStatus,
        last_updated: new Date().toISOString()
      }
      
      // If approving, also verify and start trial
      if (newStatus === 'active') {
        updates.verified_245d = true
        
        // Set trial to end 7 days from now
        const trialEndDate = new Date()
        trialEndDate.setDate(trialEndDate.getDate() + 7)
        updates.trial_ends_at = trialEndDate.toISOString()
        updates.subscription_status = 'trial'
      }

      const { error } = await supabase
        .from('providers')
        .update(updates)
        .eq('id', providerId)

      if (error) throw error

      // Send approval email if activating
      if (newStatus === 'active') {
        // Calculate trial end date for email
        const trialEndDate = new Date()
        trialEndDate.setDate(trialEndDate.getDate() + 7)
        const formattedTrialEnd = trialEndDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })

        sendEmail('provider_approved', provider.contact_email, {
          providerName: provider.contact_person,
          businessName: provider.business_name,
          trialEndDate: formattedTrialEnd
        })
      }
      
      await loadProviders()
      alert(`Provider ${newStatus === 'active' ? 'approved' : newStatus === 'suspended' ? 'suspended' : 'updated'} successfully`)
    } catch (error) {
      console.error('Error updating provider:', error)
      alert('Failed to update provider status')
    }
  }

  const deleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return
    
    try {
      const { error } = await supabase
        .from('providers')
        .delete()
        .eq('id', providerId)

      if (error) throw error
      
      await loadProviders()
      alert('Provider deleted successfully')
    } catch (error) {
      console.error('Error deleting provider:', error)
      alert('Failed to delete provider')
    }
  }

  // Manual trigger for trial reminder emails
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

  const filteredProviders = providers.filter(provider => {
    if (filter === 'all') return true
    return provider.status === filter
  })

  // Helper to format trial status
  const getTrialStatus = (provider: Provider) => {
    if (!provider.trial_ends_at) return null
    
    const trialEnd = new Date(provider.trial_ends_at)
    const now = new Date()
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (provider.subscription_status === 'active') {
      return { text: 'Subscribed', color: 'bg-green-100 text-green-800' }
    }
    
    if (daysLeft < 0) {
      return { text: 'Trial Expired', color: 'bg-red-100 text-red-800' }
    }
    
    if (daysLeft <= 3) {
      return { text: `${daysLeft} days left`, color: 'bg-orange-100 text-orange-800' }
    }
    
    return { text: `${daysLeft} days left`, color: 'bg-blue-100 text-blue-800' }
  }

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
            <h1 className="text-2xl font-bold">Manage Providers</h1>
            <div className="flex gap-4 items-center">
              <button
                onClick={sendTrialReminders}
                disabled={sendingReminders}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 text-sm"
              >
                {sendingReminders ? 'Sending...' : '📧 Send Trial Reminders'}
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
              {providers.filter(p => p.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {providers.filter(p => p.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending Approval</div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">
              {providers.filter(p => {
                if (!p.trial_ends_at) return false
                const daysLeft = Math.ceil((new Date(p.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                return daysLeft >= 0 && daysLeft <= 3 && p.subscription_status !== 'active'
              }).length}
            </div>
            <div className="text-sm text-gray-600">Trial Ending Soon</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">
              {providers.filter(p => p.status === 'suspended').length}
            </div>
            <div className="text-sm text-gray-600">Suspended</div>
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
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded ${
                filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Pending ({providers.filter(p => p.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded ${
                filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Active ({providers.filter(p => p.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('suspended')}
              className={`px-4 py-2 rounded ${
                filter === 'suspended' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Suspended ({providers.filter(p => p.status === 'suspended').length})
            </button>
          </div>
        </div>

        {/* Providers List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Business Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Contact</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Trial Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProviders.map((provider) => {
                const trialStatus = getTrialStatus(provider)
                return (
                  <tr key={provider.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{provider.business_name}</div>
                      <div className="text-sm text-gray-500">
                        Created {new Date(provider.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{provider.contact_person}</div>
                      <div className="text-sm text-gray-500">{provider.contact_email}</div>
                      <div className="text-sm text-gray-500">{provider.contact_phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{provider.address}</div>
                      <div className="text-sm text-gray-500">
                        {provider.city}, MN {provider.zip_code}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {trialStatus ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${trialStatus.color}`}>
                          {trialStatus.text}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No trial</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        provider.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : provider.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {provider.status}
                      </span>
                      {provider.verified_245d && (
                        <span className="ml-2 text-xs text-green-600">✓ Verified</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {provider.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateProviderStatus(provider.id, 'active')}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateProviderStatus(provider.id, 'suspended')}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {provider.status === 'active' && (
                          <button
                            onClick={() => updateProviderStatus(provider.id, 'suspended')}
                            className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                          >
                            Suspend
                          </button>
                        )}
                        {provider.status === 'suspended' && (
                          <button
                            onClick={() => updateProviderStatus(provider.id, 'active')}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Reactivate
                          </button>
                        )}
                        <Link
                          href={`/admin/providers/${provider.id}/edit`}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/providers/${provider.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => deleteProvider(provider.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
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