import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'What the Minnesota 245D Licensing Moratorium Means for Families and Providers',
  description:
    'Minnesota DHS paused all new 245D licensing from January 2026 through December 2027. Here is what that means for families seeking care and for existing licensed providers.',
}

export default function MoratoriumBlogPost() {
  return (
    <div className="min-h-screen" style={{ background: '#F0FDF4' }}>
      <article className="container mx-auto px-6 py-16 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm border p-8 md:p-12" style={{ borderColor: '#D1FAE5' }}>
          <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: '#1B4332' }}>
            Policy Update · January 2026
          </p>
          <h1 className="text-3xl md:text-4xl font-black mb-6" style={{ color: '#1B4332', letterSpacing: '-0.02em' }}>
            What the Minnesota 245D Licensing Moratorium Means for You
          </h1>
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            On January 1, 2026, Minnesota DHS imposed a temporary moratorium on new 245D provider licenses. The pause is scheduled to remain in effect through December 31, 2027. This post explains what the moratorium is, what it means for families and case managers searching for care, and what it means for the providers already operating under 245D.
          </p>

          <h2 className="text-2xl font-black mt-10 mb-4" style={{ color: '#1B4332', letterSpacing: '-0.01em' }}>
            What Is the Moratorium?
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Under Minnesota Statutes section 245A.03, subdivision 7a and Executive Order 25-10, DHS stopped issuing new 245D licenses effective January 1, 2026. The moratorium is expected to last 24 months, ending December 31, 2027. DHS cited rapid provider growth that exceeded the waiver population and limited staffing to conduct required reviews.
          </p>

          <h2 className="text-2xl font-black mt-10 mb-4" style={{ color: '#1B4332', letterSpacing: '-0.01em' }}>
            What This Means for Families Seeking Care
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            New 245D providers cannot enter the market during this period. This means finding a qualified, licensed provider requires knowing exactly which existing agencies are accepting new clients. CareConnect maintains a verified directory of active 245D licensed providers accepting waiver clients across Minnesota.
          </p>

          <h2 className="text-2xl font-black mt-10 mb-4" style={{ color: '#1B4332', letterSpacing: '-0.01em' }}>
            What This Means for Licensed Providers
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            If you are already 245D licensed, your listing on CareConnect is more valuable than ever. Case managers and families who cannot find new providers are actively searching directories for existing ones.
          </p>
          <p className="mb-8">
            <Link
              href="/auth/register"
              className="inline-block px-6 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
              style={{ background: '#1B4332' }}
            >
              List your facility on CareConnect →
            </Link>
          </p>

          <h2 className="text-2xl font-black mt-10 mb-4" style={{ color: '#1B4332', letterSpacing: '-0.01em' }}>
            How to Find a 245D Provider During the Moratorium
          </h2>
          <ol className="list-decimal ml-6 space-y-2 text-gray-700 leading-relaxed mb-4">
            <li>Search the MN DHS licensed provider list at mn.gov/dhs</li>
            <li>Search CareConnect by county, waiver type, and service type</li>
            <li>Contact your county case manager — they maintain regional lists</li>
          </ol>

          <h2 className="text-2xl font-black mt-10 mb-4" style={{ color: '#1B4332', letterSpacing: '-0.01em' }}>
            Is There an Exception Process?
          </h2>
          <p className="text-gray-700 leading-relaxed mb-8">
            Yes. Lead agencies (counties, MCOs, tribal nations) can request exceptions for cases where no licensed provider exists locally. Source: mn.gov/dhs moratorium exceptions page.
          </p>

          <div className="mt-12 pt-8 border-t text-center" style={{ borderColor: '#D1FAE5' }}>
            <Link
              href="/providers"
              className="inline-block px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:opacity-90"
              style={{ background: '#1B4332' }}
            >
              Browse Verified 245D Providers →
            </Link>
            <p className="text-sm text-gray-500 mt-3">careconnectlive.org/providers</p>
          </div>
        </div>
      </article>
    </div>
  )
}
