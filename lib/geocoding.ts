// lib/geocoding.ts

interface GeocodeResult {
  latitude: number
  longitude: number
  formatted_address?: string
}

/**
 * Geocode an address using Mapbox Geocoding API
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string = 'MN',
  zipCode?: string
): Promise<GeocodeResult | null> {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  
  if (!mapboxToken) {
    console.error('Mapbox token not configured')
    return null
  }

  // Construct the full address
  const fullAddress = [
    address,
    city,
    state,
    zipCode
  ].filter(Boolean).join(', ')

  try {
    const encodedAddress = encodeURIComponent(fullAddress)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=US&limit=1`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center
      return {
        latitude,
        longitude,
        formatted_address: data.features[0].place_name
      }
    }
    
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Geocode using Google Maps API (alternative)
 */
export async function geocodeAddressGoogle(
  address: string,
  city: string,
  state: string = 'MN',
  zipCode?: string
): Promise<GeocodeResult | null> {
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!googleApiKey) {
    console.error('Google Maps API key not configured')
    return null
  }

  const fullAddress = [
    address,
    city,
    state,
    zipCode
  ].filter(Boolean).join(', ')

  try {
    const encodedAddress = encodeURIComponent(fullAddress)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${googleApiKey}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location
      return {
        latitude: lat,
        longitude: lng,
        formatted_address: data.results[0].formatted_address
      }
    }
    
    return null
  } catch (error) {
    console.error('Google geocoding error:', error)
    return null
  }
}

/**
 * Calculate distance between two coordinates in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959 // Radius of the Earth in miles
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * Get user's current location
 */
export async function getUserLocation(): Promise<GeocodeResult | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      () => {
        resolve(null)
      }
    )
  })
}

/**
 * Batch geocode multiple addresses
 */
export async function batchGeocode(
  providers: Array<{
    id: string
    address: string
    city: string
    zip_code: string
  }>
): Promise<Map<string, GeocodeResult>> {
  const results = new Map<string, GeocodeResult>()
  
  // Process in batches to avoid rate limiting
  const batchSize = 5
  for (let i = 0; i < providers.length; i += batchSize) {
    const batch = providers.slice(i, i + batchSize)
    
    await Promise.all(
      batch.map(async (provider) => {
        const result = await geocodeAddress(
          provider.address,
          provider.city,
          'MN',
          provider.zip_code
        )
        if (result) {
          results.set(provider.id, result)
        }
      })
    )
    
    // Add delay between batches to respect rate limits
    if (i + batchSize < providers.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  return results
}