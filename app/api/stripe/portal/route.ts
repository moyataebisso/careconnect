// app/api/stripe/portal/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // Check for Stripe key at runtime
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key not configured')
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Dynamic import Stripe
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get provider's Stripe customer ID
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('stripe_customer_id, stripe_subscription_id, subscription_status')
      .eq('user_id', user.id)
      .single()

    if (providerError || !provider) {
      console.error('Provider not found:', providerError)
      return NextResponse.json({ 
        error: 'Provider account not found. Please contact support.' 
      }, { status: 404 })
    }

    // Check if provider has Stripe customer ID
    if (!provider.stripe_customer_id) {
      console.log('Provider has no Stripe customer ID, status:', provider.subscription_status)
      return NextResponse.json({ 
        error: 'No billing account found. Please subscribe first.',
        redirect: '/subscribe'
      }, { status: 400 })
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: provider.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    })

    console.log('Portal session created successfully for customer:', provider.stripe_customer_id)
    return NextResponse.json({ url: session.url })
    
  } catch (error) {
    console.error('Portal session error:', error)
    
    // Handle specific Stripe errors
    if (error instanceof Error) {
      if (error.message.includes('No such customer')) {
        return NextResponse.json(
          { error: 'Stripe customer not found. Please subscribe first.', redirect: '/subscribe' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create portal session. Please try again or contact support.' },
      { status: 500 }
    )
  }
}