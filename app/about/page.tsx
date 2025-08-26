export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">About CareConnect Marketing Agency</h1>
          <p className="text-xl opacity-90">Building Bridges Between Quality Care and Those Who Need It</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-blue-900">Who We Are</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              CareConnect Marketing is a specialized agency that connects licensed home care providers 
              with social workers, discharge planners, and case managers who are actively seeking 
              quality housing solutions for their clients.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We use targeted marketing, professional branding, and referral-driven outreach to help 
              home care businesses grow their client base reliably and compliantly.
            </p>
          </div>

          {/* Why Choose Us Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-blue-900">Why Choose CareConnect?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Quality Leads</h3>
                <p className="text-gray-600 text-sm">
                  We generate consistent, high-quality leads from case managers
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Network Visibility</h3>
                <p className="text-gray-600 text-sm">
                  We create visibility for home care providers in referral networks
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Trusted Partner</h3>
                <p className="text-gray-600 text-sm">
                  We position clients as trusted, reliable housing solutions
                </p>
              </div>
            </div>
          </div>

          {/* Mission Statement */}
          <div className="bg-blue-50 rounded-lg p-8 border-l-4 border-blue-600">
            <h2 className="text-2xl font-bold mb-4 text-blue-900">Our Mission</h2>
            <p className="text-gray-700 italic">
              To bridge the gap between quality 245D care providers and the families who need them, 
              ensuring every Minnesotan has access to appropriate, compassionate care that matches 
              their unique needs and waiver programs.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">250+</div>
              <div className="text-gray-600">Providers Listed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">87</div>
              <div className="text-gray-600">Counties Served</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">4</div>
              <div className="text-gray-600">Waiver Types</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">24/7</div>
              <div className="text-gray-600">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Grow Your Care Business?</h2>
          <p className="mb-6">Join our network of trusted 245D providers</p>
          <a 
            href="/register" 
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Get Started Today
          </a>
        </div>
      </section>
    </div>
  )
}