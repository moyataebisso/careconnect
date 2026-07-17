export default function ServicesPage() {
  return (
    <div style={{ background: '#F0FDF4' }} className="min-h-screen">

      {/* Hero */}
      <section style={{ background: '#1B4332' }} className="py-16">
        <div className="container mx-auto px-6">
          <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#95D5B2' }}>Platform Services</p>
          <h1 className="text-4xl font-black text-white mb-3" style={{ letterSpacing: '-0.02em' }}>Our Services</h1>
          <p className="text-lg" style={{ color: '#B7E4C7' }}>Connecting 245D Providers with Care Seekers</p>
        </div>
      </section>

      {/* Services */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-5xl">

          {/* Service 1 */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8" style={{ border: '1px solid #D1FAE5' }}>
            <div className="md:flex">
              <div className="md:w-1/3 p-8 text-white flex flex-col justify-center" style={{ background: '#1B4332' }}>
                <div className="text-5xl font-black mb-3" style={{ color: '#95D5B2' }}>1</div>
                <h2 className="text-xl font-black">Provider Directory Listing</h2>
              </div>
              <div className="md:w-2/3 p-8">
                <h3 className="text-lg font-bold mb-3" style={{ color: '#1B4332' }}>Get Found by Families and Case Managers</h3>
                <p className="text-gray-600 mb-5">List your 245D facility in our searchable directory where care seekers actively look for services:</p>
                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  {[
                    { title: 'Searchable Profile', desc: 'Appear in searches by location, services, and waiver types' },
                    { title: 'Real-time Availability', desc: 'Update your capacity to show current openings' },
                    { title: 'Direct Inquiries', desc: 'Receive booking requests directly from families' },
                    { title: '245D Verification Badge', desc: 'Show your verified license status' },
                  ].map(item => (
                    <div key={item.title} className="flex items-start gap-2">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#95D5B2' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <div><strong className="text-sm">{item.title}</strong><p className="text-xs text-gray-500">{item.desc}</p></div>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl text-sm font-medium" style={{ background: '#E8F5E9', color: '#1B4332' }}>
                  <strong>Current Status:</strong> Live and accepting provider registrations
                </div>
              </div>
            </div>
          </div>

          {/* Service 2 */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8" style={{ border: '1px solid #D1FAE5' }}>
            <div className="md:flex">
              <div className="md:w-1/3 p-8 text-white flex flex-col justify-center" style={{ background: '#2d7a52' }}>
                <div className="text-5xl font-black mb-3" style={{ color: '#95D5B2' }}>2</div>
                <h2 className="text-xl font-black">Professional Provider Profile</h2>
              </div>
              <div className="md:w-2/3 p-8">
                <h3 className="text-lg font-bold mb-3" style={{ color: '#1B4332' }}>Showcase Your Facility</h3>
                <p className="text-gray-600 mb-5">Create a detailed profile that helps families understand your services:</p>
                <ul className="space-y-2 mb-5">
                  {[
                    'Display your 245D services (ICS, FRS, CRS, Adult Day Services, etc.)',
                    'Show accepted waiver programs (CADI, DD, BI, Elderly)',
                    'List amenities and special features of your facility',
                    'Specify languages spoken by staff',
                    'Add photos and descriptions of your facility',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-gray-600 text-sm">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#95D5B2' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="p-4 rounded-xl text-sm font-medium" style={{ background: '#E8F5E9', color: '#1B4332' }}>
                  <strong>Result:</strong> A complete profile that helps families make informed decisions
                </div>
              </div>
            </div>
          </div>

          {/* Service 3 */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8" style={{ border: '1px solid #D1FAE5' }}>
            <div className="md:flex">
              <div className="md:w-1/3 p-8 text-white flex flex-col justify-center" style={{ background: '#1a5c3a' }}>
                <div className="text-5xl font-black mb-3" style={{ color: '#95D5B2' }}>3</div>
                <h2 className="text-xl font-black">Care Seeker Features</h2>
              </div>
              <div className="md:w-2/3 p-8">
                <h3 className="text-lg font-bold mb-3" style={{ color: '#1B4332' }}>Tools for Finding the Right Care</h3>
                <p className="text-gray-600 mb-5">We provide care seekers with powerful search and connection tools:</p>
                <div className="grid md:grid-cols-2 gap-6 mb-5">
                  <div>
                    <h4 className="font-bold mb-2 text-sm" style={{ color: '#1B4332' }}>Search & Filter</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Filter by service types</li>
                      <li>• Search by location</li>
                      <li>• Filter by accepted waivers</li>
                      <li>• Check real-time availability</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2 text-sm" style={{ color: '#1B4332' }}>Save & Connect</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Save favorite providers</li>
                      <li>• Direct booking requests</li>
                      <li>• View detailed profiles</li>
                      <li>• Map view of providers</li>
                    </ul>
                  </div>
                </div>
                <div className="p-4 rounded-xl text-sm font-medium" style={{ background: '#E8F5E9', color: '#1B4332' }}>
                  <strong>Benefit:</strong> Families find appropriate care faster with our comprehensive search tools
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-2xl shadow-sm p-8" style={{ border: '1px solid #D1FAE5' }}>
            <h2 className="text-2xl font-black text-center mb-8" style={{ color: '#1B4332', letterSpacing: '-0.01em' }}>How CareConnect Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { n: '1', title: 'Register', desc: 'Providers create an account and list their 245D facility' },
                { n: '2', title: 'Get Found', desc: 'Care seekers search and find your facility' },
                { n: '3', title: 'Connect', desc: 'Receive booking inquiries directly' },
              ].map(step => (
                <div key={step.n} className="text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 font-black text-lg" style={{ background: '#E8F5E9', color: '#1B4332' }}>{step.n}</div>
                  <h3 className="font-bold mb-1" style={{ color: '#1B4332' }}>{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="py-12" style={{ background: '#1B4332' }}>
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-3 text-white" style={{ letterSpacing: '-0.02em' }}>Ready to Get Started?</h2>
          <p className="mb-8" style={{ color: '#B7E4C7' }}>Join Minnesota&apos;s 245D Provider Directory</p>
          <div className="flex gap-4 justify-center">
            <a href="/auth/register" className="inline-block px-8 py-3 rounded-xl font-bold transition-all hover:opacity-90" style={{ background: '#95D5B2', color: '#1B4332' }}>List Your Facility</a>
            <a href="/browse" className="inline-block px-8 py-3 rounded-xl font-bold transition-all hover:opacity-90" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '2px solid rgba(255,255,255,0.3)' }}>Find Care</a>
          </div>
        </div>
      </section>

    </div>
  )
}
