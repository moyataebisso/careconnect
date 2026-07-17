export default function AboutPage() {
  return (
    <div style={{ background: '#F0FDF4' }}>

      {/* Hero */}
      <section style={{ background: '#1B4332' }} className="py-16">
        <div className="container mx-auto px-6">
          <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#95D5B2' }}>Minnesota 245D Network</p>
          <h1 className="text-4xl font-black text-white mb-3" style={{ letterSpacing: '-0.02em' }}>About CareConnect</h1>
          <p className="text-lg" style={{ color: '#B7E4C7' }}>Minnesota Trusted 245D Provider Directory</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl">

          <div className="bg-white rounded-2xl shadow-sm border p-8 mb-6" style={{ borderColor: '#D1FAE5' }}>
            <h2 className="text-2xl font-black mb-4" style={{ color: '#1B4332', letterSpacing: '-0.01em' }}>Who We Are</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              CareConnect is a comprehensive online directory that connects Minnesota families and case managers with verified 245D licensed care providers. Our platform simplifies the process of finding appropriate residential care that accepts various waiver programs.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We provide a searchable database of active 245D providers, allowing care seekers to filter by location, services offered, accepted payment types, and current availability.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-8 mb-6" style={{ borderColor: '#D1FAE5' }}>
            <h2 className="text-2xl font-black mb-6" style={{ color: '#1B4332', letterSpacing: '-0.01em' }}>What We Offer</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold mb-3 text-lg" style={{ color: '#1B4332' }}>For Care Seekers</h3>
                <ul className="space-y-2 text-gray-600">
                  {['Browse verified 245D providers', 'Filter by services and waiver types', 'Check real-time availability', 'Save favorite providers', 'Direct booking requests'].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-0.5 text-lg" style={{ color: '#95D5B2' }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-3 text-lg" style={{ color: '#1B4332' }}>For Providers</h3>
                <ul className="space-y-2 text-gray-600">
                  {['Create detailed facility profiles', 'Showcase services and amenities', 'Update availability in real-time', 'Receive booking inquiries', 'Connect with case managers'].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-0.5 text-lg" style={{ color: '#95D5B2' }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-8 mb-6" style={{ borderColor: '#D1FAE5' }}>
            <h2 className="text-2xl font-black mb-6" style={{ color: '#1B4332', letterSpacing: '-0.01em' }}>245D Services We List</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-3" style={{ background: '#E8F5E9', color: '#1B4332' }}>Basic Services</div>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>• Integrated Community Supports (ICS)</li>
                  <li>• Individualized Home Supports (IHS)</li>
                  <li>• Respite Care</li>
                  <li>• Adult Day Services</li>
                  <li>• Homemaker Services</li>
                  <li>• Night Supervision</li>
                </ul>
              </div>
              <div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-3" style={{ background: '#EDE9FE', color: '#4C1D95' }}>Intensive Services</div>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>• Family Residential Services (FRS)</li>
                  <li>• Community Residential Services (CRS)</li>
                  <li>• Day Training & Habilitation (DTH)</li>
                  <li>• Employment Support Services</li>
                </ul>
              </div>
              <div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-3" style={{ background: '#F3F4F6', color: '#374151' }}>Additional Care</div>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>• Assisted Living</li>
                  <li>• Home Health Care</li>
                  <li className="text-xs text-gray-400 mt-1">Licensed by MN Dept of Health</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-8" style={{ background: '#1B4332' }}>
            <h2 className="text-2xl font-black mb-4 text-white" style={{ letterSpacing: '-0.01em' }}>Our Mission</h2>
            <p className="italic leading-relaxed" style={{ color: '#B7E4C7' }}>
              To provide a simple, accessible platform that connects Minnesota families with verified 245D care providers, making it easier to find appropriate care that accepts their waiver program or payment method.
            </p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="py-12" style={{ background: '#DCFCE7' }}>
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl font-black mb-3" style={{ color: '#1B4332' }}>Ready to Find or List Care Services?</h2>
          <p className="text-gray-600 mb-6">Join Minnesota&apos;s trusted 245D provider network</p>
          <div className="flex gap-4 justify-center">
            <a href="/browse" className="inline-block px-8 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90" style={{ background: '#1B4332' }}>Find Care</a>
            <a href="/auth/register" className="inline-block px-8 py-3 rounded-xl font-bold transition-all hover:opacity-90" style={{ background: 'white', color: '#1B4332', border: '2px solid #1B4332' }}>List Your Facility</a>
          </div>
        </div>
      </section>

    </div>
  )
}
