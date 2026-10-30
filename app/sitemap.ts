import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: 'https://careconnections.live', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://careconnections.live/providers', changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://careconnections.live/about', changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://careconnections.live/services', changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://careconnections.live/providers/hennepin-county', changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://careconnections.live/providers/ramsey-county', changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://careconnections.live/providers/anoka-county', changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://careconnections.live/providers/cadi-waiver', changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://careconnections.live/providers/dd-waiver', changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://careconnections.live/providers/family-residential-services', changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://careconnections.live/blog/minnesota-245d-moratorium-2026', changeFrequency: 'monthly', priority: 0.9 },
    { url: 'https://careconnections.live/resources', changeFrequency: 'monthly', priority: 0.6 },
  ]

  // TODO: add dynamic provider profile URLs once getAllProviders util exists
  // const providers = await getAllProviders()
  // const providerPages = providers.map((p) => ({
  //   url: `https://careconnections.live/providers/${p.id}`,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.7,
  // }))

  return [...staticPages]
}
