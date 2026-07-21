import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: 'https://careconnectlive.org', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://careconnectlive.org/providers', changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://careconnectlive.org/about', changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://careconnectlive.org/services', changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://careconnectlive.org/providers/hennepin-county', changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://careconnectlive.org/providers/ramsey-county', changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://careconnectlive.org/providers/anoka-county', changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://careconnectlive.org/providers/cadi-waiver', changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://careconnectlive.org/providers/dd-waiver', changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://careconnectlive.org/providers/family-residential-services', changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://careconnectlive.org/blog/minnesota-245d-moratorium-2026', changeFrequency: 'monthly', priority: 0.9 },
    { url: 'https://careconnectlive.org/resources', changeFrequency: 'monthly', priority: 0.6 },
  ]

  // TODO: add dynamic provider profile URLs once getAllProviders util exists
  // const providers = await getAllProviders()
  // const providerPages = providers.map((p) => ({
  //   url: `https://careconnectlive.org/providers/${p.id}`,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.7,
  // }))

  return [...staticPages]
}
