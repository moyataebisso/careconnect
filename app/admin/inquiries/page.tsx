'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

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
  providers: { business_name: string } | null
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; inquiries: Inquiry[] }

export default function AdminInquiriesPage() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'contacted' | 'resolved'>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const loadInquiries = useCallback(async () => {
    setState({ kind: 'loading' })
    try {
      const res = await fetch('/api/admin/inquiries', { credentials: 'include' })
      const payload: unknown = await res.json().catch(() => ({}))

      if (res.status === 403) {
        setState({ kind: 'error', message: 'Access denied. Admin privileges required.' })
        return
      }
      if (!res.ok) {
        const message =
          typeof (payload as { error?: unknown })?.error === 'string'
            ? (payload as { error: string }).error
            : `Failed to load inquiries (HTTP ${res.status})`
        setState({ kind: 'error', message })
        return
      }
      const inquiries = Array.isArray((payload as { data?: unknown })?.data)
        ? ((payload as { data: Inquiry[] }).data)
        : []
      setState({ kind: 'ready', inquiries })
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Network error loading inquiries',
      })
    }
  }, [])

  useEffect(() => {
    loadInquiries()
  }, [loadInquiries])

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id)
    setUpdateError(null)
    try {
      const res = await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status: newStatus }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || payload?.success === false) {
        const message =
          typeof payload?.error === 'string'
            ? payload.error
            : `Failed to update inquiry (HTTP ${res.status})`
        setUpdateError(message)
        return
      }
      await loadInquiries()
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Network error updating inquiry')
    } finally {
      setUpdating(null)
    }
  }

  if (state.kind === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Provider Inquiries</h1>
            <Link href="/admin" className="text-blue-600 hover:text-blue-800">← Back to Admin</Link>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Couldn't load inquiries</h2>
            <p className="text-sm text-red-700 mb-4">{state.message}</p>
            <button
              onClick={loadInquiries}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const inquiries = state.inquiries
  const filteredInquiries = inquiries.filter((inq) => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'new') return inq.status === 'new' || !inq.status
    return inq.status === filterStatus
  })

  const countByStatus = (status: string) => {
    if (status === 'new') return inquiries.filter((i) => i.status === 'new' || !i.status).length
    return inquiries.filter((i) => i.status === status).length
  }

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
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Provider Inquiries</h1>
            <Link href="/admin" className="text-blue-600 hover:text-blue-800">← Back to Admin</Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {updateError && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {updateError}
          </div>
        )}

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

        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2">
            <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              All ({inquiries.length})
            </button>
            <button onClick={() => setFilterStatus('new')} className={`px-4 py-2 rounded ${filterStatus === 'new' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              New ({countByStatus('new')})
            </button>
            <button onClick={() => setFilterStatus('contacted')} className={`px-4 py-2 rounded ${filterStatus === 'contacted' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              Contacted ({countByStatus('contacted')})
            </button>
            <button onClick={() => setFilterStatus('resolved')} className={`px-4 py-2 rounded ${filterStatus === 'resolved' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              Resolved ({countByStatus('resolved')})
            </button>
          </div>
        </div>

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
