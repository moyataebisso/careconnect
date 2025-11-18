import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { checkProviderSubscription } from '@/lib/subscription/middleware'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's provider listing with subscription plan details
  const { data: provider } = await supabase
    .from('providers')
    .select(`
      *,
      subscription_plans (
        name,
        price
      )
    `)
    .eq('user_id', user.id)
    .single()

  // If no provider, redirect to create one
  if (!provider) {
    redirect('/auth/register-provider')
  }

  // Check provider subscription status
  const subscriptionStatus = await checkProviderSubscription(user.id)
  
  if (!subscriptionStatus.hasAccess) {
    redirect('/subscribe')
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get referral requests for this provider
  let referralCount = 0
  const { count } = await supabase
    .from('referral_requests')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', provider.id)
    .eq('status', 'new')
  
  referralCount = count || 0

  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="container mx-auto px-4 pt-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {/* Subscription Status Section - More Prominent */}
      <div className={`rounded-lg p-6 mb-6 ${
        subscriptionStatus.status === 'trial' 
          ? 'bg-yellow-50 border-2 border-yellow-300' 
          : subscriptionStatus.status === 'active' 
          ? 'bg-green-50 border-2 border-green-300'
          : 'bg-red-50 border-2 border-red-300'
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold mb-2">
              Subscription Status: {' '}
              <span className={
                subscriptionStatus.status === 'active' ? 'text-green-600' :
                subscriptionStatus.status === 'trial' ? 'text-yellow-600' :
                'text-red-600'
              }>
                {subscriptionStatus.status === 'active' ? 'Active ✓' :
                 subscriptionStatus.status === 'trial' ? `Trial (${subscriptionStatus.trialDaysLeft} days left)` :
                 'Expired'}
              </span>
            </h2>
            
            <div className="space-y-1 text-sm">
              {provider.subscription_plans && (
                <p><strong>Plan:</strong> {provider.subscription_plans.name} - ${provider.subscription_plans.price}/month</p>
              )}
              
              {subscriptionStatus.status === 'trial' && (
                <>
                  <p><strong>Trial Ends:</strong> {formatDate(provider.trial_ends_at)}</p>
                  <p className="text-yellow-700 mt-2">
                    ⏰ Your free trial expires in {subscriptionStatus.trialDaysLeft} days. 
                    Subscribe now to keep your listing active.
                  </p>
                </>
              )}
              
              {subscriptionStatus.status === 'active' && (
                <>
                  {provider.subscription_end_date && new Date(provider.subscription_end_date).getFullYear() > 2090 ? (
                    <p className="text-green-700">
                      ✨ <strong>Grandfathered Account</strong> - Lifetime access as an early supporter!
                    </p>
                  ) : (
                    <>
                      <p><strong>Subscription Started:</strong> {formatDate(provider.subscription_start_date)}</p>
                      <p><strong>Next Billing Date:</strong> {formatDate(provider.subscription_end_date)}</p>
                      {provider.stripe_subscription_id && (
                        <p className="text-xs text-gray-600 mt-1">
                          Subscription ID: {provider.stripe_subscription_id}
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {subscriptionStatus.status === 'trial' && (
              <Link 
                href="/subscribe" 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-semibold"
              >
                Upgrade Now →
              </Link>
            )}
            
            {subscriptionStatus.status === 'active' && !provider.subscription_end_date?.includes('2099') && (
              <Link 
                href="/billing" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold"
              >
                Manage Billing →
              </Link>
            )}
            
            {subscriptionStatus.status === 'expired' && (
              <Link 
                href="/subscribe" 
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-semibold"
              >
                Reactivate Subscription →
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2">
          Welcome back, {profile?.full_name || provider?.contact_person || 'Provider'}!
        </h2>
        <p className="text-gray-600">Manage your listing and view referral requests from here.</p>
        
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
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Link href="/dashboard/profile" className="bg-orange-600 text-white rounded-lg p-6 hover:bg-orange-700 transition-colors">
          <h3 className="text-lg font-semibold mb-2">Edit Your Listing</h3>
          <p>Update your facility information</p>
        </Link>
        
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
    </div>
  )
}