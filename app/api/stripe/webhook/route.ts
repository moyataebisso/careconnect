// app/api/stripe/webhook/route.ts
//
// Retry/ignore policy (agreed with owner):
//   Return 200 (ack, don't retry) for:
//     - Signature verification failure IS NOT here — signature failures return 400.
//     - Event types we don't handle (default branch).
//     - Provider lookup by stripe_customer_id yields no row (orphan/pre-migration data).
//     - subscription_plans lookup miss on checkout.session.completed — logs CONFIG_DRIFT,
//       writes plan_id null, returns 200. Retrying does not fix config drift.
//   Return 500 (make Stripe retry) for:
//     - Missing provider_id or subscription in checkout.session.completed metadata
//       (money in, no service delivered — must be loud).
//     - Any DB write failure (providers.update, subscription_history.insert).
//     - Any Stripe SDK error mid-processing.
//   Return 400 for:
//     - Missing / invalid Stripe signature.
//   Return 500 for:
//     - Missing env config (Stripe will retry; ops must fix).

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export const runtime = 'nodejs'

// Sentinel thrown by handlers to signal an ignorable-but-noted condition (log + 200).
class IgnorableEventError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IgnorableEventError'
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('stripe.webhook: STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET missing')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('stripe.webhook: no Stripe signature')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
  })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    console.error('stripe.webhook: signature verification failed', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()
  console.log('stripe.webhook: processing', event.type, event.id)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const providerId = session.metadata?.provider_id

        if (!providerId || !session.subscription) {
          // Money received but we can't tie it to a provider — MUST be loud.
          // Force retry so ops notice; do NOT swallow.
          throw new Error(
            `checkout.session.completed missing provider_id or subscription (session=${session.id})`,
          )
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        )
        const subData = subscription as unknown as {
          id: string
          status: string
          current_period_end: number
          created: number
          latest_invoice: string | null
          items: { data: Array<{ price: { id: string; unit_amount: number | null } }> }
        }

        const priceId = subData.items.data[0]?.price.id
        const { data: plan, error: planError } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('stripe_price_id', priceId)
          .maybeSingle()

        if (planError || !plan) {
          // CONFIG DRIFT: Stripe price not in our subscription_plans table.
          // Retry won't fix it; log loudly and continue with null plan_id.
          console.error(
            `stripe.webhook: CONFIG_DRIFT price=${priceId} not in subscription_plans table (provider=${providerId})`,
            planError,
          )
        }

        const periodEnd = new Date(subData.current_period_end * 1000).toISOString()
        const startDate = new Date(subData.created * 1000).toISOString()

        const { data: existingProvider, error: existingErr } = await supabase
          .from('providers')
          .select('status')
          .eq('id', providerId)
          .maybeSingle()

        if (existingErr) {
          console.error('stripe.webhook: provider lookup failed', existingErr)
          throw existingErr
        }
        if (!existingProvider) {
          throw new IgnorableEventError(
            `provider ${providerId} not found for checkout.session.completed`,
          )
        }

        interface ProviderSubscriptionUpdate {
          stripe_subscription_id: string
          subscription_status: string
          subscription_plan_id: string | null
          subscription_start_date: string
          subscription_end_date: string
          status?: string
        }

        const updateObj: ProviderSubscriptionUpdate = {
          stripe_subscription_id: subData.id,
          subscription_status: subData.status === 'trialing' ? 'pending' : 'active',
          subscription_plan_id: plan?.id || null,
          subscription_start_date: startDate,
          subscription_end_date: periodEnd,
        }

        if (subData.status !== 'trialing') {
          if (existingProvider.status === 'pending') {
            updateObj.status = 'active'
          } else if (existingProvider.status === 'incomplete') {
            updateObj.status = 'pending'
          }
        }

        const { error: updateError } = await supabase
          .from('providers')
          .update(updateObj)
          .eq('id', providerId)

        if (updateError) {
          console.error('stripe.webhook: provider update failed', updateError)
          throw updateError
        }

        const { error: historyError } = await supabase
          .from('subscription_history')
          .insert({
            provider_id: providerId,
            plan_id: plan?.id || null,
            amount: subData.items.data[0]?.price.unit_amount
              ? subData.items.data[0].price.unit_amount / 100
              : 0,
            status: 'completed',
            payment_method: 'stripe',
            stripe_invoice_id: subData.latest_invoice || null,
          })

        if (historyError) {
          console.error('stripe.webhook: subscription_history insert failed', historyError)
          throw historyError
        }

        console.log('stripe.webhook: provider activated', providerId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const subData = subscription as unknown as {
          id: string
          status: string
          current_period_end: number
          customer: string
        }
        const customerId = subData.customer

        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        if (providerError) {
          console.error('stripe.webhook: provider lookup failed', providerError)
          throw providerError
        }
        if (!provider) {
          throw new IgnorableEventError(
            `provider not found for customer ${customerId} on subscription.updated`,
          )
        }

        const statusMap: Record<string, string> = {
          active: 'active',
          past_due: 'past_due',
          canceled: 'expired',
          unpaid: 'expired',
          incomplete: 'past_due',
          incomplete_expired: 'expired',
          trialing: 'pending',
          paused: 'paused',
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
          console.error('stripe.webhook: subscription status update failed', updateError)
          throw updateError
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const subData = subscription as unknown as { customer: string }
        const customerId = subData.customer

        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        if (providerError) {
          console.error('stripe.webhook: provider lookup failed', providerError)
          throw providerError
        }
        if (!provider) {
          throw new IgnorableEventError(
            `provider not found for customer ${customerId} on subscription.deleted`,
          )
        }

        const { error: updateError } = await supabase
          .from('providers')
          .update({
            subscription_status: 'expired',
            subscription_end_date: new Date().toISOString(),
          })
          .eq('id', provider.id)

        if (updateError) {
          console.error('stripe.webhook: expiry update failed', updateError)
          throw updateError
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const invoiceData = invoice as unknown as {
          id: string
          customer: string
          amount_due: number
        }
        const customerId = invoiceData.customer

        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        if (providerError) {
          console.error('stripe.webhook: provider lookup failed', providerError)
          throw providerError
        }
        if (!provider) {
          throw new IgnorableEventError(
            `provider not found for customer ${customerId} on payment_failed`,
          )
        }

        const { error: updateError } = await supabase
          .from('providers')
          .update({ subscription_status: 'past_due' })
          .eq('id', provider.id)

        if (updateError) {
          console.error('stripe.webhook: past_due update failed', updateError)
          throw updateError
        }

        const { error: historyError } = await supabase
          .from('subscription_history')
          .insert({
            provider_id: provider.id,
            amount: (invoiceData.amount_due || 0) / 100,
            status: 'failed',
            payment_method: 'stripe',
            stripe_invoice_id: invoiceData.id || null,
            notes: 'Payment failed',
          })

        if (historyError) {
          console.error('stripe.webhook: failed-payment history insert failed', historyError)
          throw historyError
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const invoiceData = invoice as unknown as {
          id: string
          customer: string
          subscription: string | null
        }
        const customerId = invoiceData.customer

        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        if (providerError) {
          console.error('stripe.webhook: provider lookup failed', providerError)
          throw providerError
        }
        if (!provider) {
          throw new IgnorableEventError(
            `provider not found for customer ${customerId} on payment_succeeded`,
          )
        }

        if (invoiceData.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoiceData.subscription)
          const subData = subscription as unknown as { current_period_end: number }
          const periodEnd = new Date(subData.current_period_end * 1000).toISOString()

          const { error: updateError } = await supabase
            .from('providers')
            .update({
              subscription_status: 'active',
              subscription_end_date: periodEnd,
            })
            .eq('id', provider.id)

          if (updateError) {
            console.error('stripe.webhook: renew update failed', updateError)
            throw updateError
          }
        }
        break
      }

      default:
        // Unhandled event type — ack and move on. Stripe fires many events we don't care about.
        console.log('stripe.webhook: unhandled event type', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    if (error instanceof IgnorableEventError) {
      // Log for visibility, then 200 so Stripe stops retrying.
      console.warn('stripe.webhook: ignoring event —', error.message)
      return NextResponse.json({ received: true, ignored: true })
    }
    // Anything else is a genuine processing failure — 500 so Stripe retries.
    console.error('stripe.webhook: processing failed', event.type, event.id, error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
