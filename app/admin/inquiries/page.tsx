'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Inquiry {
  id: string
  client_name: string
  client_email: string
  client_phone: string | null
  provider_id: string | null
  urgency: string | null
  service_types_needed: string[] | null
  special_requirements: string | null
  status: string | null
  created_at: string | null
  updated_at: string | null
  providers: {
    business_name: string
  } | null
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'contacted' | 'resolved'>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

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

      await loadInquiries()
    } catch (error) {
      console.error('Error:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('referral_requests')
        .select('*, providers(business_name)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInquiries(data || [])
    } catch (error) {
      console.error('Error loading inquiries:', error)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id)
    try {
      const { error } = await supabase
        .from('referral_requests')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      await loadInquiries()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  const filteredInquiries = inquiries.filter(inq => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'new') return inq.status === 'new' || !inq.status
    return inq.status === filterStatus
  })

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'contacted': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'new': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const countByStatus = (status: string) => {
    if (status === 'new') return inquiries.filter(i => i.status === 'new' || !i.status).length
    return inquiries.filter(i => i.status === status).length
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
            <h1 className="text-2xl font-bold">Provider Inquiries</h1>
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
            <div className="text-2xl font-bold">{inquiries.length}</div>
            <div className="text-sm text-gray-600">Total Inquiries</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">{countByStatus('new')}</div>
            <div className="text-sm text-gray-600">New</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{countByStatus('contacted')}</div>
            <div className="text-sm text-gray-600">Contacted</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{countByStatus('resolved')}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded ${
                filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              All ({inquiries.length})
            </button>
            <button
              onClick={() => setFilterStatus('new')}
              className={`px-4 py-2 rounded ${
                filterStatus === 'new' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              New ({countByStatus('new')})
            </button>
            <button
              onClick={() => setFilterStatus('contacted')}
              className={`px-4 py-2 rounded ${
                filterStatus === 'contacted' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Contacted ({countByStatus('contacted')})
            </button>
            <button
              onClick={() => setFilterStatus('resolved')}
              className={`px-4 py-2 rounded ${
                filterStatus === 'resolved' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Resolved ({countByStatus('resolved')})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Client Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Provider Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Urgency</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Care Needs</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      No inquiries found
                    </td>
                  </tr>
                ) : (
                  filteredInquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(inquiry.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {inquiry.client_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <a href={`mailto:${inquiry.client_email}`} className="text-blue-600 hover:underline">
                          {inquiry.client_email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {inquiry.client_phone || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {inquiry.providers?.business_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {inquiry.urgency ? (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            inquiry.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
                            inquiry.urgency === 'soon' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {inquiry.urgency}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                        {inquiry.service_types_needed?.join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(inquiry.status)}`}>
                          {inquiry.status || 'new'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <div className="flex gap-1">
                          {inquiry.status !== 'contacted' && (
                            <button
                              onClick={() => updateStatus(inquiry.id, 'contacted')}
                              disabled={updating === inquiry.id}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {updating === inquiry.id ? '...' : 'Contacted'}
                            </button>
                          )}
                          {inquiry.status !== 'resolved' && (
                            <button
                              onClick={() => updateStatus(inquiry.id, 'resolved')}
                              disabled={updating === inquiry.id}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              {updating === inquiry.id ? '...' : 'Resolved'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
