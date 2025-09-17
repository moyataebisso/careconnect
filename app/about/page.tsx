export default function AboutPage() {
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">About CareConnect</h1>
          <p className="text-xl opacity-90">Minnesota Trusted 245D Provider Directory</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-blue-900">Who We Are</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              CareConnect is a comprehensive online directory that connects Minnesota families and case 
              managers with verified 245D licensed care providers. Our platform simplifies the process 
              of finding appropriate residential care that accepts various waiver programs.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We provide a searchable database of active 245D providers, allowing care seekers to filter 
              by location, services offered, accepted payment types, and current availability.
            </p>
          </div>

          {/* What We Offer Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-blue-900">What We Offer</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-lg">For Care Seekers</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Browse verified 245D providers
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Filter by services and payment types
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Check real-time availability
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Save favorite providers
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Direct booking requests
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">For Providers</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">✓</span>
                    Create detailed facility profiles
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">✓</span>
                    Showcase services and amenities
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">✓</span>
                    Update availability in real-time
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">✓</span>
                    Receive booking inquiries
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">✓</span>
                    Connect with case managers
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Services We Support */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-blue-900">245D Services We List</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Basic Services</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• Integrated Community Services (ICS)</li>
                  <li>• Family Residential Services (FRS)</li>
                  <li>• Community Residential Services (CRS)</li>
                  <li>• Adult Day Services</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Comprehensive Services</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• Respite Support</li>
                  <li>• Assisted Living (24/7 Care)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Mission Statement */}
          <div className="bg-blue-50 rounded-lg p-8 border-l-4 border-blue-600">
            <h2 className="text-2xl font-bold mb-4 text-blue-900">Our Mission</h2>
            <p className="text-gray-700 italic">
              To provide a simple, accessible platform that connects Minnesota families with verified 
              245D care providers, making it easier to find appropriate care that accepts their waiver 
              program or payment method.
            </p>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Find or List Care Services?</h2>
          <p className="mb-6">Join this Minnesota trusted 245D provider network</p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/browse" 
              className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Find Care
            </a>
            <a 
              href="/auth/register" 
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              List Your Facility
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}