import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership, getListingCount } from '@/lib/utils/membership'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get user's membership info
  const { profile, limits } = await getUserMembership(user.id)
  const listingCount = await getListingCount(user.id)

  // Calculate days left in membership
  const daysLeft = profile?.membership_expires_at 
    ? Math.ceil((new Date(profile.membership_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Provider Dashboard</h1>
      
      {/* Membership Status Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              Your Membership: {' '}
              <span className={`
                ${profile?.membership_tier === 'premium' ? 'text-purple-600' : ''}
                ${profile?.membership_tier === 'basic' ? 'text-blue-600' : ''}
                ${profile?.membership_tier === 'free' ? 'text-gray-600' : ''}
                capitalize
              `}>
                {profile?.membership_tier || 'Free'}
              </span>
            </h2>
            
            {profile?.membership_tier !== 'free' && daysLeft && daysLeft > 0 && (
              <p className="text-gray-600 mb-4">
                {daysLeft} days remaining
              </p>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500">Listings Used</p>
                <p className="text-2xl font-bold">
                  {listingCount} / {limits?.max_listings === -1 ? '∞' : limits?.max_listings || 1}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Monthly Inquiries</p>
                <p className="text-2xl font-bold">
                  {profile?.monthly_inquiries_used || 0} / {limits?.max_monthly_inquiries === -1 ? '∞' : limits?.max_monthly_inquiries || 10}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Photo Limit</p>
                <p className="text-2xl font-bold">
                  {limits?.max_photos_per_listing === -1 ? 'Unlimited' : `${limits?.max_photos_per_listing || 2} per listing`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Search Priority</p>
                <p className="text-2xl font-bold">
                  {profile?.membership_tier === 'premium' ? 'High ⬆️⬆️' : 
                   profile?.membership_tier === 'basic' ? 'Medium ⬆️' : 'Standard'}
                </p>
              </div>
            </div>
          </div>
          
          {profile?.membership_tier !== 'premium' && (
            <a 
              href="/pricing" 
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Upgrade Plan
            </a>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <a 
          href="/listings/create" 
          className={`${
            listingCount >= (limits?.max_listings ?? 1) && limits?.max_listings !== -1
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-orange-600 hover:bg-orange-700'
          } text-white rounded-lg p-6 transition-colors`}
        >
          <h3 className="text-lg font-semibold mb-2">Create New Listing</h3>
          <p className="text-sm">
            {listingCount >= (limits?.max_listings ?? 1) && limits?.max_listings !== -1
              ? 'Upgrade to add more listings'
              : 'Post a new facility or service'}
          </p>
        </a>
        
        <a 
          href="/dashboard/listings" 
          className="bg-blue-900 text-white rounded-lg p-6 hover:bg-blue-800 transition-colors"
        >
          <h3 className="text-lg font-semibold mb-2">Manage Listings</h3>
          <p className="text-sm">View and edit your active listings</p>
        </a>
        
        <a 
          href="/dashboard/inquiries" 
          className="bg-gray-700 text-white rounded-lg p-6 hover:bg-gray-600 transition-colors"
        >
          <h3 className="text-lg font-semibold mb-2">View Inquiries</h3>
          <p className="text-sm">
            {profile?.monthly_inquiries_used || 0} inquiries this month
          </p>
        </a>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded">
            <p className="text-3xl font-bold text-orange-600">{listingCount}</p>
            <p className="text-sm text-gray-600">Active Listings</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-600">Total Views</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <p className="text-3xl font-bold text-green-600">{profile?.monthly_inquiries_used || 0}</p>
            <p className="text-sm text-gray-600">Inquiries</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <p className="text-3xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-600">Saved</p>
          </div>
        </div>
      </div>
    </div>
  )
}