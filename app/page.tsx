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
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="container-fluid mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              CareConnect
            </Link>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <form action="/providers" method="get" className="flex gap-2">
                <input
                  type="text"
                  name="search"
                  placeholder="Enter city, neighborhood, or ZIP code"
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-4">
              <Link href="/providers" className="text-gray-700 hover:text-blue-600">
                Find Care
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-blue-600">
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Join as Provider
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Welcome to CareConnect
            </h1>
            <p className="text-xl mb-8">
              Minnesota Trusted 245D/HCBS Referral Service
            </p>
            <p className="text-lg mb-8 opacity-90">
              Connecting quality care with those who need it most across Minnesota
            </p>
            
            {/* Hero Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search by city, service type, or waiver..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-6 py-4 rounded-l-lg text-gray-900 text-lg bg-white/90 backdrop-blur"
                />
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 px-8 py-4 rounded-r-lg font-semibold transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12">
              <div>
                <div className="text-4xl font-bold">500+</div>
                <div className="text-sm opacity-90">Licensed Providers</div>
              </div>
              <div>
                <div className="text-4xl font-bold">24/7</div>
                <div className="text-sm opacity-90">Support Available</div>
              </div>
              <div>
                <div className="text-4xl font-bold">100%</div>
                <div className="text-sm opacity-90">245D Verified</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Foster Care</h3>
              <p className="text-gray-600">Safe, nurturing homes for children and adults needing temporary or long-term care</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Group Homes</h3>
              <p className="text-gray-600">Community-based residential settings with professional support staff</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Assisted Living</h3>
              <p className="text-gray-600">Comprehensive care with daily living assistance and medical support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Waiver Programs Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Accepted Waiver Programs</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            We work with caregivers that accept all major Minnesota waiver programs to ensure coverage for your care needs
          </p>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg mb-2 text-blue-600">CADI</h3>
              <p className="text-sm text-gray-600">Community Access for Disability Inclusion</p>
            </div>
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg mb-2 text-blue-600">BI</h3>
              <p className="text-sm text-gray-600">Brain Injury waiver for specialized care</p>
            </div>
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg mb-2 text-blue-600">EW</h3>
              <p className="text-sm text-gray-600">Elderly Waiver for seniors needing support</p>
            </div>
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg mb-2 text-blue-600">DD</h3>
              <p className="text-sm text-gray-600">Developmental Disabilities comprehensive care</p>
            </div>
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg mb-2 text-blue-600">CRS</h3>
              <p className="text-sm text-gray-600">Community Residential Services</p>
            </div>
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg mb-2 text-blue-600">ICS</h3>
              <p className="text-sm text-gray-600">Integrated Community Services</p>
            </div>
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg mb-2 text-blue-600">Assisted Living</h3>
              <p className="text-sm text-gray-600">24/7 care with ADL support</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section for Providers */}
      <section className="py-16 bg-orange-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Are you a 245D care provider?</h2>
          <p className="text-xl mb-8">Join CareConnect to receive qualified referrals</p>
          <Link 
            href="/register" 
            className="inline-block bg-white text-orange-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Today
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How Our Referral System Works</h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
                <h3 className="font-semibold mb-1">Initial Contact</h3>
                <p className="text-sm text-gray-600">Reach out through our platform</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
                <h3 className="font-semibold mb-1">Profile Creation</h3>
                <p className="text-sm text-gray-600">Build your professional presence</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
                <h3 className="font-semibold mb-1">Outreach Launch</h3>
                <p className="text-sm text-gray-600">Begin targeted marketing</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">4</div>
                <h3 className="font-semibold mb-1">Lead Delivery</h3>
                <p className="text-sm text-gray-600">Receive qualified referrals</p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-16 max-w-3xl mx-auto text-center">
            <p className="text-gray-600 mb-8">
              Our proven system connects you with social workers, discharge planners, and case managers 
              who are actively seeking quality housing solutions for their clients.
            </p>
            <Link 
              href="/providers" 
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Available Providers
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-blue-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Quality Care?</h2>
          <p className="text-xl mb-8">Search our network of verified 245D providers</p>
          <div className="space-x-4">
            <Link 
              href="/providers" 
              className="inline-block bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Find Care Now
            </Link>
            <Link 
              href="/contact" 
              className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}