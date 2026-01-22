// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

// Disable body parsing - Stripe needs raw body for signature verification
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // Check for required environment variables at runtime
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe configuration missing')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  
  if (!signature) {
    console.error('No Stripe signature in request')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
  })
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Use admin client - no cookies/session required
  const supabase = createAdminClient()

  console.log('Processing webhook event:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const providerId = session.metadata?.provider_id
        
        console.log('Checkout completed for provider:', providerId)
        
        if (!providerId || !session.subscription) {
          console.log('Missing provider_id or subscription in session')
          break
        }
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )
        
        // Cast subscription to access properties
        const subData = subscription as unknown as {
          id: string
          status: string
          current_period_end: number
          created: number
          latest_invoice: string | null
          items: { data: Array<{ price: { id: string; unit_amount: number | null } }> }
        }
        
        // Determine plan based on price
        const priceId = subData.items.data[0]?.price.id
        const { data: plan, error: planError } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('stripe_price_id', priceId)
          .single()
        
        if (planError) {
          console.error('Error fetching plan:', planError)
        }
        
        const periodEnd = new Date(subData.current_period_end * 1000).toISOString()
        const startDate = new Date(subData.created * 1000).toISOString()
        
        const { error: updateError } = await supabase
          .from('providers')
          .update({
            stripe_subscription_id: subData.id,
            subscription_status: subData.status === 'trialing' ? 'pending' : 'active',
            subscription_plan_id: plan?.id || null,
            subscription_start_date: startDate,
            subscription_end_date: periodEnd,
          })
          .eq('id', providerId)
        
        if (updateError) {
          console.error('Error updating provider:', updateError)
          throw updateError
        }
        
        console.log('Provider updated successfully:', providerId)
          
        // Log to subscription history
        const { error: historyError } = await supabase
          .from('subscription_history')
          .insert({
            provider_id: providerId,
            plan_id: plan?.id || null,
            amount: subData.items.data[0]?.price.unit_amount ? 
              subData.items.data[0].price.unit_amount / 100 : 0,
            status: 'completed',
            payment_method: 'stripe',
            stripe_invoice_id: subData.latest_invoice || null
          })
        
        if (historyError) {
          console.error('Error logging subscription history:', historyError)
        }
        
        break
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Cast subscription to access properties
        const subData = subscription as unknown as {
          id: string
          status: string
          current_period_end: number
          customer: string
        }
        
        const customerId = subData.customer
        
        console.log('Subscription updated for customer:', customerId)
        
        // Get provider by customer ID
        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()
        
        if (providerError || !provider) {
          console.error('Provider not found for customer:', customerId, providerError)
          break
        }
        
        // Map Stripe status to your status values
        const statusMap: Record<string, string> = {
          'active': 'active',
          'past_due': 'past_due',
          'canceled': 'expired',
          'unpaid': 'expired',
          'incomplete': 'past_due',
          'incomplete_expired': 'expired',
          'trialing': 'pending',
          'paused': 'paused'
        }
        
        const periodEnd = new Date(subData.current_period_end * 1000).toISOString()
        
        const { error: updateError } = await supabase
          .from('providers')
          .update({
            subscription_status: statusMap[subData.status] || 'expired',
            subscription_end_date: periodEnd,
          })
          .eq('id', provider.id)
        
        if (updateError) {
          console.error('Error updating provider subscription:', updateError)
          throw updateError
        }
        
        console.log('Provider subscription status updated:', provider.id, subData.status)
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Cast subscription to access properties
        const subData = subscription as unknown as {
          customer: string
        }
        
        const customerId = subData.customer
        
        console.log('Subscription deleted for customer:', customerId)
        
        // Get provider by customer ID
        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()
        
        if (providerError || !provider) {
          console.error('Provider not found for customer:', customerId, providerError)
          break
        }
        
        // Mark subscription as expired
        const { error: updateError } = await supabase
          .from('providers')
          .update({
            subscription_status: 'expired',
            subscription_end_date: new Date().toISOString(),
          })
          .eq('id', provider.id)
        
        if (updateError) {
          console.error('Error marking subscription expired:', updateError)
          throw updateError
        }
        
        console.log('Provider subscription marked expired:', provider.id)
        break
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Cast invoice to access properties
        const invoiceData = invoice as unknown as {
          id: string
          customer: string
          amount_due: number
        }
        
        const customerId = invoiceData.customer
        
        console.log('Payment failed for customer:', customerId)
        
        // Get provider by customer ID
        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()
        
        if (providerError || !provider) {
          console.error('Provider not found for customer:', customerId, providerError)
          break
        }
        
        // Mark as past due
        const { error: updateError } = await supabase
          .from('providers')
          .update({
            subscription_status: 'past_due'
          })
          .eq('id', provider.id)
        
        if (updateError) {
          console.error('Error marking subscription past_due:', updateError)
        }
          
        // Log failed payment
        const { error: historyError } = await supabase
          .from('subscription_history')
          .insert({
            provider_id: provider.id,
            amount: (invoiceData.amount_due || 0) / 100,
            status: 'failed',
            payment_method: 'stripe',
            stripe_invoice_id: invoiceData.id || null,
            notes: 'Payment failed'
          })
        
        if (historyError) {
          console.error('Error logging failed payment:', historyError)
        }
        
        console.log('Provider marked past_due:', provider.id)
        break
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Cast invoice to access properties
        const invoiceData = invoice as unknown as {
          id: string
          customer: string
          subscription: string | null
        }
        
        const customerId = invoiceData.customer
        
        console.log('Payment succeeded for customer:', customerId)
        
        // Get provider by customer ID
        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()
        
        if (providerError || !provider) {
          console.error('Provider not found for customer:', customerId, providerError)
          break
        }
        
        if (invoiceData.subscription) {
          // Retrieve subscription to update status
          const subscription = await stripe.subscriptions.retrieve(invoiceData.subscription)
          
          // Cast subscription to access properties
          const subData = subscription as unknown as {
            current_period_end: number
          }
          
          const periodEnd = new Date(subData.current_period_end * 1000).toISOString()
          
          // Update provider status to active after successful payment
          const { error: updateError } = await supabase
            .from('providers')
            .update({
              subscription_status: 'active',
              subscription_end_date: periodEnd,
            })
            .eq('id', provider.id)
          
          if (updateError) {
            console.error('Error updating provider after payment:', updateError)
            throw updateError
          }
          
          console.log('Provider subscription renewed:', provider.id)
        }
        break
      }
      
      default:
        console.log('Unhandled event type:', event.type)
    }
    
    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    // Still return 200 to prevent Stripe from retrying indefinitely
    // The error is logged for debugging
    return NextResponse.json({ received: true, error: 'Processing error logged' })
  }
}