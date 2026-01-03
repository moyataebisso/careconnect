// File: /app/api/admin/sync-stripe/route.ts
// Install at: app/api/admin/sync-stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get provider ID from request
    const { providerId } = await request.json()
    
    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 })
    }

    // Use admin client for database operations
    const adminSupabase = createAdminClient()

    // Get provider's Stripe customer ID
    const { data: provider, error: providerError } = await adminSupabase
      .from('providers')
      .select('id, business_name, stripe_customer_id, subscription_status')
      .eq('id', providerId)
      .single()

    if (providerError || !provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    if (!provider.stripe_customer_id) {
      return NextResponse.json({ 
        error: 'No Stripe customer ID for this provider',
        provider: provider.business_name 
      }, { status: 400 })
    }

    // Initialize Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    })

    // Get all subscriptions for this customer from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: provider.stripe_customer_id,
      limit: 10,
    })

    console.log(`Found ${subscriptions.data.length} subscriptions for customer ${provider.stripe_customer_id}`)

    if (subscriptions.data.length === 0) {
      // No subscriptions in Stripe - mark as expired if currently active
      if (provider.subscription_status === 'active') {
        await adminSupabase
          .from('providers')
          .update({
            subscription_status: 'expired',
            stripe_subscription_id: null,
          })
          .eq('id', providerId)

        return NextResponse.json({
          success: true,
          message: 'No active Stripe subscription found - marked as expired',
          provider: provider.business_name,
          stripeStatus: 'none',
          dbStatus: 'expired'
        })
      }
      
      return NextResponse.json({
        success: true,
        message: 'No Stripe subscriptions found',
        provider: provider.business_name,
        stripeStatus: 'none',
        dbStatus: provider.subscription_status
      })
    }

    // Find the most recent active or trialing subscription
    const activeSubscription = subscriptions.data.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    ) || subscriptions.data[0] // Fall back to most recent

    // Map Stripe status to your database status
    const statusMap: Record<string, string> = {
      'active': 'active',
      'trialing': 'trial',
      'past_due': 'past_due',
      'canceled': 'expired',
      'unpaid': 'expired',
      'incomplete': 'past_due',
      'incomplete_expired': 'expired',
      'paused': 'paused'
    }

    // Cast subscription to access properties (Stripe types are strict)
    const subData = activeSubscription as unknown as {
      id: string
      status: string
      current_period_end: number | null
      current_period_start: number | null
      trial_end: number | null
      items: { data: Array<{ price: { id: string } }> }
    }

    console.log('Subscription data:', {
      id: subData.id,
      status: subData.status,
      current_period_end: subData.current_period_end,
      current_period_start: subData.current_period_start,
    })

    const newStatus = statusMap[subData.status] || 'expired'
    
    // Handle potentially null dates
    const periodEnd = subData.current_period_end 
      ? new Date(subData.current_period_end * 1000).toISOString()
      : null
    const periodStart = subData.current_period_start
      ? new Date(subData.current_period_start * 1000).toISOString()
      : new Date().toISOString()

    // Get plan ID from price
    const priceId = subData.items.data[0]?.price.id
    let planId = null
    
    if (priceId) {
      const { data: plan } = await adminSupabase
        .from('subscription_plans')
        .select('id')
        .eq('stripe_price_id', priceId)
        .single()
      
      planId = plan?.id || null
    }

    // Update provider in database
    const { error: updateError } = await adminSupabase
      .from('providers')
      .update({
        subscription_status: newStatus,
        stripe_subscription_id: subData.id,
        subscription_start_date: periodStart,
        subscription_end_date: periodEnd,
        subscription_plan_id: planId,
        trial_ends_at: subData.status === 'trialing' && subData.trial_end 
          ? new Date(subData.trial_end * 1000).toISOString() 
          : null,
      })
      .eq('id', providerId)

    if (updateError) {
      console.error('Error updating provider:', updateError)
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Synced successfully',
      provider: provider.business_name,
      stripeStatus: subData.status,
      stripeSubscriptionId: subData.id,
      dbStatus: newStatus,
      periodEnd: periodEnd
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ 
      error: 'Sync failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Also support syncing ALL providers at once
export async function PUT(request: NextRequest) {
  try {
    // Check if user is admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Use admin client for database operations
    const adminSupabase = createAdminClient()

    // Get all providers with Stripe customer IDs
    const { data: providers, error: providersError } = await adminSupabase
      .from('providers')
      .select('id, business_name, stripe_customer_id')
      .not('stripe_customer_id', 'is', null)

    if (providersError || !providers) {
      return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 })
    }

    if (providers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No providers with Stripe accounts to sync',
        synced: 0 
      })
    }

    // Initialize Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    })

    const results: Array<{provider: string, status: string, error?: string}> = []

    for (const provider of providers) {
      try {
        console.log(`Syncing provider: ${provider.business_name} (${provider.stripe_customer_id})`)
        
        const subscriptions = await stripe.subscriptions.list({
          customer: provider.stripe_customer_id!,
          limit: 5,
        })

        console.log(`Found ${subscriptions.data.length} subscriptions`)

        if (subscriptions.data.length === 0) {
          results.push({ provider: provider.business_name, status: 'no_subscription' })
          continue
        }

        const activeSubscription = subscriptions.data.find(
          sub => sub.status === 'active' || sub.status === 'trialing'
        ) || subscriptions.data[0]

        console.log('Active subscription:', {
          id: activeSubscription.id,
          status: activeSubscription.status,
        })

        // Cast subscription to access properties
        const subData = activeSubscription as unknown as {
          id: string
          status: string
          current_period_end: number | null
          current_period_start: number | null
          trial_end: number | null
        }

        const statusMap: Record<string, string> = {
          'active': 'active',
          'trialing': 'trial',
          'past_due': 'past_due',
          'canceled': 'expired',
          'unpaid': 'expired',
          'incomplete': 'past_due',
          'incomplete_expired': 'expired',
          'paused': 'paused'
        }

        const newStatus = statusMap[subData.status] || 'expired'
        const periodEnd = subData.current_period_end
          ? new Date(subData.current_period_end * 1000).toISOString()
          : null
        const periodStart = subData.current_period_start
          ? new Date(subData.current_period_start * 1000).toISOString()
          : new Date().toISOString()

        await adminSupabase
          .from('providers')
          .update({
            subscription_status: newStatus,
            stripe_subscription_id: subData.id,
            subscription_start_date: periodStart,
            subscription_end_date: periodEnd,
            trial_ends_at: subData.status === 'trialing' && subData.trial_end 
              ? new Date(subData.trial_end * 1000).toISOString() 
              : null,
          })
          .eq('id', provider.id)

        results.push({ 
          provider: provider.business_name, 
          status: `synced: ${subData.status} → ${newStatus}` 
        })

      } catch (err) {
        results.push({ 
          provider: provider.business_name, 
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${results.filter(r => r.status.startsWith('synced')).length} of ${providers.length} providers`,
      results
    })

  } catch (error) {
    console.error('Bulk sync error:', error)
    return NextResponse.json({ 
      error: 'Bulk sync failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}