import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SERVICE_TYPE_LABELS, WAIVER_TYPE_SHORT, ServiceType, WaiverType } from '@/lib/types/careconnect'

type Props = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

type ProviderMeta = {
  business_name: string | null
  city: string | null
  county: string | null
  state: string | null
  zip_code: string | null
  address: string | null
  contact_phone: string | null
  description: string | null
  service_types: string[] | null
  accepted_waivers: string[] | null
}

async function fetchProvider(id: string): Promise<ProviderMeta | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('providers')
      .select(
        'business_name, city, county, state, zip_code, address, contact_phone, description, service_types, accepted_waivers'
      )
      .eq('id', id)
      .single()
    return (data as ProviderMeta) ?? null
  } catch {
    return null
  }
}

function serviceLabels(types: string[] | null | undefined): string[] {
  if (!types) return []
  return types.map((t) => SERVICE_TYPE_LABELS[t as ServiceType] ?? t)
}

function waiverLabels(waivers: string[] | null | undefined): string[] {
  if (!waivers) return []
  return waivers.map((w) => WAIVER_TYPE_SHORT[w as WaiverType] ?? w)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const provider = await fetchProvider(id)

  if (!provider || !provider.business_name) {
    return {
      title: '245D Provider',
      description: 'Verified 245D licensed care provider on CareConnect Minnesota.',
    }
  }

  const services = serviceLabels(provider.service_types)
  const waivers = waiverLabels(provider.accepted_waivers)
  const location = provider.county
    ? `${provider.county} County`
    : provider.city ?? 'Minnesota'

  const title = `${provider.business_name} — 245D Care Provider in ${location}, MN`
  const description =
    `${provider.business_name} is a verified 245D licensed provider in ${location}, Minnesota` +
    (services.length ? ` offering ${services.join(', ')}.` : '.') +
    (waivers.length ? ` Accepting ${waivers.join(', ')} waiver clients.` : '')

  return {
    title: { absolute: `${title} | CareConnect` },
    description,
    openGraph: {
      title: provider.business_name,
      description: `Verified 245D provider in ${location}, MN`,
    },
  }
}

export default async function ProviderLayout({ children, params }: Props) {
  const { id } = await params
  const provider = await fetchProvider(id)

  const jsonLd = provider && provider.business_name
    ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: provider.business_name,
        description: provider.description ?? undefined,
        telephone: provider.contact_phone ?? undefined,
        address: {
          '@type': 'PostalAddress',
          streetAddress: provider.address ?? undefined,
          addressLocality: provider.city ?? undefined,
          addressRegion: provider.state ?? 'MN',
          postalCode: provider.zip_code ?? undefined,
          addressCountry: 'US',
        },
        medicalSpecialty: '245D Home and Community-Based Services',
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  )
}
