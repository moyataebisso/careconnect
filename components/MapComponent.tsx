'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Provider } from '@/lib/types/careconnect'

interface MapComponentProps {
  providers: Provider[]
  center?: [number, number]
  zoom?: number
  onProviderClick?: (provider: Provider) => void
  height?: string
  showSearch?: boolean
}

export default function MapComponent({
  providers,
  center = [-93.2650, 44.9778],
  zoom = 11,
  onProviderClick,
  height = '700px',
  showSearch = false
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Check for Mapbox token
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    
    if (!token) {
      console.error('Mapbox token not found. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file')
      setMapError('Map configuration error. Please contact support.')
      return
    }

    // Set the token
    mapboxgl.accessToken = token
    console.log('Mapbox token set:', token.substring(0, 10) + '...')

    try {
      // Create the map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center,
        zoom: zoom,
        pitch: 0,
        bearing: 0
      })

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
      
      // Handle map load event
      map.current.on('load', () => {
        console.log('Map loaded successfully')
        setMapLoaded(true)
        setMapError(null)
      })

      // Handle map errors
      map.current.on('error', (e) => {
        console.error('Map error:', e)
        setMapError('Failed to load map. Please check your internet connection.')
      })

    } catch (error) {
      console.error('Map initialization error:', error)
      setMapError('Failed to initialize map. Please refresh the page.')
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [center, zoom])

  // Add markers for providers
  useEffect(() => {
    if (!map.current || !mapLoaded) {
      console.log('Map not ready for markers:', { mapExists: !!map.current, mapLoaded })
      return
    }

    console.log(`Adding ${providers.length} providers to map`)

    // Clear existing markers
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    // Track providers with valid coordinates
    let validProviders = 0

    // Add new markers
    providers.forEach(provider => {
      if (!provider.latitude || !provider.longitude) return
      
      validProviders++

      // Create custom marker element
      const el = document.createElement('div')
      el.className = 'custom-marker'
      el.style.width = '40px'
      el.style.height = '40px'
      el.style.cursor = 'pointer'
      
      // Determine availability color
      const isAvailable = provider.current_capacity < provider.total_capacity
      const bgColor = isAvailable ? '#10b981' : '#ef4444'
      
      // Create marker div
      const markerDiv = document.createElement('div')
      markerDiv.style.width = '40px'
      markerDiv.style.height = '40px'
      markerDiv.style.background = bgColor
      markerDiv.style.border = '3px solid white'
      markerDiv.style.borderRadius = '50%'
      markerDiv.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'
      markerDiv.style.display = 'flex'
      markerDiv.style.alignItems = 'center'
      markerDiv.style.justifyContent = 'center'
      markerDiv.style.color = 'white'
      markerDiv.style.fontWeight = 'bold'
      markerDiv.style.fontSize = '12px'
      
      // Show available beds
      const availableBeds = provider.total_capacity - provider.current_capacity
      markerDiv.textContent = String(availableBeds)
      
      el.appendChild(markerDiv)

      // Create popup
      const popupContent = document.createElement('div')
      popupContent.style.padding = '12px'
      popupContent.style.minWidth = '200px'
      
      const title = document.createElement('h3')
      title.style.margin = '0 0 8px 0'
      title.style.fontSize = '16px'
      title.style.fontWeight = '600'
      title.textContent = provider.business_name
      popupContent.appendChild(title)
      
      const address = document.createElement('p')
      address.style.margin = '0 0 4px 0'
      address.style.fontSize = '14px'
      address.style.color = '#666'
      address.textContent = `${provider.address || ''}, ${provider.city}`
      popupContent.appendChild(address)
      
      const capacity = document.createElement('p')
      capacity.style.margin = '0'
      capacity.style.fontSize = '14px'
      capacity.style.fontWeight = '500'
      capacity.style.color = isAvailable ? '#10b981' : '#ef4444'
      capacity.textContent = `${availableBeds} beds available`
      popupContent.appendChild(capacity)
      
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        maxWidth: '300px'
      }).setDOMContent(popupContent)

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([provider.longitude, provider.latitude])
        .setPopup(popup)
        .addTo(map.current!)

      // Handle click
      el.addEventListener('click', () => {
        setSelectedProvider(provider)
        if (onProviderClick) {
          onProviderClick(provider)
        }
      })

      markers.current.push(marker)
    })

    console.log(`Added ${validProviders} markers to map`)

    // Fit map to show all markers
    if (validProviders > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      providers.forEach(provider => {
        if (provider.latitude && provider.longitude) {
          bounds.extend([provider.longitude, provider.latitude])
        }
      })
      
      // Only fit bounds if we have valid bounds
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { 
          padding: 50,
          maxZoom: 14 // Prevent zooming in too far for single markers
        })
      }
    }
  }, [providers, mapLoaded, onProviderClick])

  // Handle call button click
  const handleCallClick = () => {
    if (selectedProvider?.contact_phone) {
      window.location.href = `tel:${selectedProvider.contact_phone}`
    }
  }

  // Handle details button click
  const handleDetailsClick = () => {
    if (selectedProvider) {
      window.location.href = `/providers/${selectedProvider.id}`
    }
  }

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full rounded-lg bg-gray-100">
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p className="text-gray-600">{mapError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Provider Card Overlay */}
      {selectedProvider && (
        <div className="absolute bottom-4 left-4 right-4 max-w-sm bg-white rounded-lg shadow-xl p-4 z-10">
          <button
            onClick={() => setSelectedProvider(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
          <h3 className="font-semibold text-lg mb-2 pr-8">
            {selectedProvider.business_name}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {selectedProvider.address}, {selectedProvider.city} {selectedProvider.zip_code}
          </p>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm">
              Capacity: {selectedProvider.current_capacity}/{selectedProvider.total_capacity}
            </span>
            <span className={`text-sm px-2 py-1 rounded ${
              selectedProvider.current_capacity < selectedProvider.total_capacity
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {selectedProvider.current_capacity < selectedProvider.total_capacity
                ? `${selectedProvider.total_capacity - selectedProvider.current_capacity} Available`
                : 'Full'}
            </span>
          </div>
          <div className="flex gap-2">
            {selectedProvider.contact_phone && (
              <button
                onClick={handleCallClick}
                className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Call
              </button>
            )}
            <button
              onClick={handleDetailsClick}
              className="flex-1 bg-gray-100 text-gray-700 text-center py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow p-3 z-10">
        <h4 className="text-xs font-semibold mb-2 text-gray-700">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            <span className="text-xs text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
            <span className="text-xs text-gray-600">Full</span>
          </div>
        </div>
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-10">
          <div>Providers: {providers.length}</div>
          <div>With coords: {providers.filter(p => p.latitude && p.longitude).length}</div>
          <div>Map loaded: {mapLoaded ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  )
}