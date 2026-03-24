import { createClient } from '@/lib/supabase/server'
import { Provider } from '@/lib/types/careconnect'
import BrowseClient from './BrowseClient'

// Safely parse array fields — Supabase may return strings, null, or actual arrays
function parseArray(val: unknown): string[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : [] } catch { return [] }
  }
  return []
}

export default async function BrowseProvidersPage() {
  let providers: Provider[] = []

  try {
    const supabase = await createClient()

    // Try full query with all filters first
    let data: any[] | null = null

    const { data: fullData, error: fullError } = await supabase
      .from('providers')
      .select('*')
      .eq('status', 'active')
      .eq('verified_245d', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (fullError) {
      // Fallback: query without columns that may not exist (is_featured, verified_245d)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('providers')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (fallbackError) {
        console.error('Error loading providers:', fallbackError.message || fallbackError.code)
      } else {
        data = fallbackData
      }
    } else {
      data = fullData
    }

    providers = (data || []).map(provider => ({
      ...provider,
      service_types: parseArray(provider.service_types),
      accepted_waivers: parseArray(provider.accepted_waivers),
      languages_spoken: parseArray(provider.languages_spoken),
      photo_urls: parseArray(provider.photo_urls),
      status: provider.status || 'active',
      is_at_capacity: provider.is_at_capacity || false,
      is_ghosted: provider.is_ghosted || false,
      referral_agreement_signed: provider.referral_agreement_signed || false,
      verified_245d: provider.verified_245d || false,
      total_capacity: Number(provider.total_capacity) || 0,
      current_capacity: Number(provider.current_capacity) || 0,
      created_at: provider.created_at || new Date().toISOString(),
      updated_at: provider.updated_at || new Date().toISOString(),
      // Strip contact info — server doesn't know if user is logged in;
      // the client component re-checks auth and conditionally shows contact fields
      contact_phone: undefined,
      contact_email: undefined,
      contact_person: undefined,
    }))
  } catch (error) {
    console.error('Failed to load providers:', error)
  }

  return <BrowseClient initialProviders={providers} />
}
