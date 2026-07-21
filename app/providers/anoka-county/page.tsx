import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '245D Providers in Anoka County, MN',
  description:
    'Find verified 245D licensed care facilities and HCBS providers in Anoka County, Minnesota. CADI, DD, BI, and Elderly waiver accepted.',
}

export default function AnokaCountyPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F0FDF4' }}>
      <section style={{ background: '#1B4332' }} className="py-16">
        <div className="container mx-auto px-6">
          <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#95D5B2' }}>Service Area</p>
          <h1 className="text-4xl font-black text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
            245D Providers in Anoka County, MN
          </h1>
          <p className="text-lg" style={{ color: '#B7E4C7' }}>
            Verified licensed HCBS providers across Blaine, Coon Rapids, Andover, and the northern metro
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8" style={{ borderColor: '#D1FAE5' }}>
            <p className="text-gray-700 leading-relaxed mb-4">
              Anoka County — including Blaine, Coon Rapids, Andover, Ham Lake, Ramsey, and Fridley — serves a growing waiver population across the northern Twin Cities metro. Since the DHS 245D licensing moratorium took effect in January 2026, existing licensed providers in Anoka County are absorbing increased demand from families and case managers with limited options.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              CareConnect lists verified 245D providers offering Integrated Community Supports (ICS), Individualized Home Supports (IHS), Family Residential Services (FRS), Community Residential Services (CRS), Adult Day Services, Respite Care, and more. All directory providers accept one or more waiver types: CADI, DD, BI, or Elderly.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Whether you&apos;re a case manager placing a client, a family member searching for the right residential setting, or a discharge planner coordinating post-hospital care, browse Anoka County providers with current openings below.
            </p>
          </div>

          <div className="text-center mb-12">
            <Link
              href="/providers?county=anoka"
              className="inline-block px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:opacity-90"
              style={{ background: '#1B4332' }}
            >
              Browse Anoka County Providers →
            </Link>
          </div>

          <div className="rounded-2xl p-8 text-center" style={{ background: '#1B4332' }}>
            <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#95D5B2' }}>For Providers</p>
            <h2 className="text-2xl font-black text-white mb-3" style={{ letterSpacing: '-0.01em' }}>
              Serving Anoka County families?
            </h2>
            <p className="mb-6" style={{ color: '#B7E4C7' }}>
              Get in front of case managers, social workers, and discharge planners actively searching for verified providers.
            </p>
            <Link
              href="/auth/register"
              className="inline-block px-8 py-3 rounded-xl font-bold transition-all hover:opacity-90"
              style={{ background: '#95D5B2', color: '#1B4332' }}
            >
              List Your Facility — $99.99/mo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
