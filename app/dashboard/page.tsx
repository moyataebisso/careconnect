import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user's provider listing
  const { data: provider } = await supabase
    .from('providers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get referral requests for this provider
  let referralCount = 0
  if (provider) {
    const { count } = await supabase
      .from('referral_requests')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', provider.id)
      .eq('status', 'new')
    
    referralCount = count || 0
  }

  return (
    <div className="container mx-auto px-4 pt-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2">
          Welcome back, {profile?.full_name || provider?.contact_person || 'Provider'}!
        </h2>
        <p className="text-gray-600">Manage your listing and view referral requests from here.</p>
        
        {provider && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Your Listing Status:</strong> {' '}
              <span className={`font-semibold ${
                provider.status === 'active' ? 'text-green-600' : 
                provider.status === 'pending' ? 'text-yellow-600' : 
                'text-gray-600'
              }`}>
                {provider.status === 'active' ? 'Active ✓' : 
                 provider.status === 'pending' ? 'Pending Approval' : 
                 provider.status}
              </span>
            </p>
            {provider.status === 'pending' && (
              <p className="text-xs text-blue-600 mt-1">
                Your listing is under review. We will notify you once approved (usually within 24-48 hours).
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {!provider ? (
          <Link href="/dashboard/create-listing" className="bg-orange-600 text-white rounded-lg p-6 hover:bg-orange-700 transition-colors">
            <h3 className="text-lg font-semibold mb-2">Create Your Listing</h3>
            <p>Set up your provider profile</p>
          </Link>
        ) : (
          <Link href="/dashboard/profile" className="bg-orange-600 text-white rounded-lg p-6 hover:bg-orange-700 transition-colors">
            <h3 className="text-lg font-semibold mb-2">Edit Your Listing</h3>
            <p>Update your facility information</p>
          </Link>
        )}
        
        <Link href="/dashboard/inquiries" className="bg-blue-900 text-white rounded-lg p-6 hover:bg-blue-800 transition-colors relative">
          <h3 className="text-lg font-semibold mb-2">View Inquiries</h3>
          <p>Check referral requests</p>
          {referralCount > 0 && (
            <span className="absolute top-4 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {referralCount} new
            </span>
          )}
        </Link>
        
        <Link href="/dashboard/availability" className="bg-gray-700 text-white rounded-lg p-6 hover:bg-gray-600 transition-colors">
          <h3 className="text-lg font-semibold mb-2">Update Availability</h3>
          <p>Manage your capacity</p>
        </Link>
      </div>

      {/* Provider Details */}
      {provider && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Your Listing Details</h2>
          </div>
          
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Business Name:</strong> {provider.business_name}</p>
                  <p><strong>License Number:</strong> {provider.license_number}</p>
                  <p><strong>Location:</strong> {provider.city}, MN {provider.zip_code}</p>
                  <p><strong>Contact:</strong> {provider.contact_phone}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Capacity Status</h3>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Current Occupancy</span>
                      <span>{provider.current_capacity} / {provider.total_capacity}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          provider.current_capacity >= provider.total_capacity ? 'bg-red-500' :
                          provider.current_capacity >= provider.total_capacity * 0.75 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(provider.current_capacity / provider.total_capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {provider.total_capacity - provider.current_capacity} spots available
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t flex gap-4">
              <Link 
                href={`/providers/${provider.id}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Public Listing →
              </Link>
              <Link 
                href="/dashboard/profile"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Edit Details →
              </Link>
            </div>
          </div>
        </div>
      )}

      {!provider && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center mb-8">
          <h3 className="text-lg font-semibold mb-2">No Provider Listing Yet</h3>
          <p className="text-gray-700 mb-4">
            You have not created a provider listing yet. Set up your profile to start receiving referrals.
          </p>
          <Link 
            href="/dashboard/create-listing"
            className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
          >
            Create Your Listing
          </Link>
        </div>
      )}
    </div>
  )
}