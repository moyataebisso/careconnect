import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CADI Waiver Providers in Minnesota',
  description:
    'Find verified providers accepting Community Access for Disability Inclusion (CADI) waiver clients in Minnesota.',
}

export default function CadiWaiverPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F0FDF4' }}>
      <section style={{ background: '#1B4332' }} className="py-16">
        <div className="container mx-auto px-6">
          <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#95D5B2' }}>Waiver Program</p>
          <h1 className="text-4xl font-black text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
            CADI Waiver Providers in Minnesota
          </h1>
          <p className="text-lg" style={{ color: '#B7E4C7' }}>
            Community Access for Disability Inclusion — verified 245D licensed providers accepting CADI clients statewide
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8" style={{ borderColor: '#D1FAE5' }}>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Community Access for Disability Inclusion (CADI) waiver is a Minnesota Medicaid home and community-based services (HCBS) waiver for adults age 18 and older who require the level of care provided in a nursing facility but choose to live in the community. CADI supports independent living, employment, and community participation through funded services like personal care, residential support, and day programs.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              CareConnect lists verified 245D licensed providers accepting CADI waiver clients across Minnesota. Services covered under CADI and available through directory providers include Integrated Community Supports (ICS), Individualized Home Supports (IHS), Respite Care, Adult Day Services, Homemaker Services, Night Supervision, Family Residential Services (FRS), and Community Residential Services (CRS).
            </p>
            <p className="text-gray-700 leading-relaxed">
              With the DHS 245D licensing moratorium in effect through December 2027, existing CADI providers are seeing heightened demand. Browse verified providers with current openings below.
            </p>
          </div>

          <div className="text-center mb-12">
            <Link
              href="/providers?waiver=CADI"
              className="inline-block px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:opacity-90"
              style={{ background: '#1B4332' }}
            >
              Browse CADI Waiver Providers →
            </Link>
          </div>

          <div className="rounded-2xl p-8 text-center" style={{ background: '#1B4332' }}>
            <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#95D5B2' }}>For Providers</p>
            <h2 className="text-2xl font-black text-white mb-3" style={{ letterSpacing: '-0.01em' }}>
              Accepting CADI waiver clients?
            </h2>
            <p className="mb-6" style={{ color: '#B7E4C7' }}>
              List your 245D facility on CareConnect and get in front of case managers actively searching for CADI-approved providers.
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
