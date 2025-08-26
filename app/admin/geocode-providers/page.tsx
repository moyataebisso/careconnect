// app/admin/geocode-providers/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { geocodeAddress } from '@/lib/geocoding'
import { useRouter } from 'next/navigation'

interface Provider {
  id: string
  business_name: string
  address: string
  city: string
  zip_code: string
  latitude?: number | null
  longitude?: number | null
}

export default function GeocodeProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndLoadProviders()
  }, [])

  const checkAdminAndLoadProviders = async () => {
    try {
      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!adminUser) {
        alert('Admin access required')
        router.push('/dashboard')
        return
      }

      // Load providers without coordinates
      const { data, error } = await supabase
        .from('providers')
        .select('id, business_name, address, city, zip_code, latitude, longitude')
        .or('latitude.is.null,longitude.is.null')
        .order('business_name')

      if (error) throw error

      setProviders(data || [])
    } catch (error) {
      console.error('Error loading providers:', error)
    }
  }

  const geocodeAllProviders = async () => {
    setProcessing(true)
    setProgress({ current: 0, total: providers.length })
    setResults([])

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i]
      setProgress({ current: i + 1, total: providers.length })

      try {
        // Skip if already has coordinates
        if (provider.latitude && provider.longitude) {
          setResults(prev => [...prev, `✓ ${provider.business_name} - Already has coordinates`])
          continue
        }

        // Geocode the address
        const result = await geocodeAddress(
          provider.address,
          provider.city,
          'MN',
          provider.zip_code
        )

        if (result) {
          // Update the provider with coordinates
          const { error } = await supabase
            .from('providers')
            .update({
              latitude: result.latitude,
              longitude: result.longitude
            })
            .eq('id', provider.id)

          if (error) {
            setResults(prev => [...prev, `✗ ${provider.business_name} - Failed to save coordinates: ${error.message}`])
          } else {
            setResults(prev => [...prev, `✓ ${provider.business_name} - Geocoded successfully (${result.latitude}, ${result.longitude})`])
          }
        } else {
          setResults(prev => [...prev, `⚠ ${provider.business_name} - Could not geocode address: ${provider.address}, ${provider.city}`])
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        setResults(prev => [...prev, `✗ ${provider.business_name} - Error: ${error}`])
      }
    }

    setProcessing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Geocode Provider Addresses</h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              Found {providers.length} provider(s) without coordinates.
            </p>
            
            {providers.length > 0 && (
              <div className="bg-gray-50 p-4 rounded max-h-40 overflow-y-auto mb-4">
                <h3 className="font-semibold mb-2">Providers to geocode:</h3>
                <ul className="text-sm">
                  {providers.map(p => (
                    <li key={p.id} className="mb-1">
                      {p.business_name} - {p.address}, {p.city}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={geocodeAllProviders}
              disabled={processing || providers.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Geocode All Addresses'}
            </button>
          </div>

          {processing && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Processing {progress.current} of {progress.total}...
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="border rounded p-4 max-h-96 overflow-y-auto">
              <h3 className="font-semibold mb-2">Results:</h3>
              <ul className="text-sm space-y-1">
                {results.map((result, index) => (
                  <li key={index} className={
                    result.startsWith('✓') ? 'text-green-600' :
                    result.startsWith('✗') ? 'text-red-600' :
                    'text-amber-600'
                  }>
                    {result}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Back to Admin
            </button>
            
            {results.length > 0 && !processing && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Refresh to Check Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}