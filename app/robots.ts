import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/auth',
          '/dashboard',
          '/billing',
          '/subscribe',
          '/care-seeker/dashboard',
          '/care-seeker/profile',
          '/care-seeker/inquiries',
          '/care-seeker/saved',
          '/care-seeker/contact',
          '/booking',
          '/booking-confirmation',
          '/my-bookings',
          '/find-care',
        ],
      },
    ],
    sitemap: 'https://careconnections.live/sitemap.xml',
    host: 'https://careconnections.live',
  }
}
