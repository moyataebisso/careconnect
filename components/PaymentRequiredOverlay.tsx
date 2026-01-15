'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PaymentRequiredOverlayProps {
  businessName?: string
}

export default function PaymentRequiredOverlay({ businessName }: PaymentRequiredOverlayProps) {
  const router = useRouter()
  const [processingPayment, setProcessingPayment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    setProcessingPayment(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: 'basic' })
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        setError(data.error)
        if (data.redirect) {
          router.push(data.redirect)
        }
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError('Payment processing failed. Please try again.')
    } finally {
      setProcessingPayment(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - dims and blurs the dashboard behind */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Complete Your Subscription</h2>
          <p className="text-blue-100">
            {businessName ? `Welcome, ${businessName}!` : 'Welcome!'} Your account is ready.
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <p className="text-gray-600 mb-6">
            Subscribe now to activate your listing and start connecting with families and case managers.
          </p>

          {/* What you get */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Your subscription includes:</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Public listing visible to care seekers
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Receive unlimited referral requests
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Connect with families and case managers
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                245D verified provider badge
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Upload facility photos
              </li>
            </ul>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Price and CTA */}
          <div className="text-center">
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">$99.99</span>
              <span className="text-gray-600">/month</span>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={processingPayment}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
                processingPayment
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
              }`}
            >
              {processingPayment ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Redirecting to checkout...
                </span>
              ) : (
                'Subscribe Now'
              )}
            </button>

            <p className="text-sm text-gray-500 mt-3">
              Secure payment via Stripe. Cancel anytime.
            </p>
          </div>
        </div>

        {/* Footer note */}
        <div className="bg-blue-50 px-8 py-4 border-t border-blue-100">
          <p className="text-sm text-blue-800 text-center">
            Your dashboard is ready behind this screen. Subscribe to unlock full access!
          </p>
        </div>
      </div>
    </div>
  )
}
