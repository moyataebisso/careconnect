export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Our Services</h1>
          <p className="text-xl opacity-90">Connecting 245D Providers with Care Seekers</p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Service 1: Directory Listing */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-12">
            <div className="md:flex">
              <div className="md:w-1/3 bg-blue-600 p-8 text-white">
                <div className="text-6xl mb-4">1</div>
                <h2 className="text-2xl font-bold">Provider Directory Listing</h2>
              </div>
              <div className="md:w-2/3 p-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  Get Found by Families and Case Managers
                </h3>
                <p className="text-gray-700 mb-6">
                  List your 245D facility in our searchable directory where care seekers actively look for services:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <strong>Searchable Profile</strong>
                      <p className="text-sm text-gray-600">Appear in searches by location, services, and waiver types</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <strong>Real-time Availability</strong>
                      <p className="text-sm text-gray-600">Update your capacity to show current openings</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <strong>Direct Inquiries</strong>
                      <p className="text-sm text-gray-600">Receive booking requests directly from families</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <strong>245D Verification Badge</strong>
                      <p className="text-sm text-gray-600">Show your verified license status</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Current Status:</strong> Live and accepting provider registrations
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
                <h2 className="text-2xl font-bold">Professional Provider Profile</h2>
              </div>
              <div className="md:w-2/3 p-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  Showcase Your Facility
                </h3>
                <p className="text-gray-700 mb-6">
                  Create a detailed profile that helps families understand your services:
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Display your 245D services (ICS, FRS, CRS, Adult Day Services, etc.)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Show accepted payment types (CADI, DD, BI, Elderly waivers, Private Pay)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>List amenities and special features of your facility</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Specify languages spoken by staff</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Add photos and descriptions of your facility</span>
                  </li>
                </ul>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-900">
                    <strong>Result:</strong> A complete profile that helps families make informed decisions
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Service 3: Care Seeker Tools */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-12">
            <div className="md:flex">
              <div className="md:w-1/3 bg-orange-600 p-8 text-white">
                <div className="text-6xl mb-4">3</div>
                <h2 className="text-2xl font-bold">Care Seeker Features</h2>
              </div>
              <div className="md:w-2/3 p-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  Tools for Finding the Right Care
                </h3>
                <p className="text-gray-700 mb-6">
                  We provide care seekers with powerful search and connection tools:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Search & Filter</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Filter by service types</li>
                      <li>• Search by location</li>
                      <li>• Filter by accepted waivers</li>
                      <li>• Check real-time availability</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Save & Connect</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Save favorite providers</li>
                      <li>• Direct booking requests</li>
                      <li>• View detailed profiles</li>
                      <li>• Map view of providers</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-900">
                    <strong>Benefit:</strong> Families find appropriate care faster with our comprehensive search tools
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-lg shadow-lg p-8 mt-12">
            <h2 className="text-2xl font-bold mb-6 text-center">How CareConnect Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">1</div>
                <h3 className="font-semibold mb-1">Register</h3>
                <p className="text-sm text-gray-600">Providers create an account and list their 245D facility</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">2</div>
                <h3 className="font-semibold mb-1">Get Found</h3>
                <p className="text-sm text-gray-600">Care seekers search and find your facility</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">3</div>
                <h3 className="font-semibold mb-1">Connect</h3>
                <p className="text-sm text-gray-600">Receive booking inquiries directly</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8">Join this Minnesota 245D Provider Directory</p>
          <div className="space-x-4">
            <a 
              href="/auth/register" 
              className="inline-block bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              List Your Facility
            </a>
            <a 
              href="/browse" 
              className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
            >
              Find Care
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}