'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Provider } from '@/lib/types/careconnect'

// Dynamic import for map to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  )
})

interface HomePageClientProps {
  providers: Provider[]
  providersWithCoords: Provider[]
  featuredProviders: Provider[]
}

export default function HomePageClient({ 
  providers, 
  providersWithCoords, 
  featuredProviders 
}: HomePageClientProps) {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Map Section - Left Side */}
      <div className="w-1/2 relative">
        <MapComponent 
          providers={providersWithCoords}
          height="100%"
          showSearch={false}
        />
        
        {/* Map Overlay Stats */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-20">
          <div className="text-sm font-medium text-gray-900">
            {providersWithCoords.length} of {providers.length} homes
          </div>
        </div>
      </div>

      {/* Listings Section - Right Side */}
      <div className="w-1/2 overflow-y-auto bg-white">
        <div className="p-4">
          {/* Results Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Minnesota Care Facilities
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {featuredProviders.length} available
              </span>
              <select className="text-sm border rounded px-2 py-1">
                <option>Sort: Newest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Provider Cards */}
          <div className="space-y-4">
            {featuredProviders.map((provider) => (
              <Link
                key={provider.id}
                href={`/providers/${provider.id}`}
                className="block hover:shadow-lg transition-shadow"
              >
                <div className="flex bg-white border rounded-lg overflow-hidden hover:border-blue-500">
                  {/* Image */}
                  <div className="w-72 h-48 bg-gray-200 flex-shrink-0">
                    {provider.primary_photo_url ? (
                      <img
                        src={provider.primary_photo_url}
                        alt={provider.business_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {provider.business_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {provider.address}, {provider.city}, MN {provider.zip_code}
                        </p>
                      </div>
                      <button className="text-gray-400 hover:text-red-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>

                    {/* Services */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {provider.service_types?.slice(0, 3).map((service, idx) => (
                        <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {service}
                        </span>
                      ))}
                    </div>

                    {/* Capacity and Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-semibold text-lg">
                          {provider.total_capacity - provider.current_capacity} beds
                        </span>
                        <span className="text-gray-500">
                          {provider.total_capacity} total
                        </span>
                      </div>
                      {provider.current_capacity >= provider.total_capacity ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          Full
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Available
                        </span>
                      )}
                    </div>

                    {/* Additional Info */}
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                      {provider.verified_245d && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified 245D
                        </span>
                      )}
                      <span>Updated today</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-6 text-center">
            <Link 
              href="/providers"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              View All Providers
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}