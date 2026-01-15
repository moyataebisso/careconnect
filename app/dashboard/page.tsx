import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PaymentRequiredOverlay from '@/components/PaymentRequiredOverlay'

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
    redirect('/auth/register')
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

  // Determine subscription status - no trial, only active or requires payment
  const getSubscriptionStatus = () => {
    const status = provider.subscription_status

    if (status === 'active') {
      return { status: 'active', hasAccess: true, requiresPayment: false }
    }

    // All other statuses require payment (no more trial)
    return { status: 'inactive', hasAccess: false, requiresPayment: true }
  }

  const subscriptionStatus = getSubscriptionStatus()

  return (
    <>
      {/* Payment Required Overlay - shows on top of dashboard when not subscribed */}
      {subscriptionStatus.requiresPayment && (
        <PaymentRequiredOverlay businessName={provider.business_name} />
      )}

      <div className="container mx-auto px-4 pt-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Subscription Status Section - Show if HAS active subscription */}
        {subscriptionStatus.hasAccess && (
          <div className="rounded-lg p-6 mb-6 bg-green-50 border-2 border-green-300">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold mb-2">
                  Subscription Status: {' '}
                  <span className="text-green-600">Active</span>
                </h2>

                <div className="space-y-1 text-sm">
                  {provider.subscription_plans && (
                    <p><strong>Plan:</strong> {provider.subscription_plans.name} - ${provider.subscription_plans.price}/month</p>
                  )}

                  {provider.subscription_end_date && new Date(provider.subscription_end_date).getFullYear() > 2090 ? (
                    <p className="text-green-700">
                      <strong>Grandfathered Account</strong> - Lifetime access as an early supporter!
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
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {!provider.subscription_end_date?.includes('2099') && (
                  <Link
                    href="/billing"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold"
                  >
                    Manage Billing
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2">
          Welcome back, {profile?.full_name || provider?.contact_person || provider?.contact_name || 'Provider'}!
        </h2>
        <p className="text-gray-600">Manage your listing and view referral requests from here.</p>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Your Listing Status:</strong> {' '}
            <span className={`font-semibold ${
              provider.status === 'active' && subscriptionStatus.hasAccess ? 'text-green-600' : 
              provider.status === 'pending' ? 'text-yellow-600' : 
              'text-gray-600'
            }`}>
              {!subscriptionStatus.hasAccess ? '🔒 Hidden (No Subscription)' :
               provider.status === 'active' ? 'Active & Visible ✓' : 
               provider.status === 'pending' ? 'Pending Approval' : 
               provider.status}
            </span>
          </p>
          {provider.status === 'pending' && (
            <p className="text-xs text-blue-600 mt-1">
              Your listing is under review. We will notify you once approved (usually within 24-48 hours).
            </p>
          )}
          {!subscriptionStatus.hasAccess && provider.status === 'active' && (
            <p className="text-xs text-orange-600 mt-1">
              Your listing is approved but hidden because you don&apos;t have an active subscription.
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
        
        <Link href="/dashboard/inquiries" className={`rounded-lg p-6 transition-colors relative ${
          subscriptionStatus.hasAccess 
            ? 'bg-blue-900 text-white hover:bg-blue-800' 
            : 'bg-gray-400 text-white cursor-not-allowed'
        }`}>
          <h3 className="text-lg font-semibold mb-2">View Inquiries</h3>
          <p>Check referral requests</p>
          {referralCount > 0 && subscriptionStatus.hasAccess && (
            <span className="absolute top-4 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {referralCount} new
            </span>
          )}
          {!subscriptionStatus.hasAccess && (
            <span className="absolute top-4 right-4 text-xs">🔒</span>
          )}
        </Link>
        
        <Link href="/dashboard/availability" className="bg-gray-700 text-white rounded-lg p-6 hover:bg-gray-600 transition-colors">
          <h3 className="text-lg font-semibold mb-2">Update Availability</h3>
          <p>Manage your capacity</p>
        </Link>
      </div>

      {/* Browse Other Providers - Always available */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Explore the Platform</h2>
        <p className="text-gray-600 mb-4">
          Browse other 245D providers on the platform to see how they present their services.
        </p>
        <Link 
          href="/browse" 
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Browse Providers →
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
            {subscriptionStatus.hasAccess ? (
              <Link 
                href={`/providers/${provider.id}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Public Listing →
              </Link>
            ) : (
              <span className="text-gray-400 text-sm">
                🔒 Public listing hidden (subscription required)
              </span>
            )}
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
    </>
  )
}