'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type CareSeeker = {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  preferred_city: string
  preferred_zip: string
  waiver_type: string
  urgency: string
  special_requirements: string
  status: string
  created_at: string
}

export default function AdminCareSeekers() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [careSeekers, setCareSeekers] = useState<CareSeeker[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedCareSeeker, setSelectedCareSeeker] = useState<CareSeeker | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  
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

      // Only check admin_users table
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

      await loadCareSeekers()
    } catch (error) {
      console.error('Error:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadCareSeekers = async () => {
    try {
      const { data, error } = await supabase
        .from('care_seekers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCareSeekers(data || [])
    } catch (error) {
      console.error('Error loading care seekers:', error)
    }
  }

  const updateCareSeekerStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('care_seekers')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      alert('Status updated successfully')
      await loadCareSeekers()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const deleteCareSeeker = async (id: string) => {
    if (!confirm('Are you sure you want to delete this care seeker record? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('care_seekers')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Care seeker deleted successfully')
      await loadCareSeekers()
      setShowDetails(false)
    } catch (error) {
      console.error('Error deleting care seeker:', error)
      alert('Failed to delete care seeker')
    }
  }

  const filteredCareSeekers = careSeekers.filter(cs => {
    const matchesSearch = 
      cs.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cs.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cs.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cs.phone?.includes(searchTerm)
    
    const matchesStatus = filterStatus === 'all' || cs.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

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
            <h1 className="text-2xl font-bold text-gray-900">Manage Care Seekers</h1>
            <Link href="/admin" className="text-blue-600 hover:text-blue-800">
              ← Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold">{careSeekers.length}</div>
            <div className="text-sm text-gray-600">Total Care Seekers</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {careSeekers.filter(cs => cs.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {careSeekers.filter(cs => cs.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">
              {careSeekers.filter(cs => cs.status === 'matched').length}
            </div>
            <div className="text-sm text-gray-600">Matched</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="matched">Matched</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Care Seekers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waiver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCareSeekers.map((careSeeker) => (
                  <tr key={careSeeker.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {careSeeker.first_name} {careSeeker.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{careSeeker.email}</div>
                      <div className="text-sm text-gray-500">{careSeeker.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {careSeeker.preferred_city || 'Not specified'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {careSeeker.preferred_zip || 'No ZIP'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {careSeeker.waiver_type || 'None'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={careSeeker.status || 'pending'}
                        onChange={(e) => updateCareSeekerStatus(careSeeker.id, e.target.value)}
                        className={`text-sm rounded-full px-3 py-1 font-semibold ${
                          careSeeker.status === 'active' ? 'bg-green-100 text-green-800' :
                          careSeeker.status === 'matched' ? 'bg-blue-100 text-blue-800' :
                          careSeeker.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="matched">Matched</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(careSeeker.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedCareSeeker(careSeeker)
                          setShowDetails(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => deleteCareSeeker(careSeeker.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCareSeekers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No care seekers found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedCareSeeker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Care Seeker Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900">{selectedCareSeeker.first_name} {selectedCareSeeker.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedCareSeeker.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{selectedCareSeeker.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="text-gray-900">{selectedCareSeeker.status || 'pending'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Preferred City</label>
                    <p className="text-gray-900">{selectedCareSeeker.preferred_city || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Preferred ZIP</label>
                    <p className="text-gray-900">{selectedCareSeeker.preferred_zip || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Waiver Type</label>
                    <p className="text-gray-900">{selectedCareSeeker.waiver_type || 'None'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Urgency Level</label>
                    <p className="text-gray-900">{selectedCareSeeker.urgency || 'Not specified'}</p>
                  </div>
                </div>

                {selectedCareSeeker.special_requirements && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Special Requirements</label>
                    <p className="text-gray-900 mt-1">{selectedCareSeeker.special_requirements}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Registration Date</label>
                  <p className="text-gray-900">
                    {new Date(selectedCareSeeker.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => deleteCareSeeker(selectedCareSeeker.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Care Seeker
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}