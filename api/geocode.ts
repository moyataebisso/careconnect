// app/api/geocode/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geocodeAddress } from '@/lib/geocoding'

export async function POST(request: NextRequest) {
  try {
    const { providerId, address, city, zipCode } = await request.json()
    
    if (!providerId || !address || !city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Geocode the address
    const coordinates = await geocodeAddress(address, city, 'MN', zipCode)
    
    if (!coordinates) {
      return NextResponse.json(
        { error: 'Could not geocode address' },
        { status: 400 }
      )
    }

    // Update provider with coordinates
    const supabase = await createClient()
    const { error } = await supabase
      .from('providers')
      .update({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        formatted_address: coordinates.formatted_address
      })
      .eq('id', providerId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      coordinates
    })
  } catch (error) {
    console.error('Geocoding API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Batch geocoding endpoint
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get all providers without coordinates
    const { data: providers, error: fetchError } = await supabase
      .from('providers')
      .select('id, address, city, zip_code')
      .is('latitude', null)
      .limit(50)

    if (fetchError) throw fetchError

    let geocoded = 0
    let failed = 0

    for (const provider of providers || []) {
      const coordinates = await geocodeAddress(
        provider.address,
        provider.city,
        'MN',
        provider.zip_code
      )

      if (coordinates) {
        const { error: updateError } = await supabase
          .from('providers')
          .update({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
          })
          .eq('id', provider.id)

        if (!updateError) {
          geocoded++
        } else {
          failed++
        }
      } else {
        failed++
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return NextResponse.json({
      success: true,
      geocoded,
      failed,
      total: providers?.length || 0
    })
  } catch (error) {
    console.error('Batch geocoding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}