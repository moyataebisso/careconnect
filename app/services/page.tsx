export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Our Services</h1>
          <p className="text-xl opacity-90">Comprehensive Marketing Solutions for 245D Providers</p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Service 1: Outreach */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-12">
            <div className="md:flex">
              <div className="md:w-1/3 bg-blue-600 p-8 text-white">
                <div className="text-6xl mb-4">1</div>
                <h2 className="text-2xl font-bold">Multi-Channel Outreach</h2>
              </div>
              <div className="md:w-2/3 p-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  Comprehensive Referral Network Engagement
                </h3>
                <p className="text-gray-700 mb-6">
                  We connect you with case managers, social workers, and discharge planners through:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <strong>Email Campaigns</strong>
                      <p className="text-sm text-gray-600">Targeted outreach to healthcare professionals</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <strong>SMS Updates</strong>
                      <p className="text-sm text-gray-600">Real-time availability notifications</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <strong>Phone Outreach</strong>
                      <p className="text-sm text-gray-600">Personal connections with referral sources</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <strong>Direct Mail</strong>
                      <p className="text-sm text-gray-600">Professional materials to key contacts</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Includes:</strong> Monthly follow-ups with custom call-to-action messaging tailored to your services
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Service 2: Web Presence */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-12">
            <div className="md:flex">
              <div className="md:w-1/3 bg-green-600 p-8 text-white">
                <div className="text-6xl mb-4">2</div>
                <h2 className="text-2xl font-bold">Provider Profiles & Landing Pages</h2>
              </div>
              <div className="md:w-2/3 p-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  Professional Online Presence
                </h3>
                <p className="text-gray-700 mb-6">
                  Branded, 245D compliant web pages that showcase your facility professionally:
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Custom provider profile highlighting your unique services and amenities</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Photo galleries showcasing your facilities</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Clear display of accepted waivers and service types</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Real-time capacity updates to prevent wasted inquiries</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>245D license verification badge for credibility</span>
                  </li>
                </ul>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-900">
                    <strong>Result:</strong> Professional, compliant web presence that builds trust with referral sources
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Service 3: Lead Management */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-12">
            <div className="md:flex">
              <div className="md:w-1/3 bg-orange-600 p-8 text-white">
                <div className="text-6xl mb-4">3</div>
                <h2 className="text-2xl font-bold">Automated Lead Management</h2>
              </div>
              <div className="md:w-2/3 p-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  Never Miss a Referral Opportunity
                </h3>
                <p className="text-gray-700 mb-6">
                  Streamlined lead tracking and follow-up system ensures every opportunity is maximized:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Lead Tracking</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Centralized referral dashboard</li>
                      <li>• Source tracking and analytics</li>
                      <li>• Conversion rate monitoring</li>
                      <li>• ROI reporting</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Automated Follow-ups</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Instant lead notifications</li>
                      <li>• Scheduled reminder system</li>
                      <li>• Response time tracking</li>
                      <li>• Outcome documentation</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-900">
                    <strong>Benefit:</strong> Respond to referrals faster, track success rates, and continuously improve your intake process
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-lg shadow-lg p-8 mt-12">
            <h2 className="text-2xl font-bold mb-6 text-center">How Our Service Process Works</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">1</div>
                <h3 className="font-semibold mb-1">Onboarding</h3>
                <p className="text-sm text-gray-600">We learn about your facility and unique value proposition</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">2</div>
                <h3 className="font-semibold mb-1">Profile Creation</h3>
                <p className="text-sm text-gray-600">Build your professional online presence</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">3</div>
                <h3 className="font-semibold mb-1">Outreach Launch</h3>
                <p className="text-sm text-gray-600">Begin targeted marketing to referral sources</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">4</div>
                <h3 className="font-semibold mb-1">Lead Delivery</h3>
                <p className="text-sm text-gray-600">Receive qualified referrals ready for placement</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Grow Your Census?</h2>
          <p className="text-xl mb-8">Join CareConnect and start receiving qualified referrals</p>
          <div className="space-x-4">
            <a 
              href="/register" 
              className="inline-block bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started
            </a>
            <a 
              href="/contact" 
              className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}