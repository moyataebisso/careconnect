export function CareConnectJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalOrganization',
        name: 'CareConnect Minnesota',
        url: 'https://careconnections.live',
        description:
          'Minnesota 245D/HCBS provider directory connecting families, case managers, and social workers with licensed care providers. CADI, DD, BI, and Elderly waiver types supported.',
        areaServed: { '@type': 'State', name: 'Minnesota' },
        medicalSpecialty: 'Home and Community-Based Services',
        address: {
          '@type': 'PostalAddress',
          addressRegion: 'MN',
          addressCountry: 'US',
        },
      },
      {
        '@type': 'WebSite',
        name: 'CareConnect Minnesota',
        url: 'https://careconnections.live',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://careconnections.live/providers?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
