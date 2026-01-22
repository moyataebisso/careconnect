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
  subscription_status: string | null
  status: string
}

// Stripe payment link base URL
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/bJe5kw6Hof5na0d1NzbfO00'

export default function AdminEmailsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [providers, setProviders] = useState<Provider[]>([])
  const [activeTab, setActiveTab] = useState<'reminder' | 'custom'>('reminder')

  // Subscription reminder state
  const [selectedForReminder, setSelectedForReminder] = useState<string[]>([])
  const [sendingReminders, setSendingReminders] = useState(false)
  const [reminderResults, setReminderResults] = useState<{ provider: string; status: string }[]>([])

  // Custom email state
  const [selectedForCustom, setSelectedForCustom] = useState<string[]>([])
  const [customSubject, setCustomSubject] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [sendingCustom, setSendingCustom] = useState(false)
  const [customResults, setCustomResults] = useState<{ provider: string; status: string }[]>([])
  const [showPreview, setShowPreview] = useState(false)

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
        .select('id, business_name, contact_person, contact_email, subscription_status, status')
        .eq('status', 'active') // Only approved providers
        .order('business_name', { ascending: true })

      if (error) throw error
      setProviders(data || [])
    } catch (error) {
      console.error('Error loading providers:', error)
    }
  }

  // Filter providers needing payment (for reminder tab)
  const unpaidProviders = providers.filter(p =>
    p.subscription_status === 'pending' || !p.subscription_status
  )

  // All active providers (for custom email tab)
  const activeProviders = providers

  // Reminder tab handlers
  const toggleReminderSelection = (id: string) => {
    setSelectedForReminder(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const selectAllUnpaid = () => {
    setSelectedForReminder(unpaidProviders.map(p => p.id))
  }

  const clearReminderSelection = () => {
    setSelectedForReminder([])
  }

  const sendSubscriptionReminders = async () => {
    if (selectedForReminder.length === 0) {
      alert('Please select at least one provider')
      return
    }

    if (!confirm(`Send subscription reminder emails to ${selectedForReminder.length} provider(s)?`)) return

    setSendingReminders(true)
    setReminderResults([])

    const results: { provider: string; status: string }[] = []

    for (const providerId of selectedForReminder) {
      const provider = providers.find(p => p.id === providerId)
      if (!provider) continue

      try {
        const paymentLink = `${STRIPE_PAYMENT_LINK}?prefilled_email=${encodeURIComponent(provider.contact_email)}`

        const response = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'subscription_reminder',
            to: provider.contact_email,
            data: {
              providerName: provider.contact_person || 'Provider',
              businessName: provider.business_name,
              paymentLink
            }
          })
        })

        const data = await response.json()
        results.push({
          provider: provider.business_name,
          status: data.success ? 'Sent' : `Failed: ${data.error}`
        })
      } catch (error) {
        results.push({
          provider: provider.business_name,
          status: `Error: ${error instanceof Error ? error.message : 'Unknown'}`
        })
      }
    }

    setReminderResults(results)
    setSendingReminders(false)

    const successCount = results.filter(r => r.status === 'Sent').length
    alert(`Sent ${successCount} of ${results.length} reminder emails`)
  }

  // Custom email tab handlers
  const toggleCustomSelection = (id: string) => {
    setSelectedForCustom(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const selectAllActive = () => {
    setSelectedForCustom(activeProviders.map(p => p.id))
  }

  const selectOnlyUnpaid = () => {
    setSelectedForCustom(unpaidProviders.map(p => p.id))
  }

  const selectOnlyPaid = () => {
    setSelectedForCustom(providers.filter(p => p.subscription_status === 'active').map(p => p.id))
  }

  const clearCustomSelection = () => {
    setSelectedForCustom([])
  }

  const sendCustomEmails = async () => {
    if (selectedForCustom.length === 0) {
      alert('Please select at least one provider')
      return
    }

    if (!customSubject.trim()) {
      alert('Please enter a subject line')
      return
    }

    if (!customBody.trim()) {
      alert('Please enter a message body')
      return
    }

    if (!confirm(`Send custom email to ${selectedForCustom.length} provider(s)?`)) return

    setSendingCustom(true)
    setCustomResults([])

    const results: { provider: string; status: string }[] = []

    for (const providerId of selectedForCustom) {
      const provider = providers.find(p => p.id === providerId)
      if (!provider) continue

      try {
        const response = await fetch('/api/email/send-custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: provider.contact_email,
            subject: customSubject,
            body: customBody,
            providerName: provider.contact_person || 'Provider',
            businessName: provider.business_name
          })
        })

        const data = await response.json()
        results.push({
          provider: provider.business_name,
          status: data.success ? 'Sent' : `Failed: ${data.error}`
        })
      } catch (error) {
        results.push({
          provider: provider.business_name,
          status: `Error: ${error instanceof Error ? error.message : 'Unknown'}`
        })
      }
    }

    setCustomResults(results)
    setSendingCustom(false)

    const successCount = results.filter(r => r.status === 'Sent').length
    alert(`Sent ${successCount} of ${results.length} custom emails`)
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
            <h1 className="text-2xl font-bold">Email Management</h1>
            <Link href="/admin" className="text-blue-600 hover:text-blue-800">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold">{providers.length}</div>
            <div className="text-sm text-gray-600">Total Active Providers</div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow p-4 border-l-4 border-orange-500">
            <div className="text-2xl font-bold text-orange-600">{unpaidProviders.length}</div>
            <div className="text-sm text-gray-600">Pending Payment</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600">
              {providers.filter(p => p.subscription_status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Subscribers</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('reminder')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'reminder'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Subscription Reminders
                {unpaidProviders.length > 0 && (
                  <span className="ml-2 bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs">
                    {unpaidProviders.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'custom'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Custom Email Composer
              </button>
            </div>
          </div>

          {/* Subscription Reminder Tab */}
          {activeTab === 'reminder' && (
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Send Subscription Reminders</h3>
                <p className="text-gray-600 text-sm">
                  Send reminder emails to providers who haven't subscribed yet. The email includes a personalized payment link.
                </p>
              </div>

              {/* Selection buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={selectAllUnpaid}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                >
                  Select All ({unpaidProviders.length})
                </button>
                <button
                  onClick={clearReminderSelection}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                >
                  Clear Selection
                </button>
                <span className="ml-4 py-2 text-sm text-gray-600">
                  {selectedForReminder.length} selected
                </span>
              </div>

              {/* Provider list */}
              <div className="border rounded-lg max-h-96 overflow-y-auto mb-4">
                {unpaidProviders.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No providers with pending payment status found.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          <input
                            type="checkbox"
                            checked={selectedForReminder.length === unpaidProviders.length && unpaidProviders.length > 0}
                            onChange={() => selectedForReminder.length === unpaidProviders.length ? clearReminderSelection() : selectAllUnpaid()}
                            className="mr-2"
                          />
                          Select
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Business Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Contact</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {unpaidProviders.map((provider) => (
                        <tr key={provider.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedForReminder.includes(provider.id)}
                              onChange={() => toggleReminderSelection(provider.id)}
                            />
                          </td>
                          <td className="px-4 py-3 font-medium">{provider.business_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{provider.contact_person}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{provider.contact_email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Send button */}
              <button
                onClick={sendSubscriptionReminders}
                disabled={sendingReminders || selectedForReminder.length === 0}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {sendingReminders ? (
                  <>
                    <span className="animate-spin inline-block mr-2">⏳</span>
                    Sending...
                  </>
                ) : (
                  `Send Subscription Reminders (${selectedForReminder.length})`
                )}
              </button>

              {/* Results */}
              {reminderResults.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Results:</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {reminderResults.map((result, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{result.provider}</span>
                        <span className={result.status === 'Sent' ? 'text-green-600' : 'text-red-600'}>
                          {result.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Email Tab */}
          {activeTab === 'custom' && (
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Custom Email Composer</h3>
                <p className="text-gray-600 text-sm">
                  Send custom announcements or messages to selected providers. Your message will be wrapped in the professional CareConnect email template.
                </p>
              </div>

              {/* Selection buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={selectAllActive}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                >
                  Select All ({activeProviders.length})
                </button>
                <button
                  onClick={selectOnlyPaid}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                >
                  Select Paid Only
                </button>
                <button
                  onClick={selectOnlyUnpaid}
                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-sm"
                >
                  Select Unpaid Only
                </button>
                <button
                  onClick={clearCustomSelection}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                >
                  Clear Selection
                </button>
                <span className="ml-4 py-2 text-sm text-gray-600">
                  {selectedForCustom.length} selected
                </span>
              </div>

              {/* Provider list */}
              <div className="border rounded-lg max-h-64 overflow-y-auto mb-4">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        <input
                          type="checkbox"
                          checked={selectedForCustom.length === activeProviders.length && activeProviders.length > 0}
                          onChange={() => selectedForCustom.length === activeProviders.length ? clearCustomSelection() : selectAllActive()}
                          className="mr-2"
                        />
                        Select
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Business Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeProviders.map((provider) => (
                      <tr key={provider.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedForCustom.includes(provider.id)}
                            onChange={() => toggleCustomSelection(provider.id)}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium">{provider.business_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{provider.contact_email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            provider.subscription_status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {provider.subscription_status === 'active' ? 'Subscribed' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Email form */}
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Enter email subject..."
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
                  <textarea
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    placeholder="Enter your message... (Use blank lines to separate paragraphs)"
                    rows={8}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Use blank lines to separate paragraphs. The email will be personalized with each provider's name.
                  </p>
                </div>
              </div>

              {/* Preview and Send buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  {showPreview ? 'Hide Preview' : 'Preview Email'}
                </button>
                <button
                  onClick={sendCustomEmails}
                  disabled={sendingCustom || selectedForCustom.length === 0 || !customSubject.trim() || !customBody.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {sendingCustom ? (
                    <>
                      <span className="animate-spin inline-block mr-2">⏳</span>
                      Sending...
                    </>
                  ) : (
                    `Send Custom Email (${selectedForCustom.length})`
                  )}
                </button>
              </div>

              {/* Preview */}
              {showPreview && (
                <div className="mt-6 border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 font-medium text-sm">Email Preview</div>
                  <div className="p-4 bg-white">
                    <div className="max-w-xl mx-auto border rounded-lg overflow-hidden shadow-sm">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-blue-800 to-blue-500 text-white p-6 text-center">
                        <h1 className="text-2xl font-semibold">CareConnect</h1>
                        <p className="text-blue-100 text-sm mt-1">Minnesota's Trusted 245D Provider Network</p>
                      </div>
                      {/* Content */}
                      <div className="p-6">
                        <p className="mb-4">Dear [Provider Name],</p>
                        {customBody.split('\n\n').map((paragraph, index) => (
                          <p key={index} className="mb-4">{paragraph.replace(/\n/g, ' ')}</p>
                        ))}
                        <hr className="my-4" />
                        <p>Best regards,<br /><strong>The CareConnect Team</strong></p>
                      </div>
                      {/* Footer */}
                      <div className="bg-gray-50 p-4 text-center text-sm text-gray-600 border-t">
                        <p className="font-medium">CareConnect</p>
                        <p>Connecting Families with Quality Care</p>
                        <p className="mt-2">763-321-4542 | 763-355-0711</p>
                        <p>careconnectmkting@gmail.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              {customResults.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Results:</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {customResults.map((result, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{result.provider}</span>
                        <span className={result.status === 'Sent' ? 'text-green-600' : 'text-red-600'}>
                          {result.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
