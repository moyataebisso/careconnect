// app/page.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/providers?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <section className="relative h-[600px] flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1586105251261-72a756497a11?q=80&w=2940&auto=format&fit=crop')`,
          }}
        />
        
        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
              Welcome to CareConnect
            </h1>
            <p className="text-2xl mb-4 text-white drop-shadow-md">
              Minnesota Trusted 245D/HCBS Referral Service
            </p>
            <p className="text-lg mb-12 text-white/90 drop-shadow">
              Connecting quality care with those who need it most across Minnesota
            </p>
            
            {/* Hero Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-2xl p-2 flex">
                <input
                  type="text"
                  placeholder="Enter city, neighborhood, or ZIP code"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-6 py-4 text-lg text-gray-900 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-md font-semibold text-white transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Quick Filter Buttons */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link 
                href="/providers?service=assisted-living" 
                className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-medium hover:bg-white transition-all hover:shadow-lg"
              >
                Assisted Living
              </Link>
              <Link 
                href="/providers?service=ics" 
                className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-medium hover:bg-white transition-all hover:shadow-lg"
              >
                ICS Services
              </Link>
              <Link 
                href="/providers?service=frs" 
                className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-medium hover:bg-white transition-all hover:shadow-lg"
              >
                Family Residential
              </Link>
              <Link 
                href="/providers?service=crs" 
                className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-medium hover:bg-white transition-all hover:shadow-lg"
              >
                Community Residential
              </Link>
              <Link 
                href="/providers?waiver=cadi" 
                className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-medium hover:bg-white transition-all hover:shadow-lg"
              >
                CADI Waiver
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white py-8 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">100%</div>
              <div className="text-sm text-gray-600">Licensed Providers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">24/7</div>
              <div className="text-sm text-gray-600">Support Available</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">100%</div>
              <div className="text-sm text-gray-600">245D Verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* 245D Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">245D Licensed Services</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            All our providers are licensed under Minnesota 245D program standards
          </p>
          
          <div className="max-w-6xl mx-auto">
            {/* Basic Services */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-4 text-blue-600">Basic Services</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">ICS</h4>
                  <p className="text-sm text-gray-600">Integrated Community Services - Support for independent living</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">FRS</h4>
                  <p className="text-sm text-gray-600">Family Residential Services - Family-style home environment</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">CRS</h4>
                  <p className="text-sm text-gray-600">Community Residential Services - Group living with support</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Adult Day Services</h4>
                  <p className="text-sm text-gray-600">Day programs and activities for adults</p>
                </div>
              </div>
            </div>

            {/* Comprehensive Services */}
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-blue-600">Comprehensive Services</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Respite Support</h4>
                  <p className="text-sm text-gray-600">Temporary relief care for primary caregivers, providing short-term support and assistance</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Assisted Living</h4>
                  <p className="text-sm text-gray-600">24/7 comprehensive care with full ADL support, meals, and medication administration</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Images Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative h-64 rounded-lg overflow-hidden shadow-lg group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2940&auto=format&fit=crop')`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h3 className="text-xl font-bold mb-1">Professional Care</h3>
                <p className="text-sm">Experienced, licensed caregivers</p>
              </div>
            </div>

            <div className="relative h-64 rounded-lg overflow-hidden shadow-lg group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1559234938-b60fff04894d?q=80&w=2940&auto=format&fit=crop')`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h3 className="text-xl font-bold mb-1">Home-Like Settings</h3>
                <p className="text-sm">Comfortable, welcoming environments</p>
              </div>
            </div>

            <div className="relative h-64 rounded-lg overflow-hidden shadow-lg group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1543333995-a78aea2eee50?q=80&w=2940&auto=format&fit=crop')`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h3 className="text-xl font-bold mb-1">Community Support</h3>
                <p className="text-sm">Engaging activities and programs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section for Providers */}
      <section 
        className="py-20 relative"
        style={{
          backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.9), rgba(37, 99, 235, 0.9)), url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2940&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Are you a 245D licensed provider?</h2>
          <p className="text-xl mb-8">Join CareConnect to receive qualified waiver-based referrals</p>
          <Link 
            href="/register" 
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all hover:shadow-lg"
          >
            Get Started Today
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How Our Referral System Works</h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-lg">1</div>
                <h3 className="font-semibold mb-2">Initial Contact</h3>
                <p className="text-sm text-gray-600">Reach out through our platform</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-lg">2</div>
                <h3 className="font-semibold mb-2">Profile Creation</h3>
                <p className="text-sm text-gray-600">Build your professional presence</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-lg">3</div>
                <h3 className="font-semibold mb-2">Outreach Launch</h3>
                <p className="text-sm text-gray-600">Begin targeted marketing</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-lg">4</div>
                <h3 className="font-semibold mb-2">Lead Delivery</h3>
                <p className="text-sm text-gray-600">Receive qualified referrals</p>
              </div>
            </div>

            {/* Connection Lines for Desktop */}
            <div className="hidden md:block relative -mt-12">
              <div className="absolute top-0 left-[12.5%] right-[12.5%] h-0.5 bg-blue-200"></div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-16 max-w-3xl mx-auto text-center">
            <p className="text-gray-600 mb-8">
              Our proven system connects you with social workers, discharge planners, and case managers 
              who are actively seeking quality 245D licensed housing solutions for their waiver clients.
            </p>
            <Link 
              href="/providers" 
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all hover:shadow-lg"
            >
              Browse Available Providers
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Quality Care?</h2>
          <p className="text-xl mb-8">Search our network of verified 245D providers</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/providers" 
              className="inline-block bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all hover:shadow-lg"
            >
              Find Care Now
            </Link>
            <Link 
              href="/contact" 
              className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}