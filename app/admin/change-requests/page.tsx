'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ChangeRequest {
  id: string
  request_type: string
  priority: string
  description: string
  status: string
  admin_notes?: string
  created_at: string
  updated_at?: string
}

export default function ChangeRequestsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<ChangeRequest[]>([])
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    request_type: 'feature',
    priority: 'medium',
    description: '',
  })

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/change-requests/list')
      const json = await res.json()
      if (json.data) setRequests(json.data)
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }, [])

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!adminUser?.role) {
        alert('Access denied. Admin privileges required.')
        router.push('/dashboard')
        return
      }

      await fetchRequests()
      setLoading(false)
    }
    checkAdmin()
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchRequests, 30000)
    return () => clearInterval(interval)
  }, [fetchRequests])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/change-requests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        setForm({ request_type: 'feature', priority: 'medium', description: '' })
        setShowForm(false)
        await fetchRequests()
      } else {
        alert(json.error || 'Failed to submit request')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    }
    return styles[priority] || 'bg-gray-100 text-gray-700'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Change Requests &mdash; CareConnect</h1>
            <Link href="/admin" className="text-blue-600 hover:text-blue-800">
              &larr; Back to Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Toggle New Request Form */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancel' : '+ New Request'}
          </button>
        </div>

        {/* New Request Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Submit Change Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Request Type
                  </label>
                  <select
                    value={form.request_type}
                    onChange={(e) => setForm({ ...form, request_type: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="feature">New Feature</option>
                    <option value="bug">Bug Fix</option>
                    <option value="update">Content Update</option>
                    <option value="design">Design Change</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Describe the change you'd like..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}

        {/* Requests List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Past Requests</h2>
          </div>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No change requests yet. Submit your first one above.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {requests.map((req) => (
                <div key={req.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(req.status)}`}>
                          {req.status.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(req.priority)}`}>
                          {req.priority}
                        </span>
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          {req.request_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-gray-900">{req.description}</p>
                      {req.admin_notes && (
                        <p className="text-sm text-blue-600 mt-2">
                          <span className="font-medium">Admin notes:</span> {req.admin_notes}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 ml-4 whitespace-nowrap">
                      {formatDate(req.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
