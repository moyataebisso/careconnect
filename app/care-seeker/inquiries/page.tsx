// app/care-seeker/inquiries/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Inquiry {
  id: string
  provider_id: string
  subject: string
  message: string
  status: 'pending' | 'read' | 'responded' | 'archived'
  provider_response?: string
  responded_at?: string
  is_read: boolean
  created_at: string
  updated_at: string
  providers: {
    business_name: string
    city: string
    state: string
    contact_phone?: string
    contact_email?: string
  }
}

export default function InquiriesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded' | 'archived'>('all')
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadInquiries()
  }, [])

  const loadInquiries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get care seeker profile
      const { data: careSeeker } = await supabase
        .from('care_seekers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!careSeeker) {
        router.push('/care-seeker/dashboard')
        return
      }

      // Load inquiries with provider details
      const { data, error } = await supabase
        .from('provider_inquiries')
        .select(`
          *,
          providers (
            business_name,
            city,
            state,
            contact_phone,
            contact_email
          )
        `)
        .eq('care_seeker_id', careSeeker.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setInquiries(data || [])
    } catch (error) {
      console.error('Error loading inquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async (inquiryId: string) => {
    try {
      const { error } = await supabase
        .from('provider_inquiries')
        .update({ 
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', inquiryId)

      if (error) throw error

      setInquiries(prev => 
        prev.map(inq => 
          inq.id === inquiryId 
            ? { ...inq, status: 'archived' as const }
            : inq
        )
      )
    } catch (error) {
      console.error('Error archiving inquiry:', error)
      alert('Failed to archive inquiry')
    }
  }

  const handleDelete = async (inquiryId: string) => {
    if (!confirm('Are you sure you want to delete this inquiry? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('provider_inquiries')
        .delete()
        .eq('id', inquiryId)

      if (error) throw error

      setInquiries(prev => prev.filter(inq => inq.id !== inquiryId))
      setSelectedInquiry(null)
    } catch (error) {
      console.error('Error deleting inquiry:', error)
      alert('Failed to delete inquiry')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      read: 'bg-blue-100 text-blue-800',
      responded: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    }
    return statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'
  }

  const filteredInquiries = inquiries.filter(inquiry => {
    if (filter === 'all') return true
    return inquiry.status === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Inquiries</h1>
              <p className="text-gray-600 mt-1">
                {inquiries.length} total inquiry{inquiries.length !== 1 ? 'ies' : ''}
              </p>
            </div>
            <Link 
              href="/care-seeker/dashboard"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-6">
            {(['all', 'pending', 'responded', 'archived'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`py-3 px-1 border-b-2 transition-colors capitalize ${
                  filter === status
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {status}
                {status === 'responded' && inquiries.filter(i => i.status === 'responded').length > 0 && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                    {inquiries.filter(i => i.status === 'responded').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {filteredInquiries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">
              {inquiries.length === 0 
                ? "You haven't sent any inquiries yet." 
                : `No ${filter === 'all' ? '' : filter} inquiries found.`}
            </p>
            <Link 
              href="/browse"
              className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Providers
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Inquiries List */}
            <div className="lg:col-span-1 space-y-4">
              {filteredInquiries.map((inquiry) => (
                <button
                  key={inquiry.id}
                  onClick={() => setSelectedInquiry(inquiry)}
                  className={`w-full text-left p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow ${
                    selectedInquiry?.id === inquiry.id ? 'ring-2 ring-green-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {inquiry.providers.business_name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(inquiry.status)}`}>
                      {inquiry.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{inquiry.subject}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(inquiry.created_at).toLocaleDateString()}
                  </p>
                  {inquiry.status === 'responded' && !inquiry.is_read && (
                    <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      New Response
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Inquiry Detail */}
            <div className="lg:col-span-2">
              {selectedInquiry ? (
                <div className="bg-white rounded-lg shadow p-6">
                  {/* Header */}
                  <div className="border-b pb-4 mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {selectedInquiry.providers.business_name}
                        </h2>
                        <p className="text-gray-600">
                          {selectedInquiry.providers.city}, {selectedInquiry.providers.state}
                        </p>
                      </div>
                      <span className={`text-sm px-3 py-1 rounded-full ${getStatusBadge(selectedInquiry.status)}`}>
                        {selectedInquiry.status}
                      </span>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Subject</h3>
                    <p className="text-gray-900">{selectedInquiry.subject}</p>
                  </div>

                  {/* Your Message */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Your Message</h3>
                    <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                      {selectedInquiry.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Sent on {new Date(selectedInquiry.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Provider Response */}
                  {selectedInquiry.provider_response && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Provider Response</h3>
                      <p className="text-gray-900 whitespace-pre-wrap bg-green-50 p-3 rounded">
                        {selectedInquiry.provider_response}
                      </p>
                      {selectedInquiry.responded_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          Responded on {new Date(selectedInquiry.responded_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Provider Contact Info (if responded) */}
                  {selectedInquiry.status === 'responded' && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Contact Information</h3>
                      {selectedInquiry.providers.contact_phone && (
                        <p className="text-sm text-gray-900">
                          Phone: <a href={`tel:${selectedInquiry.providers.contact_phone}`} className="text-blue-600 hover:text-blue-700">
                            {selectedInquiry.providers.contact_phone}
                          </a>
                        </p>
                      )}
                      {selectedInquiry.providers.contact_email && (
                        <p className="text-sm text-gray-900">
                          Email: <a href={`mailto:${selectedInquiry.providers.contact_email}`} className="text-blue-600 hover:text-blue-700">
                            {selectedInquiry.providers.contact_email}
                          </a>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Link
                      href={`/providers/${selectedInquiry.provider_id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Provider
                    </Link>
                    {selectedInquiry.status === 'responded' && (
                      <Link
                        href={`/care-seeker/contact/${selectedInquiry.provider_id}?followup=true`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Send Follow-up
                      </Link>
                    )}
                    {selectedInquiry.status !== 'archived' && (
                      <button
                        onClick={() => handleArchive(selectedInquiry.id)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Archive
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(selectedInquiry.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                  Select an inquiry to view details
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}