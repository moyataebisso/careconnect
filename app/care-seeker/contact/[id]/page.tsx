// app/care-seeker/contact/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { SERVICE_TYPE_LABELS, WAIVER_TYPE_SHORT } from '@/lib/types/careconnect'

interface Provider {
  id: string
  business_name: string
  city: string
  state: string
  zip_code?: string
  service_types: string[]
  accepted_waivers: string[]
  description?: string
  total_capacity: number
  current_capacity: number
  verified_245d: boolean
}

interface CareSeeker {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  care_needs: string
  preferred_city?: string
  urgency: string
  has_waiver: boolean
  waiver_type?: string
}

export default function ContactProviderPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const isFollowup = searchParams.get('followup') === 'true'
  
  const providerId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [provider, setProvider] = useState<Provider | null>(null)
  const [careSeeker, setCareSeeker] = useState<CareSeeker | null>(null)
  const [existingInquiry, setExistingInquiry] = useState<boolean>(false)
  
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    includeContactInfo: true,
    urgentResponse: false
  })

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [providerId])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push(`/auth/login?redirect=/care-seeker/contact/${providerId}`)
        return
      }

      // Load provider details
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('*')
        .eq('id', providerId)
        .single()

      if (providerError || !providerData) {
        alert('Provider not found')
        router.push('/browse')
        return
      }

      setProvider(providerData)

      // Load care seeker profile
      const { data: careSeekerData, error: careSeekerError } = await supabase
        .from('care_seekers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (careSeekerError || !careSeekerData) {
        alert('Please complete your profile first')
        router.push('/care-seeker/profile')
        return
      }

      setCareSeeker(careSeekerData)

      // Check for existing inquiry (if not a followup)
      if (!isFollowup) {
        const { data: existingInquiries } = await supabase
          .from('provider_inquiries')
          .select('id')
          .eq('care_seeker_id', careSeekerData.id)
          .eq('provider_id', providerId)
          .eq('status', 'pending')
          .limit(1)

        if (existingInquiries && existingInquiries.length > 0) {
          setExistingInquiry(true)
        }
      }

      // Pre-fill subject based on urgency
      const urgencyText = careSeekerData.urgency === 'immediate' ? 'URGENT: ' : ''
      const subjectBase = isFollowup 
        ? `Follow-up: Previous inquiry about care services`
        : `Inquiry about ${careSeekerData.has_waiver ? careSeekerData.waiver_type + ' waiver' : ''} care services`
      
      setFormData(prev => ({
        ...prev,
        subject: urgencyText + subjectBase,
        urgentResponse: careSeekerData.urgency === 'immediate'
      }))

      // Pre-fill message template
      const messageTemplate = generateMessageTemplate(careSeekerData, isFollowup)
      setFormData(prev => ({
        ...prev,
        message: messageTemplate
      }))

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMessageTemplate = (cs: CareSeeker, followup: boolean) => {
    if (followup) {
      return `Hello,

I previously reached out about care services and wanted to follow up.

[Add your follow-up message here]

Thank you,
${cs.first_name} ${cs.last_name}`
    }

    const urgencyMap = {
      'immediate': 'immediately',
      'within_week': 'within a week',
      'within_month': 'within a month',
      'planning_ahead': 'in the future'
    }

    return `Hello,

I am looking for care services ${urgencyMap[cs.urgency as keyof typeof urgencyMap] || ''} ${cs.preferred_city ? `in the ${cs.preferred_city} area` : ''}.

${cs.has_waiver ? `I have/am eligible for the ${cs.waiver_type} waiver program.` : ''}

Care needs:
${cs.care_needs}

I would like to learn more about:
- Your availability and current openings
- The services you provide
- The admission process
${cs.has_waiver ? '' : '- Pricing information'}

${cs.phone ? `You can reach me at ${cs.phone} or via email.` : 'Please contact me via email.'}

Thank you,
${cs.first_name} ${cs.last_name}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!careSeeker || !provider) return
    
    setSending(true)

    try {
      // Create inquiry
      const { data: inquiry, error: inquiryError } = await supabase
        .from('provider_inquiries')
        .insert({
          care_seeker_id: careSeeker.id,
          provider_id: providerId,
          subject: formData.subject,
          message: formData.message,
          status: 'pending',
          is_read: false
        })
        .select()
        .single()

      if (inquiryError) throw inquiryError

      // If urgent, you might want to trigger an email notification here
      // This would require a Supabase Edge Function or similar

      alert('Your inquiry has been sent successfully! The provider will respond soon.')
      router.push('/care-seeker/inquiries')
      
    } catch (error) {
      console.error('Error sending inquiry:', error)
      alert('Failed to send inquiry. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!provider || !careSeeker) {
    return null
  }

  const availableSpots = provider.total_capacity - provider.current_capacity

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="p-6 border-b bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Contact {provider.business_name}
                </h1>
                <p className="text-gray-600">
                  {provider.city}, {provider.state} {provider.zip_code}
                </p>
              </div>
              <Link 
                href={`/providers/${providerId}`}
                className="text-blue-600 hover:text-blue-700"
              >
                View Full Profile →
              </Link>
            </div>
          </div>

          {/* Provider Info Summary */}
          <div className="p-6 border-b">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Services Offered</h3>
                <div className="flex flex-wrap gap-2">
                  {provider.service_types.map((service) => (
                    <span key={service} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {SERVICE_TYPE_LABELS[service as keyof typeof SERVICE_TYPE_LABELS] || service}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Accepts Waivers</h3>
                <div className="flex flex-wrap gap-2">
                  {provider.accepted_waivers.map((waiver) => (
                    <span key={waiver} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {WAIVER_TYPE_SHORT[waiver as keyof typeof WAIVER_TYPE_SHORT] || waiver}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {provider.verified_245d && (
                  <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                    ✓ 245D Verified
                  </span>
                )}
                {availableSpots > 0 ? (
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                    {availableSpots} spots available
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full">
                    Currently Full
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Warning if existing inquiry */}
          {existingInquiry && !isFollowup && (
            <div className="mx-6 mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                <strong>Note:</strong> You have already sent an inquiry to this provider that is pending response. 
                Consider waiting for their reply before sending another message.
              </p>
            </div>
          )}

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              {isFollowup ? 'Send Follow-up Message' : 'Send Inquiry'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Brief subject line"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  required
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Your message to the provider..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Feel free to modify the pre-filled message template as needed
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.includeContactInfo}
                    onChange={(e) => setFormData({...formData, includeContactInfo: e.target.checked})}
                    className="mr-3"
                  />
                  <span className="text-sm">
                    Share my contact information with the provider
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.urgentResponse}
                    onChange={(e) => setFormData({...formData, urgentResponse: e.target.checked})}
                    className="mr-3"
                  />
                  <span className="text-sm">
                    This is urgent - I need a response as soon as possible
                  </span>
                </label>
              </div>

              {/* Your Information Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Your Information</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Name:</strong> {careSeeker.first_name} {careSeeker.last_name}</p>
                  <p><strong>Email:</strong> {careSeeker.email}</p>
                  {careSeeker.phone && formData.includeContactInfo && (
                    <p><strong>Phone:</strong> {careSeeker.phone}</p>
                  )}
                  <p><strong>Location:</strong> {careSeeker.preferred_city || 'Not specified'}</p>
                  <p><strong>Timeline:</strong> {
                    careSeeker.urgency === 'immediate' ? 'Immediate' :
                    careSeeker.urgency === 'within_week' ? 'Within a week' :
                    careSeeker.urgency === 'within_month' ? 'Within a month' :
                    'Planning ahead'
                  }</p>
                  {careSeeker.has_waiver && (
                    <p><strong>Waiver:</strong> {careSeeker.waiver_type}</p>
                  )}
                </div>
                <Link 
                  href="/care-seeker/profile"
                  className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block"
                >
                  Update your information
                </Link>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between mt-6 pt-6 border-t">
              <Link
                href="/browse"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <div className="flex gap-3">
                <Link
                  href="/care-seeker/inquiries"
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View My Inquiries
                </Link>
                <button
                  type="submit"
                  disabled={sending || (existingInquiry && !isFollowup)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send Inquiry'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Tips for Contacting Providers</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Be specific about your care needs and timeline</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Mention your waiver type if you have one</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Ask about availability, services, and the admission process</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Provide contact information for faster responses</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Contact multiple providers to explore your options</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}