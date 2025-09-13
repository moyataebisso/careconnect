'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ContactSubmission {
  id: string
  name: string
  email: string
  phone?: string
  organization?: string
  role?: string
  message: string
  status?: string
  created_at: string
  responded_at?: string
  response_notes?: string
}

export default function AdminMessagesPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'responded' | 'archived'>('all')
  const [responseNotes, setResponseNotes] = useState('')
  const [updating, setUpdating] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkAdminAndLoadSubmissions()
  }, [])

  const checkAdminAndLoadSubmissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if user is admin
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

      await loadSubmissions()
    } catch (error) {
      console.error('Error:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (error) {
      console.error('Error loading submissions:', error)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(true)
    try {
      interface UpdateData {
        status: string
        updated_at: string
        responded_at?: string
        response_notes?: string
      }
      
      const updateData: UpdateData = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      }
      
      if (newStatus === 'responded' && responseNotes.trim()) {
        updateData.responded_at = new Date().toISOString()
        updateData.response_notes = responseNotes.trim()
      }

      const { error } = await supabase
        .from('contact_submissions')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      await loadSubmissions()
      setResponseNotes('')
      alert('Status updated successfully')
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const deleteSubmission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return
    
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await loadSubmissions()
      setSelectedSubmission(null)
      alert('Submission deleted successfully')
    } catch (error) {
      console.error('Error deleting submission:', error)
      alert('Failed to delete submission')
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    if (filterStatus === 'all') return true
    return sub.status === filterStatus
  })

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'new': return 'bg-yellow-100 text-yellow-800'
      case 'responded': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getRoleLabel = (role?: string) => {
    switch(role) {
      case 'provider': return 'Care Provider'
      case 'case_manager': return 'Case Manager'
      case 'social_worker': return 'Social Worker'
      case 'discharge_planner': return 'Discharge Planner'
      case 'family': return 'Family Member'
      case 'other': return 'Other'
      default: return 'Not specified'
    }
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
            <h1 className="text-2xl font-bold">Contact Form Messages</h1>
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
            <div className="text-2xl font-bold">{submissions.length}</div>
            <div className="text-sm text-gray-600">Total Messages</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {submissions.filter(s => s.status === 'new' || !s.status).length}
            </div>
            <div className="text-sm text-gray-600">New</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {submissions.filter(s => s.status === 'responded').length}
            </div>
            <div className="text-sm text-gray-600">Responded</div>
          </div>
          <div className="bg-gray-100 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-600">
              {submissions.filter(s => s.status === 'archived').length}
            </div>
            <div className="text-sm text-gray-600">Archived</div>
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
              All ({submissions.length})
            </button>
            <button
              onClick={() => setFilterStatus('new')}
              className={`px-4 py-2 rounded ${
                filterStatus === 'new' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              New ({submissions.filter(s => s.status === 'new' || !s.status).length})
            </button>
            <button
              onClick={() => setFilterStatus('responded')}
              className={`px-4 py-2 rounded ${
                filterStatus === 'responded' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Responded ({submissions.filter(s => s.status === 'responded').length})
            </button>
            <button
              onClick={() => setFilterStatus('archived')}
              className={`px-4 py-2 rounded ${
                filterStatus === 'archived' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              Archived ({submissions.filter(s => s.status === 'archived').length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Messages List */}
          <div className="col-span-5 bg-white rounded-lg shadow overflow-hidden">
            <div className="border-b p-4">
              <h2 className="font-semibold">Contact Submissions</h2>
              <p className="text-sm text-gray-600 mt-1">
                {submissions.filter(s => s.status === 'new' || !s.status).length} unread messages
              </p>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
              {filteredSubmissions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No messages found
                </div>
              ) : (
                filteredSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    onClick={() => setSelectedSubmission(submission)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedSubmission?.id === submission.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium">{submission.name}</div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(submission.status)}`}>
                        {submission.status || 'new'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">{submission.email}</div>
                    <div className="text-sm text-gray-700 truncate">{submission.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(submission.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message Details */}
          <div className="col-span-7 bg-white rounded-lg shadow">
            {selectedSubmission ? (
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="border-b p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedSubmission.name}</h3>
                      <p className="text-sm text-gray-600">{selectedSubmission.email}</p>
                      {selectedSubmission.phone && (
                        <p className="text-sm text-gray-600">{selectedSubmission.phone}</p>
                      )}
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(selectedSubmission.status)}`}>
                      {selectedSubmission.status || 'new'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Organization</label>
                      <p className="text-gray-900">{selectedSubmission.organization || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Role</label>
                      <p className="text-gray-900">{getRoleLabel(selectedSubmission.role)}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Message</label>
                      <p className="text-gray-900 whitespace-pre-wrap mt-2 bg-gray-50 p-4 rounded">
                        {selectedSubmission.message}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Submitted</label>
                      <p className="text-gray-900">{formatDate(selectedSubmission.created_at)}</p>
                    </div>

                    {selectedSubmission.responded_at && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Responded</label>
                        <p className="text-gray-900">{formatDate(selectedSubmission.responded_at)}</p>
                      </div>
                    )}

                    {selectedSubmission.response_notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Response Notes</label>
                        <p className="text-gray-900 mt-1 bg-blue-50 p-3 rounded">
                          {selectedSubmission.response_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t p-4 space-y-3">
                  {selectedSubmission.status !== 'responded' && (
                    <div>
                      <textarea
                        placeholder="Add response notes (optional)..."
                        value={responseNotes}
                        onChange={(e) => setResponseNotes(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(selectedSubmission.id, 'responded')}
                      disabled={updating || selectedSubmission.status === 'responded'}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Mark as Responded
                    </button>
                    <button
                      onClick={() => updateStatus(selectedSubmission.id, 'archived')}
                      disabled={updating}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => deleteSubmission(selectedSubmission.id)}
                      disabled={updating}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                    <a
                      href={`mailto:${selectedSubmission.email}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block text-center"
                    >
                      Send Email
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p>Select a message to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}