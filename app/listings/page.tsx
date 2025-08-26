import { createClient } from '@/lib/supabase/server'

interface Provider {
  id: string
  business_name: string
  business_email: string
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  address: string
  city: string
  state: string
  zip_code: string
  service_types: string[] | null
  accepted_waivers: string[] | null
  total_capacity: number | null
  current_capacity: number | null
  description: string | null
  amenities: string[] | null
  languages_spoken: string[] | null
  status: string
  verified_245d: boolean
  license_number: string | null
  primary_photo_url: string | null
  created_at: string
}

export default async function ListingsPage() {
  const supabase = await createClient()
  
  // Fetch active providers (not listings table)
  const { data: providers, error } = await supabase
    .from('providers')
    .select('*')
    .eq('status', 'active')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  // Calculate available openings for each provider
  const providersWithOpenings = providers?.map(provider => ({
    ...provider,
    current_openings: (provider.total_capacity || 0) - (provider.current_capacity || 0)
  })) || []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse All Care Providers</h1>
        <p className="text-gray-600 text-lg">Find quality 245D licensed care homes across Minnesota</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option>All Service Types</option>
            <option>Family Residential Services</option>
            <option>Community Residential Services</option>
            <option>Integrated Community Services</option>
            <option>Activities of Daily Living</option>
            <option>Assisted Living</option>
          </select>
          
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option>All Cities</option>
            <option>Minneapolis</option>
            <option>St. Paul</option>
            <option>Rochester</option>
            <option>Duluth</option>
            <option>Bloomington</option>
          </select>
          
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option>All Waivers</option>
            <option>CADI Waiver</option>
            <option>Brain Injury Waiver</option>
            <option>CAC Waiver</option>
            <option>DD Waiver</option>
            <option>Elderly Waiver</option>
          </select>
          
          <button className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
            Apply Filters
          </button>
        </div>
      </div>

      {/* Providers Grid */}
      {!providersWithOpenings || providersWithOpenings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-xl">No providers found</p>
          <p className="text-gray-500 mt-2">Check back soon for new providers!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {providersWithOpenings.map((provider) => (
            <div key={provider.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                {/* Provider Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {provider.business_name}
                    </h2>
                    <p className="text-gray-600">
                      {provider.address}, {provider.city}, MN {provider.zip_code}
                    </p>
                    {provider.verified_245d && (
                      <span className="inline-block mt-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        ✓ 245D Verified
                      </span>
                    )}
                  </div>
                  
                  {/* Openings Badge */}
                  {provider.current_openings > 0 ? (
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                      {provider.current_openings} Opening{provider.current_openings !== 1 ? 's' : ''}
                    </div>
                  ) : (
                    <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full font-semibold">
                      No Openings
                    </div>
                  )}
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">License</p>
                    <p className="font-medium">{provider.license_number || 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Capacity</p>
                    <p className="font-medium">{provider.total_capacity || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Residents</p>
                    <p className="font-medium">{provider.current_capacity || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="font-medium">{provider.contact_name || 'N/A'}</p>
                  </div>
                </div>

                {/* Services */}
                {provider.service_types && provider.service_types.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Services Offered:</p>
                    <div className="flex flex-wrap gap-2">
                      {provider.service_types.slice(0, 5).map((service: string, index: number) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {service}
                        </span>
                      ))}
                      {provider.service_types.length > 5 && (
                        <span className="text-gray-500 text-sm py-1">
                          +{provider.service_types.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Accepted Waivers */}
                {provider.accepted_waivers && provider.accepted_waivers.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Accepted Waivers:</p>
                    <div className="flex flex-wrap gap-2">
                      {provider.accepted_waivers.map((waiver: string, index: number) => (
                        <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                          {waiver}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {provider.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {provider.description}
                  </p>
                )}

                {/* Amenities */}
                {provider.amenities && provider.amenities.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Amenities:</p>
                    <div className="flex flex-wrap gap-2">
                      {provider.amenities.slice(0, 4).map((amenity: string, index: number) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                          {amenity}
                        </span>
                      ))}
                      {provider.amenities.length > 4 && (
                        <span className="text-gray-500 text-sm py-1">
                          +{provider.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="font-medium">{provider.contact_name || 'Contact Us'}</p>
                    {provider.contact_phone && (
                      <p className="text-blue-600">{provider.contact_phone}</p>
                    )}
                  </div>
                  
                  <a 
                    href={`/providers/${provider.id}`}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    View Details →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}