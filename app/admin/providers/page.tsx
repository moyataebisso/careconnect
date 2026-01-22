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
  subscription_status: string | null
}

export default function AdminProvidersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [providers, setProviders] = useState<Provider[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all')

  // Custom email modal state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [sendingCustomEmail, setSendingCustomEmail] = useState(false)

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
      }

      const updates: ProviderUpdate = {
        status: newStatus,
        last_updated: new Date().toISOString()
      }

      // If approving, also verify (subscription stays as pending until they pay)
      if (newStatus === 'active') {
        updates.verified_245d = true
      }

      const { error } = await supabase
        .from('providers')
        .update(updates)
        .eq('id', providerId)

      if (error) throw error

      // Send approval email if activating
      if (newStatus === 'active') {
        sendEmail('provider_approved', provider.contact_email, {
          providerName: provider.contact_person,
          businessName: provider.business_name,
          trialEndDate: '' // Not used anymore but kept for API compatibility
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

  // Open custom email modal for a specific provider
  const openEmailModal = (provider: Provider) => {
    setSelectedProvider(provider)
    setEmailSubject('')
    setEmailBody('')
    setShowEmailModal(true)
  }

  // Send custom email to selected provider
  const sendCustomEmail = async () => {
    if (!selectedProvider || !emailSubject.trim() || !emailBody.trim()) {
      alert('Please fill in both subject and message')
      return
    }

    setSendingCustomEmail(true)
    try {
      const response = await fetch('/api/email/send-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedProvider.contact_email,
          subject: emailSubject,
          body: emailBody,
          providerName: selectedProvider.contact_person,
          businessName: selectedProvider.business_name
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Email sent successfully to ${selectedProvider.contact_email}!`)
        setShowEmailModal(false)
        setSelectedProvider(null)
        setEmailSubject('')
        setEmailBody('')
      } else {
        alert('Failed to send email: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error sending custom email:', error)
      alert('Failed to send email')
    } finally {
      setSendingCustomEmail(false)
    }
  }

  const filteredProviders = providers.filter(provider => {
    if (filter === 'all') return true
    return provider.status === filter
  })

  // Helper to format subscription status
  const getSubscriptionStatus = (provider: Provider) => {
    if (provider.subscription_status === 'active') {
      return { text: 'Subscribed', color: 'bg-green-100 text-green-800' }
    }
    if (provider.subscription_status === 'pending') {
      return { text: 'Pending Payment', color: 'bg-orange-100 text-orange-800' }
    }
    if (provider.subscription_status === 'expired') {
      return { text: 'Expired', color: 'bg-red-100 text-red-800' }
    }
    return { text: 'No Subscription', color: 'bg-gray-100 text-gray-800' }
  }

  // Count providers needing payment
  const pendingPaymentCount = providers.filter(p =>
    p.subscription_status === 'pending' || !p.subscription_status
  ).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom Email Modal */}
      {showEmailModal && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Send Email to Provider</h2>
                <button 
                  onClick={() => setShowEmailModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="bg-gray-50 rounded p-3 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>To:</strong> {selectedProvider.contact_person} ({selectedProvider.contact_email})
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Business:</strong> {selectedProvider.business_name}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Enter your message..."
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The message will be wrapped in the CareConnect email template automatically.
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendCustomEmail}
                    disabled={sendingCustomEmail || !emailSubject.trim() || !emailBody.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sendingCustomEmail ? 'Sending...' : '📧 Send Email'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Manage Providers</h1>
            <div className="flex gap-3 items-center">
              <Link href="/admin/emails" className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 text-sm flex items-center gap-2">
                📧 Email Management
                {pendingPaymentCount > 0 && (
                  <span className="bg-white text-cyan-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {pendingPaymentCount}
                  </span>
                )}
              </Link>
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
              {pendingPaymentCount}
            </div>
            <div className="text-sm text-gray-600">Pending Payment</div>
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Subscription</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProviders.map((provider) => {
                const subscriptionStatus = getSubscriptionStatus(provider)
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
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${subscriptionStatus.color}`}>
                        {subscriptionStatus.text}
                      </span>
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
                      <div className="flex flex-wrap gap-2">
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
                        <button
                          onClick={() => openEmailModal(provider)}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          Email
                        </button>
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