// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  // Check for required environment variables at runtime
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe configuration missing')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  // Dynamic import Stripe
  const StripeLib = (await import('stripe')).default
  const stripe = new StripeLib(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
  })
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const providerId = session.metadata?.provider_id
        
        if (!providerId || !session.subscription) break
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )
        
        // Determine plan based on price
        const priceId = subscription.items.data[0]?.price.id
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('stripe_price_id', priceId)
          .single()
        
        // Cast to unknown first, then to Record
        const subRecord = subscription as unknown as Record<string, unknown>
        const periodEndTimestamp = subRecord['current_period_end'] as number
        const createdTimestamp = subRecord['created'] as number
        
        const periodEnd = new Date(periodEndTimestamp * 1000).toISOString()
        const startDate = new Date(createdTimestamp * 1000).toISOString()
        
        await supabase
          .from('providers')
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: 'active',
            subscription_plan_id: plan?.id,
            subscription_start_date: startDate,
            subscription_end_date: periodEnd,
          })
          .eq('id', providerId)
          
        // Log to subscription history
        await supabase
          .from('subscription_history')
          .insert({
            provider_id: providerId,
            plan_id: plan?.id,
            amount: subscription.items.data[0]?.price.unit_amount ? 
              subscription.items.data[0].price.unit_amount / 100 : 0,
            status: 'completed',
            payment_method: 'stripe',
            stripe_invoice_id: subscription.latest_invoice as string
          })
        
        break
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        // Get provider by customer ID
        const { data: provider } = await supabase
          .from('providers')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()
        
        if (provider) {
          // Update subscription dates
          const statusMap: Record<string, string> = {
            'active': 'active',
            'past_due': 'past_due',
            'canceled': 'expired',
            'unpaid': 'expired',
            'incomplete': 'past_due',
            'incomplete_expired': 'expired',
            'trialing': 'trial',
            'paused': 'paused'
          }
          
          // Cast to unknown first
          const subRecord = subscription as unknown as Record<string, unknown>
          const periodEndTimestamp = subRecord['current_period_end'] as number
          const periodEnd = new Date(periodEndTimestamp * 1000).toISOString()
          
          await supabase
            .from('providers')
            .update({
              subscription_status: statusMap[subscription.status] || 'expired',
              subscription_end_date: periodEnd,
            })
            .eq('id', provider.id)
        }
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        // Get provider by customer ID
        const { data: provider } = await supabase
          .from('providers')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()
        
        if (provider) {
          // Mark subscription as expired
          await supabase
            .from('providers')
            .update({
              subscription_status: 'expired',
              subscription_end_date: new Date().toISOString(),
            })
            .eq('id', provider.id)
        }
        break
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        
        // Get provider by customer ID
        const { data: provider } = await supabase
          .from('providers')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()
        
        if (provider) {
          // Mark as past due
          await supabase
            .from('providers')
            .update({
              subscription_status: 'past_due'
            })
            .eq('id', provider.id)
            
          // Log failed payment
          await supabase
            .from('subscription_history')
            .insert({
              provider_id: provider.id,
              amount: (invoice.amount_due || 0) / 100,
              status: 'failed',
              payment_method: 'stripe',
              stripe_invoice_id: invoice.id,
              notes: 'Payment failed'
            })
        }
        break
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        
        // Get provider by customer ID
        const { data: provider } = await supabase
          .from('providers')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()
        
        // Cast to unknown first for invoice subscription check
        const invoiceRecord = invoice as unknown as Record<string, unknown>
        const invoiceSubscriptionId = invoiceRecord['subscription'] as string | null
        
        if (provider && invoiceSubscriptionId) {
          // Retrieve subscription to update status
          const subscription = await stripe.subscriptions.retrieve(invoiceSubscriptionId)
          
          // Cast to unknown first
          const subRecord = subscription as unknown as Record<string, unknown>
          const periodEndTimestamp = subRecord['current_period_end'] as number
          const periodEnd = new Date(periodEndTimestamp * 1000).toISOString()
          
          // Update provider status to active after successful payment
          await supabase
            .from('providers')
            .update({
              subscription_status: 'active',
              subscription_end_date: periodEnd,
            })
            .eq('id', provider.id)
        }
        break
      }
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}