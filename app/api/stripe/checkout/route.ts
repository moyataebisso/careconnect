// app/api/stripe/checkout/route.ts
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

    const { planId } = await request.json()
    
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

    // Get provider details
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id, business_name, contact_email, stripe_customer_id, subscription_plan_id')
      .eq('user_id', user.id)
      .single()

    if (providerError || !provider) {
      console.error('Provider not found:', providerError)
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // Get or create Stripe customer
    let customerId = provider.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: provider.contact_email || user.email || '',
        metadata: {
          provider_id: provider.id,
          user_id: user.id,
          business_name: provider.business_name
        }
      })
      
      customerId = customer.id
      
      // Save Stripe customer ID
      await supabase
        .from('providers')
        .update({ stripe_customer_id: customerId })
        .eq('id', provider.id)
      
      console.log('Created Stripe customer:', customerId)
    }

    // Get price ID based on plan
    const priceId = planId === 'premium' 
      ? process.env.STRIPE_PREMIUM_PRICE_ID 
      : process.env.STRIPE_BASIC_PRICE_ID

    if (!priceId) {
      console.error('Missing price ID for plan:', planId)
      return NextResponse.json({ error: 'Price configuration missing' }, { status: 500 })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&subscription_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe?canceled=true`,
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          provider_id: provider.id,
          user_id: user.id,
          plan: planId
        }
      },
      metadata: {
        provider_id: provider.id,
        user_id: user.id,
        plan: planId
      }
    })

    console.log('Created checkout session:', session.id)
    return NextResponse.json({ url: session.url })
    
  } catch (error) {
    console.error('Stripe checkout error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Checkout failed: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}