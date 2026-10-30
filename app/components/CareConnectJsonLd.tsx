export function CareConnectJsonLd() {
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CareConnect Minnesota',
    url: 'https://careconnections.live',
    description:
      'Search Minnesota 245D, assisted living, and home health providers by waiver (CADI, DD, BI, Elderly), service, and county. Free for families and case managers.',
    areaServed: { '@type': 'State', name: 'Minnesota' },
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'MN',
      addressCountry: 'US',
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CareConnect Minnesota',
    url: 'https://careconnections.live',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}
